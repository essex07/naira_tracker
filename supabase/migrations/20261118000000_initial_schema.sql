-- ============================================================================
-- NairaTrack — Supabase schema
-- ----------------------------------------------------------------------------
-- Run this entire file once in the Supabase SQL Editor, or apply it with the
-- Supabase CLI (`supabase db push`). It is intentionally ordered:
--   1. enum + tables + indexes
--   2. reporting views
--   3. database functions (all writes go through these)
--   4. triggers
--   5. row-level security + grants
--
-- Money is stored as numeric(12,2). Dates are stored as dates, so there is no
-- timezone drift. Budget weeks are calendar weeks inside the month (1–7,
-- 8–14, 15–21, 22–end).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Core types and tables
-- ----------------------------------------------------------------------------

create type public.expense_category as enum (
  'survival',
  'transport',
  'food',
  'debt',
  'savings',
  'others'
);

comment on type public.expense_category is
  'The six budget buckets. Savings is money set aside, not spending.';

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text check (
    full_name is null or char_length(btrim(full_name)) between 1 and 80
  ),
  income_target numeric(12,2) not null default 300000
    check (income_target > 0 and income_target <= 100000000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'One profile per auth user. income_target drives the expected-savings ratio.';

create table public.categories (
  key public.expense_category primary key,
  label text not null unique,
  monthly_cap numeric(12,2) not null check (monthly_cap >= 0),
  weekly_cap numeric(12,2) check (weekly_cap is null or weekly_cap > 0),
  sort_order smallint not null unique,
  is_savings boolean not null default false,
  constraint categories_weekly_cap_matches_key
    check ((key in ('survival', 'transport')) = (weekly_cap is not null))
);

comment on table public.categories is
  'Static reference table for the ₦300,000 plan. Caps total exactly ₦300,000.';

insert into public.categories
  (key, label, monthly_cap, weekly_cap, sort_order, is_savings)
values
  ('survival',  'Survival',   60000, 15000, 1, false),
  ('transport', 'Transport',  30000,  7500, 2, false),
  ('food',      'Food stuff', 25000,  null, 3, false),
  ('debt',      'Debt',       85000,  null, 4, false),
  ('savings',   'Savings',    80000,  null, 5, true),
  ('others',    'Others',     20000,  null, 6, false)
on conflict (key) do update set
  label = excluded.label,
  monthly_cap = excluded.monthly_cap,
  weekly_cap = excluded.weekly_cap,
  sort_order = excluded.sort_order,
  is_savings = excluded.is_savings;

create table public.budget_months (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  month_start date not null,
  topup_applied_at timestamptz,
  created_at timestamptz not null default now(),
  constraint budget_months_first_day
    check (extract(day from month_start) = 1),
  constraint budget_months_user_month_unique unique (user_id, month_start)
);

comment on table public.budget_months is
  'A row exists only after the user presses Top up. It marks that all cash left before this month has been brought forward.';

create table public.salary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric(12,2) not null
    check (amount > 0 and amount <= 100000000),
  received_on date not null,
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now()
);

comment on table public.salary_entries is
  'Every salary payment is recorded separately, so inconsistent dates and split payments are supported.';

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_key public.expense_category not null
    references public.categories (key) on update cascade,
  description text not null
    check (char_length(btrim(description)) between 1 and 120),
  amount numeric(12,2) not null
    check (amount > 0 and amount <= 100000000),
  occurred_on date not null,
  created_at timestamptz not null default now()
);

comment on table public.expenses is
  'Actual outflows. Savings and debt entries live here too, because they reduce the cash available to spend.';

create index salary_entries_user_date_idx
  on public.salary_entries (user_id, received_on desc);

create index expenses_user_date_idx
  on public.expenses (user_id, occurred_on desc);

create index expenses_user_category_date_idx
  on public.expenses (user_id, category_key, occurred_on desc);

-- ----------------------------------------------------------------------------
-- 2. Reporting views
-- ----------------------------------------------------------------------------

create view public.monthly_category_totals
with (security_invoker = true)
as
select
  user_id,
  date_trunc('month', occurred_on)::date as month_start,
  category_key,
  sum(amount) as spent
