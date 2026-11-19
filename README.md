# NairaTrack

A private, multi-user salary and expense tracker built around a **₦300,000 monthly plan**. It is designed for a salary that arrives in different amounts on different days: record each payment when it lands, type an expense and press Enter, and let the dashboard recalculate the month.

Built with **Next.js 16**, **TypeScript**, **Tailwind CSS 4**, and **Supabase** (Postgres, Auth, row-level security).

---

## The plan

| Category | Monthly cap | Weekly cap |
| --- | ---: | ---: |
| Survival | ₦60,000 | ₦15,000 |
| Transport | ₦30,000 | ₦7,500 |
| Food stuff | ₦25,000 | — |
| Debt | ₦85,000 | — |
| Savings | ₦60,000 | — |
| Others | ₦20,000 | — |
| Miscellaneous | ₦20,000 | — |
| **Total** | **₦300,000** | |

The **Miscellaneous** envelope is a normal spending cap for unplanned extras and one-offs. It is separate from Savings.

When you mark debt as fully paid, the **₦85,000 Debt allocation moves to Savings**, raising the Savings cap to **₦145,000**. The total plan stays ₦300,000.

Weekly caps apply to **Survival** and **Transport** only. Budget weeks are calendar weeks inside the month:

- Week 1 — days 1–7
- Week 2 — days 8–14
- Week 3 — days 15–21
- Week 4 — day 22 to the end of the month

---

## What the app does

- **Email/password authentication** with email confirmation and protected routes.
- **Salary entry bar** — record every payment separately. Split payments and inconsistent dates are fully supported.
- **Smart expense bar** — type a description such as `danfo and keke fare to work`, and the category is matched automatically. You can always override the match before pressing Enter.
- **Live impact preview** — before saving, see how an expense affects the category cap, weekly limit, available balance, and savings shadow.
- **Seven category cards** — monthly cap, spent, remaining, progress bar, and per-week grids for Survival and Transport.
- **Miscellaneous envelope** — a dedicated ₦20,000 cap for unplanned extras and one-offs, separate from Others and Savings.
- **Savings shadow** — expected savings scales with salary actually received; actual savings is the total recorded under Savings. It is a comparison, not an extra expense.
- **Debt-free mode** — mark the debt as fully paid and the monthly Debt allocation moves to Savings automatically. The status can be reopened if you take on new debt.
- **Top-up / carry-forward** — bring the net cash left from earlier months into the current month as an opening balance. Deficits are carried honestly too.
- **Month navigation** — review earlier months, backfill entries, and switch back to the current month. Future months cannot be opened.
- **Transaction ledger** — every salary and expense in the selected month, with delete.
- **Overspending guardrails** — expenses are never blocked. The app warns clearly when a category or weekly limit is exceeded, because real life does not stop at a cap.
- **Per-user isolation** — every row is protected by row-level security. The second account sees none of the first account's data.
- **Responsive UI** — desktop sidebar and mobile header, designed for Nigerian usage patterns and Naira formatting.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16.4 (App Router, Server Components, Server Actions) |
| Language | TypeScript 5.9 |
| Styling | Tailwind CSS 4.3 |
| Database | Supabase Postgres |
| Auth | Supabase Auth (email/password, SSR cookies) |
| Validation | Zod 4 |
| Icons | lucide-react |
| Fonts | Fraunces + Manrope via `next/font` |

---

## Quick start

### 1. Requirements

