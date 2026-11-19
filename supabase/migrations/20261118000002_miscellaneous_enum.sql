-- ============================================================================
-- NairaTrack — add the Miscellaneous category key
-- ----------------------------------------------------------------------------
-- PostgreSQL requires a new enum value to be committed before it is used by
-- another migration. Keeping this in its own file makes the upgrade safe for
-- both the Supabase CLI and the SQL Editor.
--
-- Run this after 20261118000001_debt_free.sql.
-- ============================================================================

alter type public.expense_category
  add value if not exists 'miscellaneous' after 'others';

comment on type public.expense_category is
  'The seven budget buckets. Savings is money set aside, not spending.';