from public.expenses
group by user_id, date_trunc('month', occurred_on)::date, category_key;

comment on view public.monthly_category_totals is
  'Spend per bucket per month. security_invoker keeps RLS in force.';

create view public.weekly_category_totals
with (security_invoker = true)
as
select
  user_id,
  date_trunc('month', occurred_on)::date as month_start,
  category_key,
  least(((extract(day from occurred_on)::integer - 1) / 7) + 1, 4) as week_index,
  sum(amount) as spent
from public.expenses
group by
  user_id,
  date_trunc('month', occurred_on)::date,
  category_key,
  least(((extract(day from occurred_on)::integer - 1) / 7) + 1, 4);

comment on view public.weekly_category_totals is
  'Spend per bucket per budget week. Week 4 covers day 22 to month end.';

-- ----------------------------------------------------------------------------
-- 3. Functions
-- ----------------------------------------------------------------------------

-- Profiles are created automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), '')
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Record one salary payment. p_date defaults to today in the app's SQL call.
create or replace function public.add_salary(
  p_amount numeric,
  p_received_on date default current_date,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
  v_today date := (current_timestamp at time zone 'Africa/Lagos')::date;
  v_note text;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_amount is null or p_amount <= 0 or p_amount > 100000000 then
    raise exception 'Salary amount must be greater than zero and no more than ₦100,000,000.'
      using errcode = '22023';
  end if;

  if p_received_on is null or p_received_on > v_today then
    raise exception 'Salary date cannot be in the future.' using errcode = '22023';
  end if;

  if p_received_on < date '2000-01-01' then
    raise exception 'Salary date is too far in the past.' using errcode = '22023';
  end if;

  v_note := nullif(btrim(coalesce(p_note, '')), '');
  if v_note is not null and char_length(v_note) > 200 then
    raise exception 'Salary note must be 200 characters or fewer.' using errcode = '22023';
  end if;

  insert into public.salary_entries (user_id, amount, received_on, note)
  values (v_user_id, round(p_amount, 2), p_received_on, v_note)
  returning id into v_id;

  return v_id;
end;
$$;

-- Record one expense. The client chooses the category (auto-matched in the UI),
-- but the database is the final authority on the value and amount.
create or replace function public.add_expense(
  p_description text,
  p_category public.expense_category,
  p_amount numeric,
  p_occurred_on date default current_date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
  v_today date := (current_timestamp at time zone 'Africa/Lagos')::date;
  v_description text := btrim(coalesce(p_description, ''));
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if char_length(v_description) < 1 or char_length(v_description) > 120 then
    raise exception 'Description must be between 1 and 120 characters.'
      using errcode = '22023';
  end if;

  if p_category is null or not exists (
    select 1 from public.categories where key = p_category
  ) then
    raise exception 'Choose a valid category.' using errcode = '22023';
  end if;

  if p_amount is null or p_amount <= 0 or p_amount > 100000000 then
    raise exception 'Expense amount must be greater than zero and no more than ₦100,000,000.'
      using errcode = '22023';
  end if;

  if p_occurred_on is null or p_occurred_on > v_today then
    raise exception 'Expense date cannot be in the future.' using errcode = '22023';
  end if;

  if p_occurred_on < date '2000-01-01' then
    raise exception 'Expense date is too far in the past.' using errcode = '22023';
  end if;

  insert into public.expenses (user_id, category_key, description, amount, occurred_on)
  values (v_user_id, p_category, v_description, round(p_amount, 2), p_occurred_on)
  returning id into v_id;

  return v_id;
end;
$$;

-- Marks the selected current month as having brought forward all prior cash.
-- The amount itself is always derived live (income minus outflows before the
-- month), so later corrections to an old month stay accurate.
create or replace function public.apply_topup(p_month date default current_date)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := (current_timestamp at time zone 'Africa/Lagos')::date;
  v_month date := date_trunc('month', coalesce(p_month, v_today))::date;
  v_prior_income numeric(12,2) := 0;
  v_prior_outflow numeric(12,2) := 0;
  v_prior_net numeric(12,2) := 0;
  v_applied_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if v_month <> date_trunc('month', v_today)::date then
    raise exception 'Top-ups can only be applied to the current month.'
      using errcode = '22023';
  end if;

  select coalesce(sum(amount), 0)
    into v_prior_income
  from public.salary_entries
  where user_id = v_user_id
    and received_on < v_month;

  select coalesce(sum(amount), 0)
    into v_prior_outflow
  from public.expenses
  where user_id = v_user_id
    and occurred_on < v_month;

  v_prior_net := v_prior_income - v_prior_outflow;

  insert into public.budget_months (user_id, month_start, topup_applied_at)
  values (v_user_id, v_month, now())
  on conflict (user_id, month_start) do update
    set topup_applied_at = coalesce(
      public.budget_months.topup_applied_at,
      excluded.topup_applied_at
    )
  returning topup_applied_at into v_applied_at;

  return jsonb_build_object(
    'priorNet', v_prior_net,
    'appliedAt', v_applied_at
  );
end;
$$;

create or replace function public.delete_salary(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  delete from public.salary_entries
  where id = p_id and user_id = v_user_id;

  get diagnostics v_count = row_count;
  if v_count = 0 then
    raise exception 'Salary entry not found.' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.delete_expense(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  delete from public.expenses
  where id = p_id and user_id = v_user_id;

  get diagnostics v_count = row_count;
  if v_count = 0 then
    raise exception 'Expense not found.' using errcode = 'P0002';
  end if;
end;
$$;

-- Single round-trip read used by the dashboard. Returns every number the UI
-- needs: month totals, category caps, weekly windows, expected savings,
-- brought-forward cash and recent transactions.
create or replace function public.get_dashboard(p_month date default current_date)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := (current_timestamp at time zone 'Africa/Lagos')::date;
  v_month date;
  v_next_month date;
  v_month_end date;
  v_is_current boolean;

  v_full_name text;
  v_email text;
  v_income_target numeric(12,2) := 300000;

  v_income numeric(12,2) := 0;
  v_income_count integer := 0;
  v_outflow numeric(12,2) := 0;
  v_prior_income numeric(12,2) := 0;
  v_prior_outflow numeric(12,2) := 0;
  v_prior_net numeric(12,2) := 0;
  v_topup_at timestamptz;
  v_opening numeric(12,2) := 0;
  v_available numeric(12,2) := 0;

  v_plan_cap numeric(12,2) := 0;
  v_savings_cap numeric(12,2) := 80000;
  v_savings_expected numeric(12,2) := 0;
  v_savings_actual numeric(12,2) := 0;

  v_current_week integer;
  v_categories jsonb := '[]'::jsonb;
  v_salary_entries jsonb := '[]'::jsonb;
  v_expenses jsonb := '[]'::jsonb;
  v_expense_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  v_month := date_trunc('month', coalesce(p_month, v_today))::date;
  if v_month > date_trunc('month', v_today)::date then
    v_month := date_trunc('month', v_today)::date;
  end if;

  v_next_month := (v_month + interval '1 month')::date;
  v_month_end := (v_next_month - interval '1 day')::date;
  v_is_current := v_month = date_trunc('month', v_today)::date;

  if v_is_current then
    v_current_week := least(((extract(day from v_today)::integer - 1) / 7) + 1, 4);
  else
    v_current_week := null;
  end if;

  select income_target, full_name, email
    into v_income_target, v_full_name, v_email
  from public.profiles
  where id = v_user_id;

  if not found then
    v_income_target := 300000;
  end if;

  select
    coalesce(sum(monthly_cap), 0),
    coalesce(max(monthly_cap) filter (where is_savings), 0)
    into v_plan_cap, v_savings_cap
  from public.categories;

  select coalesce(sum(amount), 0), count(*)::integer
    into v_income, v_income_count
  from public.salary_entries
  where user_id = v_user_id
    and received_on >= v_month
    and received_on < v_next_month;

  select coalesce(sum(amount), 0)
    into v_outflow
  from public.expenses
  where user_id = v_user_id
    and occurred_on >= v_month
    and occurred_on < v_next_month;

  select coalesce(sum(amount), 0)
    into v_prior_income
  from public.salary_entries
  where user_id = v_user_id
    and received_on < v_month;

  select coalesce(sum(amount), 0)
    into v_prior_outflow
  from public.expenses
  where user_id = v_user_id
    and occurred_on < v_month;

  v_prior_net := v_prior_income - v_prior_outflow;

  select topup_applied_at
    into v_topup_at
  from public.budget_months
  where user_id = v_user_id
    and month_start = v_month;

  if v_topup_at is not null then
    v_opening := v_prior_net;
  end if;

  v_available := v_opening + v_income - v_outflow;

  select coalesce(sum(e.amount), 0)
    into v_savings_actual
  from public.expenses e
  join public.categories c on c.key = e.category_key
  where e.user_id = v_user_id
    and c.is_savings
    and e.occurred_on >= v_month
    and e.occurred_on < v_next_month;

  if v_income_target > 0 then
    v_savings_expected := round(
      v_savings_cap * least(v_income / v_income_target, 1),
      2
    );
  end if;

  select coalesce(jsonb_agg(cat_json order by sort_order), '[]'::jsonb)
    into v_categories
  from (
    select
      c.sort_order,
      jsonb_build_object(
        'key', c.key,
        'label', c.label,
        'monthlyCap', c.monthly_cap,
        'weeklyCap', c.weekly_cap,
        'spent', coalesce(mt.spent, 0),
        'remaining', c.monthly_cap - coalesce(mt.spent, 0),
        'percent', case
          when c.monthly_cap > 0 then
            round(least(coalesce(mt.spent, 0) / c.monthly_cap, 1) * 100, 1)
          else 0
        end,
        'isSavings', c.is_savings,
        'weeks', case
          when c.weekly_cap is null then '[]'::jsonb
          else (
            select coalesce(
              jsonb_agg(
                jsonb_build_object(
                  'week', w.week_index,
                  'start', v_month + ((w.week_index - 1) * 7),
                  'end', case
                    when w.week_index = 4 then v_month_end
                    else v_month + ((w.week_index * 7) - 1)
                  end,
                  'spent', coalesce(wt.spent, 0),
                  'remaining', c.weekly_cap - coalesce(wt.spent, 0),
                  'percent', case
                    when c.weekly_cap > 0 then
                      round(least(coalesce(wt.spent, 0) / c.weekly_cap, 1) * 100, 1)
                    else 0
                  end
                )
                order by w.week_index
              ),
              '[]'::jsonb
            )
            from generate_series(1, 4) as w(week_index)
            left join public.weekly_category_totals wt
              on wt.user_id = v_user_id
             and wt.month_start = v_month
             and wt.category_key = c.key
             and wt.week_index = w.week_index
          )
        end
      ) as cat_json
    from public.categories c
    left join public.monthly_category_totals mt
      on mt.user_id = v_user_id
     and mt.month_start = v_month
     and mt.category_key = c.key
  ) s;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'amount', s.amount,
        'receivedOn', s.received_on,
        'note', s.note,
        'createdAt', s.created_at
      )
      order by s.received_on desc, s.created_at desc
    ),
    '[]'::jsonb
  )
    into v_salary_entries
  from public.salary_entries s
  where s.user_id = v_user_id
    and s.received_on >= v_month
    and s.received_on < v_next_month;

  select count(*)::integer
    into v_expense_count
  from public.expenses
  where user_id = v_user_id
    and occurred_on >= v_month
    and occurred_on < v_next_month;

  select coalesce(jsonb_agg(row_json order by occurred_on desc, created_at desc), '[]'::jsonb)
    into v_expenses
  from (
    select
      jsonb_build_object(
        'id', e.id,
        'categoryKey', e.category_key,
        'description', e.description,
        'amount', e.amount,
        'occurredOn', e.occurred_on,
        'createdAt', e.created_at
      ) as row_json,
      e.occurred_on,
      e.created_at
    from public.expenses e
    where e.user_id = v_user_id
      and e.occurred_on >= v_month
      and e.occurred_on < v_next_month
    order by e.occurred_on desc, e.created_at desc
    limit 200
  ) recent;

  return jsonb_build_object(
    'monthStart', v_month,
    'isCurrentMonth', v_is_current,
    'currentWeek', v_current_week,
    'today', v_today,
    'user', jsonb_build_object(
      'fullName', coalesce(v_full_name, ''),
      'email', coalesce(v_email, ''),
      'incomeTarget', v_income_target
    ),
    'income', jsonb_build_object(
      'target', v_income_target,
      'received', v_income,
      'remaining', greatest(v_income_target - v_income, 0),
      'overTarget', greatest(v_income - v_income_target, 0),
      'progress', case
        when v_income_target > 0 then least(v_income / v_income_target, 1)
        else 0
      end,
      'entryCount', v_income_count
    ),
    'balance', jsonb_build_object(
      'opening', v_opening,
      'priorNet', v_prior_net,
      'topupAppliedAt', v_topup_at,
      'topupAvailable', case
        when v_topup_at is null and v_is_current then v_prior_net
        else 0
      end,
      'canTopUp', v_is_current and v_topup_at is null and v_prior_net <> 0,
      'income', v_income,
      'outflow', v_outflow,
      'available', v_available
    ),
    'savings', jsonb_build_object(
      'cap', v_savings_cap,
      'expected', v_savings_expected,
      'actual', v_savings_actual,
      'difference', v_savings_actual - v_savings_expected
    ),
    'plan', jsonb_build_object(
      'totalCap', v_plan_cap,
      'totalSpent', v_outflow,
      'totalRemaining', v_plan_cap - v_outflow
    ),
    'categories', v_categories,
    'salaryEntries', v_salary_entries,
    'expenses', v_expenses,
    'expenseCount', v_expense_count,
    'generatedAt', now()
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- 4. Triggers
-- ----------------------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- Backfill profiles if this migration is applied to a project that already has
-- auth users. Safe to run on a fresh project (it inserts nothing).
insert into public.profiles (id, email, full_name)
select
  u.id,
  u.email,
  coalesce(
    nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), '')
  )
