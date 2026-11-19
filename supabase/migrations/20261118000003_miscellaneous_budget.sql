-- ============================================================================
-- NairaTrack — rebalance the ₦300,000 plan
-- ----------------------------------------------------------------------------
-- Savings moves from ₦80,000 to ₦60,000. The freed ₦20,000 becomes a new
-- Miscellaneous envelope capped at ₦20,000.
--
-- The final plan:
--   Survival       ₦60,000
--   Transport      ₦30,000
--   Food stuff     ₦25,000
--   Debt           ₦85,000
--   Savings        ₦60,000
--   Others         ₦20,000
--   Miscellaneous  ₦20,000
--   ----------------------
--   Total         ₦300,000
--
-- get_dashboard() and set_debt_status() read these caps from public.categories,
-- so both the base plan and debt-free mode update automatically.
--
-- Run this after 20261118000002_miscellaneous_enum.sql.
-- This migration is idempotent.
-- ============================================================================

update public.categories
set monthly_cap = 60000
where key = 'savings';

insert into public.categories
  (key, label, monthly_cap, weekly_cap, sort_order, is_savings)
values
  ('miscellaneous', 'Miscellaneous', 20000, null, 7, false)
on conflict (key) do update set
  label = excluded.label,
  monthly_cap = excluded.monthly_cap,
  weekly_cap = excluded.weekly_cap,
  sort_order = excluded.sort_order,
  is_savings = excluded.is_savings;

comment on table public.categories is
  'Static reference table for the seven-bucket plan. The default caps total exactly ₦300,000.';
