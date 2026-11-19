export const CATEGORY_KEYS = [
  "survival",
  "transport",
  "food",
  "debt",
  "savings",
  "others",
  "miscellaneous",
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export interface WeekBudget {
  week: number;
  start: string;
  end: string;
  spent: number;
  remaining: number;
  percent: number;
}

export interface CategoryBudget {
  key: CategoryKey;
  label: string;
  monthlyCap: number;
  baseMonthlyCap: number;
  weeklyCap: number | null;
  spent: number;
  remaining: number;
  percent: number;
  isSavings: boolean;
  settled: boolean;
  weeks: WeekBudget[];
}

export interface SalaryEntry {
  id: string;
  amount: number;
  receivedOn: string;
  note: string | null;
  createdAt: string;
}

export interface ExpenseEntry {
  id: string;
  categoryKey: CategoryKey;
  description: string;
  amount: number;
  occurredOn: string;
  createdAt: string;
}

export interface DashboardUser {
  fullName: string;
  email: string;
  incomeTarget: number;
}

export interface DashboardIncome {
  target: number;
  received: number;
  remaining: number;
  overTarget: number;
  progress: number;
  entryCount: number;
}

export interface DashboardBalance {
  opening: number;
  priorNet: number;
  topupAppliedAt: string | null;
  topupAvailable: number;
  canTopUp: boolean;
  income: number;
  outflow: number;
  available: number;
}

export interface DashboardSavings {
  cap: number;
  baseCap: number;
  expected: number;
  actual: number;
  difference: number;
}

export interface DashboardDebtFree {
  active: boolean;
  since: string | null;
  appliesToMonth: boolean;
  monthlyAllocation: number;
  movedToSavings: number;
  savingsCap: number;
}

export interface DashboardPlan {
  totalCap: number;
  totalSpent: number;
  totalRemaining: number;
}

export interface DashboardData {
  monthStart: string;
  isCurrentMonth: boolean;
  currentWeek: number | null;
  today: string;
  user: DashboardUser;
  income: DashboardIncome;
  balance: DashboardBalance;
  savings: DashboardSavings;
  debtFree: DashboardDebtFree;
  plan: DashboardPlan;
  categories: CategoryBudget[];
  salaryEntries: SalaryEntry[];
  expenses: ExpenseEntry[];
  expenseCount: number;
  generatedAt: string;
}

export type FormStatus = "idle" | "success" | "error";

export interface ActionState {
  status: FormStatus;
  message?: string;
  errors?: Record<string, string>;
}

export const INITIAL_ACTION_STATE: ActionState = { status: "idle" };

export type TransactionKind = "salary" | "expense";

export interface CategoryMatch {
  key: CategoryKey;
  keyword: string | null;
  matched: boolean;
}