from auth.users u
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 5. Row Level Security
-- ----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.budget_months enable row level security;
alter table public.salary_entries enable row level security;
alter table public.expenses enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "categories_read_authenticated"
  on public.categories for select
  to authenticated
  using (true);

create policy "budget_months_select_own"
  on public.budget_months for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "salary_entries_select_own"
  on public.salary_entries for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "expenses_select_own"
  on public.expenses for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- 6. Grants
-- ----------------------------------------------------------------------------
-- Clients can read their own rows. All writes go through the SECURITY DEFINER
-- functions above, which check auth.uid() themselves.

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name, income_target) on table public.profiles to authenticated;

revoke all on table public.categories from anon, authenticated;
grant select on table public.categories to authenticated;

revoke all on table public.budget_months from anon, authenticated;
grant select on table public.budget_months to authenticated;

revoke all on table public.salary_entries from anon, authenticated;
grant select on table public.salary_entries to authenticated;

revoke all on table public.expenses from anon, authenticated;
grant select on table public.expenses to authenticated;

revoke all on table public.monthly_category_totals from anon, authenticated;
grant select on table public.monthly_category_totals to authenticated;

revoke all on table public.weekly_category_totals from anon, authenticated;
grant select on table public.weekly_category_totals to authenticated;

revoke all on function public.handle_new_user() from public;
revoke all on function public.set_updated_at() from public;

revoke all on function public.add_salary(numeric, date, text) from public;
grant execute on function public.add_salary(numeric, date, text) to authenticated;

revoke all on function public.add_expense(text, public.expense_category, numeric, date) from public;
grant execute on function public.add_expense(text, public.expense_category, numeric, date) to authenticated;

revoke all on function public.apply_topup(date) from public;
grant execute on function public.apply_topup(date) to authenticated;

revoke all on function public.delete_salary(uuid) from public;
grant execute on function public.delete_salary(uuid) to authenticated;

revoke all on function public.delete_expense(uuid) from public;
grant execute on function public.delete_expense(uuid) to authenticated;

revoke all on function public.get_dashboard(date) from public;
grant execute on function public.get_dashboard(date) to authenticated;