- **Node.js 20.9 or newer** (Node 22/24 recommended)
- A free [Supabase](https://supabase.com) account
- npm (or pnpm/yarn if you adapt the commands)

### 2. Create the Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a project.
2. Wait for the database to finish provisioning.
3. Open **SQL Editor** → **New query**.
4. Run the migrations **in this order**, one file at a time:
   1. [`supabase/migrations/20261118000000_initial_schema.sql`](supabase/migrations/20261118000000_initial_schema.sql) — the initial schema. Run this once.
   2. [`supabase/migrations/20261118000001_debt_free.sql`](supabase/migrations/20261118000001_debt_free.sql) — adds debt-free mode. This file is idempotent.
   3. [`supabase/migrations/20261118000002_miscellaneous_enum.sql`](supabase/migrations/20261118000002_miscellaneous_enum.sql) — adds the `miscellaneous` category key. This file is idempotent.
   4. [`supabase/migrations/20261118000003_miscellaneous_budget.sql`](supabase/migrations/20261118000003_miscellaneous_budget.sql) — rebalances Savings to ₦60,000 and adds Miscellaneous at ₦20,000. This file is idempotent.

The first file creates the tables, views, functions, triggers, RLS policies, and grants. Do not re-run it on an existing database: it will fail on the `create type` / `create table` statements. The later files are safe to re-run.

**Upgrading an existing database?** If you already ran the initial schema and debt-free migration, run the two new files in order: `20261118000002_miscellaneous_enum.sql`, then `20261118000003_miscellaneous_budget.sql`. They do not touch salary or expense rows. If you never ran the debt-free migration, run it first.

> Run the enum migration as its own query/file before the budget migration. PostgreSQL must commit the new `miscellaneous` enum value before a row can use it.

> If you use the Supabase CLI instead, link the project and run `supabase db push`. The migration files are already named with timestamps for the CLI.

### 3. Configure authentication

In the Supabase dashboard:

1. **Authentication → Providers → Email** — make sure Email is enabled.
2. **Authentication → Sign In / Providers** — decide whether **Confirm email** is on.
   - On (recommended): new accounts must confirm their email before signing in. The app shows a "check your inbox" screen and handles the callback.
   - Off: sign-up signs the user in immediately.
3. **Authentication → URL Configuration**:
   - **Site URL:** `http://localhost:3000` for local development.
   - **Redirect URLs:** add
     - `http://localhost:3000/auth/callback`
     - your production callback, e.g. `https://your-domain.com/auth/callback`

For production email delivery, configure custom SMTP under **Authentication → Emails / SMTP**. The built-in email service is rate-limited and intended for testing.

### 4. Add environment variables

Copy the example file:

```bash
cp .env.example .env.local
```

Then fill in the values from **Project Settings → API**:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- Use the **publishable key** (new Supabase projects). Legacy projects can use `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead; the code supports either.
- **Never** put the `service_role` / secret key in this file. The browser and server components only need the public key. All privileged writes happen through database functions that check the signed-in user.

### 5. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, confirm your email if required, and sign in.

### 6. First five minutes in the app

1. Record your first salary payment.
2. Add an expense such as `transport fare to work` — Transport should be selected automatically.
3. Watch the Survival/Transport weekly grids and the expected-savings shadow update.
4. When the final debt payment is made, press **Mark debt as fully paid** on the Debt card.
5. At the start of a new month, press **Top up** to bring the previous month's net cash forward.

---

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes* | Public publishable key. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes* | Legacy anon key, used if the publishable key is absent. |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Absolute URL used in confirmation-email redirects. Falls back to the request origin, but set it explicitly in production. |

\* One of the two keys is required.

---

## How the money math works

### Salary

- Every payment is stored as a separate `salary_entries` row with its own `received_on` date.
- Salary counts toward the month containing `received_on`.
- The monthly target comes from `profiles.income_target` (default **₦300,000**). Payments above the target are shown as extra, not rejected.

### Expenses and caps

- Every expense is stored, even when it pushes a category over its cap.
- A category's remaining amount is `monthly_cap - spent`; it may be negative and is displayed as an overage.
- **Available this month** = `opening balance + salary received - all outflows`.
- Outflows include Savings and Debt. Setting money aside or repaying a loan reduces the cash you can spend, even though Savings is not consumption.
- **Plan used** is the sum of all outflows in the month. **Left across caps** is `₦300,000 - plan used`.

### Weekly limits (Survival and Transport)

Each expense in these categories reduces:

1. the weekly remaining amount for the week it occurred in,
2. the monthly category remaining amount,
3. the total available balance.

The weekly grid shows all four weeks of the selected month. An expense that exceeds the weekly cap is still saved and flagged; it is not blocked.

### Expected savings (the shadow)

```
expected savings = ₦60,000 × min(salary received this month ÷ ₦300,000, 1)
actual savings   = total recorded under the Savings category
difference       = actual savings − expected savings
```

The expected figure is **never** added to expenses or subtracted from the balance. It is a pacing reference. In the base plan, expected savings is ₦60,000 at full salary and ₦30,000 at half salary. Once debt-free, the ₦145,000 effective savings cap is used instead (see below).

### Debt-free mode

Pressing **Mark debt as fully paid** on the Debt card changes the plan, not your cash:

```
Debt effective cap    = ₦0
Savings effective cap = savings base cap + debt base cap
                      = ₦60,000 + ₦85,000
                      = ₦145,000
Expected savings      = ₦145,000 × min(salary received ÷ ₦300,000, 1)
```

- The reallocation starts with the month in which you mark the debt as paid.
- Earlier months keep their original Debt and Savings caps. Viewing an old month will not rewrite its plan.
- The total plan remains ₦300,000; nothing is added or removed. Miscellaneous stays at ₦20,000 and is not affected.
- **No fake savings transaction is inserted.** The ₦85,000 is an allocation. Record a Savings expense when you actually move the cash.
- **Reopen debt** restores the original ₦85,000 Debt cap and returns Savings to its base cap. Existing entries are never changed.
- If you record a new Debt expense while marked debt-free, it is still saved, but the expense panel warns that it sits outside the plan.

### Top-up / carry-forward

- A top-up can only be applied to the **current month**.
- Pressing the button creates a `budget_months` row with `topup_applied_at`. That row is only a marker.
- The opening balance is always **derived live**:
  ```
  opening = (all salary before this month) − (all expenses before this month)
  ```
- Because it is derived rather than frozen, correcting an old month automatically corrects the current opening balance.
- The derived net is only as accurate as your recorded history. Backfill missing prior expenses before topping up.
- A negative prior net is carried forward as a shortfall, reducing the available balance. The UI labels this "Carry shortfall".
- Once applied, the top-up cannot be applied again for that month; the amount remains live.

### Dates and time zone

- The app's "today" is **Africa/Lagos**.
- Salary and expense dates are stored as plain `dates`, so there is no timezone drift when viewing or grouping by month.
- Future-dated entries are rejected by both the UI and the database functions.

---

## Database design

```
auth.users
   │ 1:1
   ▼
profiles (income_target, full_name, debt_free_at)
   │
   ├── salary_entries ──┐
   ├── expenses ────────┤  one row per transaction
   └── budget_months    ┘  top-up marker per month

categories (7 static rows: caps, weekly caps, labels)
```

### Tables

| Table | Purpose |
| --- | --- |
| `profiles` | One row per auth user, created by trigger on sign-up. Holds the income target and `debt_free_at`. |
| `categories` | The seven budget buckets and their caps. Shared plan reference data. |
| `salary_entries` | Every salary payment: amount, date received, optional note. |
| `expenses` | Every outflow: description, category, amount, date. Savings and Debt are recorded here too. |
| `budget_months` | Marks that the user has brought prior cash into a given month. |

### Reporting views

- `monthly_category_totals` — spend per category per month.
- `weekly_category_totals` — spend per category per budget week.

Both use `security_invoker = true`, so RLS remains in force when they are queried.

### RPCs (all writes)

| Function | What it does |
| --- | --- |
| `add_salary(p_amount, p_received_on, p_note)` | Inserts a salary entry after validating amount and date. |
| `add_expense(p_description, p_category, p_amount, p_occurred_on)` | Inserts an expense after validating the description, category, amount, and date. |
| `apply_topup(p_month)` | Marks the current month as topped up and returns the derived prior net. |
| `set_debt_status(p_debt_free)` | Marks debt as fully paid or reopens it for the signed-in user. |
| `delete_salary(p_id)` / `delete_expense(p_id)` | Deletes only the signed-in user's row. |
| `get_dashboard(p_month)` | Single round-trip read that returns every number the UI needs. |

All **write** functions are `SECURITY DEFINER` with `set search_path = ''` and check `auth.uid()` explicitly. This is why the browser never needs direct insert/update/delete permission on the tables. `get_dashboard` is intentionally `SECURITY INVOKER`, so RLS still applies to everything it reads.

### Row-level security

- RLS is enabled on `profiles`, `categories`, `budget_months`, `salary_entries`, and `expenses`.
- Authenticated users can read only their own profile, salary rows, expenses, and top-up rows.
- Categories are readable by any authenticated user.
- Direct table writes are revoked. Only the RPCs above can mutate user data.
- `profiles` allows an owner-scoped update of `full_name` and `income_target` at the grant level, but the app currently has no profile editor; use the SQL snippet below to change the target.
- `debt_free_at` is **not** directly writable by clients. It can only be changed through `set_debt_status`, which checks the signed-in user.

### Changing the income target

Run in the Supabase SQL Editor (replace the email):

```sql
update public.profiles
set income_target = 350000
where email = 'you@example.com';
```

Changing a **category cap** is a plan-wide change because `categories` is shared reference data:

```sql
update public.categories
set monthly_cap = 70000
where key = 'survival';
```

If you need per-user caps, add a `user_id` column to a new `user_category_caps` table and join it in `get_dashboard`; the current design intentionally keeps one plan for the household/app.

---

## Project structure

```
nairatrack-supabase/
├─ src/
│  ├─ app/
│  │  ├─ (app)/
│  │  │  ├─ layout.tsx              Signed-in app shell
│  │  │  └─ dashboard/
│  │  │     ├─ actions.ts           Salary / expense / top-up / debt-free / delete actions
│  │  │     ├─ loading.tsx          Dashboard skeleton
│  │  │     └─ page.tsx             Loads the month and renders the dashboard
│  │  ├─ auth/
│  │  │  ├─ actions.ts              Sign in, sign up, sign out
│  │  │  └─ callback/route.ts       Exchanges the email-confirmation code for a session
│  │  ├─ login/page.tsx
│  │  ├─ signup/page.tsx
│  │  ├─ error.tsx                  Global error boundary
│  │  ├─ globals.css                Tailwind theme and design tokens
│  │  ├─ icon.svg                   Favicon
│  │  ├─ layout.tsx                 Fonts, metadata, viewport
│  │  ├─ not-found.tsx
│  │  └─ page.tsx                   Redirects to /dashboard or /login
│  ├─ components/
│  │  ├─ auth/
│  │  │  ├─ auth-form.tsx           Shared sign-in / sign-up form
│  │  │  └─ auth-shell.tsx          Split-screen auth layout
│  │  ├─ dashboard/
│  │  │  ├─ category-section.tsx    Seven category cards, weekly grids, debt-free state
│  │  │  ├─ dashboard-view.tsx      Page composition
│  │  │  ├─ debt-free-control.tsx   Mark debt paid / reopen debt
│  │  │  ├─ delete-entry-button.tsx
│  │  │  ├─ expense-panel.tsx       Auto-match, impact preview, Enter-to-save
│  │  │  ├─ salary-panel.tsx        Salary entry and top-up / shortfall
│  │  │  ├─ summary-cards.tsx       Balance, salary progress, savings shadow
│  │  │  ├─ transactions-panel.tsx  Ledger with delete
│  │  │  └─ ...                     Sidebar, headers, month switcher, icons, messages
│  │  └─ ui/                        Buttons, progress bar, logo
│  ├─ lib/
│  │  ├─ categories.ts              Labels, colors, and Nigerian keyword matcher
│  │  ├─ data.ts                    get_dashboard RPC loader
│  │  ├─ dates.ts                   Month/week helpers, Africa/Lagos dates
│  │  ├─ format.ts                  Naira and percentage formatting
│  │  ├─ supabase/
│  │  │  ├─ env.ts                  Env validation, publishable/anon fallback
│  │  │  └─ server.ts               SSR Supabase client
│  │  ├─ types.ts                   Shared dashboard and action types
│  │  ├─ utils.ts                   cn() helper
│  │  └─ validation.ts              Zod schemas
│  └─ proxy.ts                      Session refresh + route protection (Next 16)
├─ supabase/
│  └─ migrations/
│     ├─ 20261118000000_initial_schema.sql
│     ├─ 20261118000001_debt_free.sql
│     ├─ 20261118000002_miscellaneous_enum.sql
│     └─ 20261118000003_miscellaneous_budget.sql
├─ .env.example
├─ next.config.ts                   Security headers
├─ package.json
└─ README.md
```

`src/proxy.ts` replaces `middleware.ts` in Next.js 16. It refreshes Supabase auth cookies on every request and redirects unauthenticated users away from `/dashboard` and `/`, and authenticated users away from `/login` and `/signup`.

`AGENTS.md` is generated automatically by `next dev` for AI coding assistants. It has no runtime effect and may be committed or left untracked.

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server at `http://localhost:3000`. |
| `npm run build` | Production build. |
| `npm start` | Serve the production build. |
| `npm run typecheck` | TypeScript check with `tsc --noEmit`. |
| `npm run lint` | ESLint. |

This project has been verified with `typecheck`, `lint`, `build`, a full database integration test (two users, RLS isolation, top-up idempotence, weekly totals, expected savings, the seven-category rebalance, debt-free reallocation and historical months), and browser QA at desktop and mobile widths.

---

## Deploying

### Vercel (recommended)

1. Push the project to a Git repository.
2. Import it into Vercel. The Next.js defaults are correct.
3. Add the environment variables from `.env.example` in **Project → Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `NEXT_PUBLIC_SITE_URL=https://your-domain.com`
4. Deploy.
5. In Supabase **Authentication → URL Configuration**, set:
   - Site URL: `https://your-domain.com`
   - Redirect URL: `https://your-domain.com/auth/callback`
6. Test sign-up, email confirmation, sign-in, and a dashboard write on the deployed domain.

### Any Node host

```bash
npm ci
npm run build
npm start
```

The app needs outbound HTTPS access to your Supabase project. It does not need a database connection string or a service-role key at build time.

### Production checklist

- [ ] All migrations applied to the production Supabase project, in order.
- [ ] Email confirmation configured as desired and custom SMTP connected for production mail.
- [ ] Site URL and `/auth/callback` redirect URLs set to the production domain.
- [ ] `NEXT_PUBLIC_SITE_URL` set to the production domain.
- [ ] `.env.local` is not committed (it is git-ignored).
- [ ] Never add a service-role key to any `NEXT_PUBLIC_*` variable.
- [ ] If you change category caps or the income target, do it deliberately; caps are shared plan data.

---

## Troubleshooting

**"Supabase is not configured"**
Add both URL and key to `.env.local`, then restart `npm run dev`. Environment changes are not picked up by a running Next process.

**"Could not load your ledger. Check that the Supabase migration has been applied."**
The dashboard RPC failed. Confirm both migrations ran in the same Supabase project as the URL in `.env.local`, and that `get_dashboard` exists under **Database → Functions**. Check the browser/server console for the underlying Supabase error.

**Confirmation email opens localhost in production**
Set `NEXT_PUBLIC_SITE_URL` to the production URL, rebuild/redeploy, and update Supabase's Site URL and redirect allow-list.

**"Email rate limit exceeded" on sign-up**
The built-in Supabase email sender is limited. Wait, or configure custom SMTP under Authentication settings.

**The dashboard is empty after signing in**
Data is scoped to the signed-in account and the selected month. Check the month switcher and confirm you are using the same account that recorded the entries.

**No top-up button**
A top-up only appears when:
- the current month is selected,
- the current month has not already been topped up,
- earlier months have a non-zero net (surplus or shortfall).

Past months are read-only for carry-forward actions.

**The Miscellaneous card is missing**
Run `20261118000002_miscellaneous_enum.sql` first, then `20261118000003_miscellaneous_budget.sql`. The enum value must be committed before the category row is inserted. Do not paste both files into one SQL Editor query.

**No "Mark debt as fully paid" button**
The button only appears on the **current month** when the debt is still active. If you are viewing an old month, switch back to the current month. If the button is still missing, confirm that `20261118000001_debt_free.sql` has been applied.

**Debt is marked paid but Savings did not increase**
Check that you are viewing the current month (or a month on/after the date you marked the debt). Historical months keep their original plan. Also confirm the Debt category still has a monthly cap in the `categories` table; the reallocation moves that amount.

**A category is over its cap**
That is intentional. Expenses are always recorded; the card turns into an overage warning. Adjust the plan or move spending to another category.

**I need to fix a wrong amount**
Delete the entry in the ledger and add it again with the correct amount and date. Deletion recalculates every dependent number, including the live opening balance.

---

## Design notes and intentional limits

- **Naira only.** Formatting and validation are built around ₦; there is no currency selector.
- **One shared plan.** The seven caps are global reference rows, while salary, expenses, and top-ups are per user. This suits a personal or household deployment.
- **Savings counts as money out.** It reduces available cash, which is the honest cash-flow view, but it is excluded from the "expected savings" calculation except as the actual side of the comparison.
- **Debt-free is a plan reallocation, not a cash transfer.** It raises the Savings cap and expected savings, but it does not insert a fake transaction. Record the actual transfer when the money moves.
- **No edit-in-place.** Entries are append-and-delete. This keeps the ledger simple and auditable.
- **No in-app password reset UI.** Supabase Auth supports recovery links; adding a reset screen is a small extension if you need it.
- **The dashboard returns the most recent 200 expenses** for the selected month in its JSON payload. All totals are computed over the full month; the cap only limits ledger rows sent to the browser.

---

## License

Private project. Use and modify it for your own tracking needs.
