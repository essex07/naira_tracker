-- ============================================================================
-- NairaTrack — debt-free mode
-- ----------------------------------------------------------------------------
-- Adds a per-user "debt fully paid" state. When a user marks their debt as
-- paid, the Debt monthly allocation is moved to Savings from that month
-- onward. Historical months keep their original plan.
--
-- This migration is safe to run after 20261118000000_initial_schema.sql, and
-- is idempotent. Run it in the Supabase SQL Editor (or with `supabase db push`)
-- after the initial migration.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Debt-free marker
-- ----------------------------------------------------------------------------

alter table public.profiles
  add column if not exists debt_free_at timestamptz;

comment on column public.profiles.debt_free_at is
  'When the user marked debt as fully paid. Null means the Debt envelope is active. The month of this timestamp is when the reallocation starts.';

-- ----------------------------------------------------------------------------
-- 2. Mark or reopen debt
-- ----------------------------------------------------------------------------

create or replace function public.set_debt_status(p_debt_free boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_debt_free_at timestamptz;
  v_debt_cap numeric(12,2) := 0;
  v_savings_cap numeric(12,2) := 0;
  v_effective_savings_cap numeric(12,2) := 0;
  v_moved numeric(12,2) := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_debt_free is null then
    raise exception 'Choose a valid debt status.' using errcode = '22023';
  end if;

  update public.profiles
  set debt_free_at = case
        when p_debt_free then coalesce(debt_free_at, now())
        else null
      end
  where id = v_user_id
  returning debt_free_at into v_debt_free_at;

  if not found then
    raise exception 'Profile not found.' using errcode = 'P0002';
  end if;

  select
    coalesce(max(monthly_cap) filter (where key = 'debt'::public.expense_category), 0),
    coalesce(max(monthly_cap) filter (where is_savings), 0)
  into v_debt_cap, v_savings_cap
  from public.categories;

  if v_debt_free_at is not null then
    v_moved := v_debt_cap;
  end if;

  v_effective_savings_cap := v_savings_cap + v_moved;

  return jsonb_build_object(
    'debtFree', v_debt_free_at is not null,
    'since', v_debt_free_at,
    'monthlyAllocation', v_debt_cap,
    'movedToSavings', v_moved,
    'savingsCap', v_effective_savings_cap
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. Dashboard with debt-free effective caps
-- ----------------------------------------------------------------------------

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
  v_debt_free_at timestamptz;
  v_debt_free boolean := false;
  v_debt_free_applies boolean := false;

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
  v_base_savings_cap numeric(12,2) := 80000;
  v_base_debt_cap numeric(12,2) := 85000;
  v_effective_savings_cap numeric(12,2) := 80000;
  v_moved_to_savings numeric(12,2) := 0;
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

  select income_target, full_name, email, debt_free_at
    into v_income_target, v_full_name, v_email, v_debt_free_at
  from public.profiles
  where id = v_user_id;

  if not found then
    v_income_target := 300000;
    v_debt_free_at := null;
  end if;

  v_debt_free := v_debt_free_at is not null;

  if v_debt_free then
    v_debt_free_applies := v_month >= date_trunc(
      'month',
      v_debt_free_at at time zone 'Africa/Lagos'
    )::date;
  end if;

  select
    coalesce(sum(monthly_cap), 0),
    coalesce(max(monthly_cap) filter (where is_savings), 0),
    coalesce(max(monthly_cap) filter (where key = 'debt'::public.expense_category), 0)
  into v_plan_cap, v_base_savings_cap, v_base_debt_cap
  from public.categories;

  v_effective_savings_cap := v_base_savings_cap;

  if v_debt_free_applies then
    v_effective_savings_cap := v_base_savings_cap + v_base_debt_cap;
    v_moved_to_savings := v_base_debt_cap;
  end if;

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
      v_effective_savings_cap * least(v_income / v_income_target, 1),
      2
    );
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'key', ec.key,
        'label', ec.label,
        'monthlyCap', ec.cap,
        'baseMonthlyCap', ec.base_cap,
        'weeklyCap', ec.weekly_cap,
        'spent', ec.spent,
        'remaining', case
          when ec.settled then 0
          else ec.cap - ec.spent
        end,
        'percent', case
          when ec.settled then 0
          when ec.cap > 0 then
            round(least(ec.spent / ec.cap, 1) * 100, 1)
          else 0
        end,
        'isSavings', ec.is_savings,
        'settled', ec.settled,
        'weeks', case
          when ec.weekly_cap is null then '[]'::jsonb
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
                  'remaining', ec.weekly_cap - coalesce(wt.spent, 0),
                  'percent', case
                    when ec.weekly_cap > 0 then
                      round(least(coalesce(wt.spent, 0) / ec.weekly_cap, 1) * 100, 1)
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
             and wt.category_key = ec.key
             and wt.week_index = w.week_index
          )
        end
      )
      order by ec.sort_order
    ),
    '[]'::jsonb
  )
    into v_categories
  from (
    select
      c.sort_order,
      c.key,
      c.label,
      c.monthly_cap as base_cap,
      c.weekly_cap,
      c.is_savings,
      coalesce(mt.spent, 0) as spent,
      case
        when v_debt_free_applies and c.key = 'debt'::public.expense_category then 0
        when v_debt_free_applies and c.is_savings
          then c.monthly_cap + v_base_debt_cap
        else c.monthly_cap
      end as cap,
      (v_debt_free_applies and c.key = 'debt'::public.expense_category) as settled
    from public.categories c
    left join public.monthly_category_totals mt
      on mt.user_id = v_user_id
     and mt.month_start = v_month
     and mt.category_key = c.key
  ) ec;

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
      'cap', v_effective_savings_cap,
      'baseCap', v_base_savings_cap,
      'expected', v_savings_expected,
      'actual', v_savings_actual,
      'difference', v_savings_actual - v_savings_expected
    ),
    'debtFree', jsonb_build_object(
      'active', v_debt_free,
      'since', v_debt_free_at,
      'appliesToMonth', v_debt_free_applies,
      'monthlyAllocation', v_base_debt_cap,
      'movedToSavings', v_moved_to_savings,
      'savingsCap', v_effective_savings_cap
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
-- 4. Grants
-- ----------------------------------------------------------------------------

revoke all on function public.set_debt_status(boolean) from public;
grant execute on function public.set_debt_status(boolean) to authenticated;

revoke all on function public.get_dashboard(date) from public;
grant execute on function public.get_dashboard(date) to authenticated;
