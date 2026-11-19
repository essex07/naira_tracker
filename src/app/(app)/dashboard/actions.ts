"use server";

import { revalidatePath } from "next/cache";

import { CATEGORY_META } from "@/lib/categories";
import { currentMonthKey, isValidMonthKey, todayISO } from "@/lib/dates";
import { formatNaira } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type {
  ActionState,
  CategoryKey,
  TransactionKind,
} from "@/lib/types";
import { expenseSchema, fieldErrors, salarySchema } from "@/lib/validation";

function rpcFailure(error: { message?: string } | null, fallback: string): string {
  const message = error?.message ?? "";

  if (message.includes("Authentication required")) {
    return "Your session has expired. Sign in again to continue.";
  }

  if (message.includes("JWT")) {
    return "Your session has expired. Sign in again to continue.";
  }

  if (
    message.includes("Salary amount") ||
    message.includes("Salary date") ||
    message.includes("Salary note") ||
    message.includes("Expense amount") ||
    message.includes("Expense date") ||
    message.includes("Description must") ||
    message.includes("Choose a valid category") ||
    message.includes("Top-ups can only") ||
    message.includes("not found")
  ) {
    return message;
  }

  return fallback;
}

export async function addSalaryAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = salarySchema.safeParse({
    amount: String(formData.get("amount") ?? ""),
    receivedOn: String(formData.get("receivedOn") ?? ""),
    note: String(formData.get("note") ?? ""),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      errors: fieldErrors(parsed.error),
    };
  }

  if (parsed.data.receivedOn > todayISO()) {
    return {
      status: "error",
      message: "Salary date cannot be in the future.",
      errors: { receivedOn: "Choose today or an earlier date." },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "Your session has expired. Sign in again.",
    };
  }

  const { error } = await supabase.rpc("add_salary", {
    p_amount: parsed.data.amount,
    p_received_on: parsed.data.receivedOn,
    p_note: parsed.data.note,
  });

  if (error) {
    console.error("add_salary_failed", error);
    return {
      status: "error",
      message: rpcFailure(error, "Could not save this salary. Try again."),
    };
  }

  revalidatePath("/dashboard");

  return {
    status: "success",
    message: `${formatNaira(parsed.data.amount)} added as salary received.`,
  };
}

export async function addExpenseAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = expenseSchema.safeParse({
    description: String(formData.get("description") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    category: String(formData.get("category") ?? ""),
    occurredOn: String(formData.get("occurredOn") ?? ""),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      errors: fieldErrors(parsed.error),
    };
  }

  if (parsed.data.occurredOn > todayISO()) {
    return {
      status: "error",
      message: "Expense date cannot be in the future.",
      errors: { occurredOn: "Choose today or an earlier date." },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "Your session has expired. Sign in again.",
    };
  }

  const { error } = await supabase.rpc("add_expense", {
    p_description: parsed.data.description,
    p_category: parsed.data.category,
    p_amount: parsed.data.amount,
    p_occurred_on: parsed.data.occurredOn,
  });

  if (error) {
    console.error("add_expense_failed", error);
    return {
      status: "error",
      message: rpcFailure(error, "Could not save this expense. Try again."),
    };
  }

  revalidatePath("/dashboard");

  return {
    status: "success",
    message: `${formatNaira(parsed.data.amount)} entered under ${
      CATEGORY_META[parsed.data.category as CategoryKey].label
    }.`,
  };
}

export async function applyTopUpAction(month: string): Promise<ActionState> {
  if (!isValidMonthKey(month)) {
    return { status: "error", message: "Choose a valid month." };
  }

  if (month !== currentMonthKey()) {
    return {
      status: "error",
      message: "A top-up can only be added to the current month.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "Your session has expired. Sign in again.",
    };
  }

  const { data, error } = await supabase.rpc("apply_topup", {
    p_month: `${month}-01`,
  });

  if (error) {
    console.error("apply_topup_failed", error);
    return {
      status: "error",
      message: rpcFailure(error, "Could not apply the top-up. Try again."),
    };
  }

  revalidatePath("/dashboard");

  const priorNet = Number(
    (data as { priorNet?: number } | null)?.priorNet ?? 0,
  );

  if (priorNet < 0) {
    return {
      status: "success",
      message: `A shortfall of ${formatNaira(
        Math.abs(priorNet),
      )} was carried into this month.`,
    };
  }

  return {
    status: "success",
    message: `${formatNaira(priorNet)} from earlier months was brought forward.`,
  };
}

export async function setDebtFreeAction(debtFree: boolean): Promise<ActionState> {
  if (typeof debtFree !== "boolean") {
    return { status: "error", message: "Choose a valid debt status." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "Your session has expired. Sign in again.",
    };
  }

  const { data, error } = await supabase.rpc("set_debt_status", {
    p_debt_free: debtFree,
  });

  if (error) {
    console.error("set_debt_status_failed", error);
    return {
      status: "error",
      message: rpcFailure(
        error,
        "Could not update debt status. Check that the debt-free migration has been applied.",
      ),
    };
  }

  revalidatePath("/dashboard");

  const payload = data as {
    monthlyAllocation?: number;
  } | null;
  const allocation = Number(payload?.monthlyAllocation ?? 0);

  return {
    status: "success",
    message: debtFree
      ? `Debt marked as fully paid. ${formatNaira(allocation)} per month now goes to Savings.`
      : `Debt reopened. ${formatNaira(allocation)} per month is back in the Debt envelope.`,
  };
}

export async function deleteEntryAction(
  kind: TransactionKind,
  id: string,
): Promise<ActionState> {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (kind !== "salary" && kind !== "expense") {
    return { status: "error", message: "Unknown entry type." };
  }

  if (!uuidPattern.test(id)) {
    return { status: "error", message: "Unknown entry." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "Your session has expired. Sign in again.",
    };
  }

  const { error } =
    kind === "salary"
      ? await supabase.rpc("delete_salary", { p_id: id })
      : await supabase.rpc("delete_expense", { p_id: id });

  if (error) {
    console.error("delete_entry_failed", error);
    return {
      status: "error",
      message: rpcFailure(error, "Could not delete this entry. Try again."),
    };
  }

  revalidatePath("/dashboard");

  return {
    status: "success",
    message: kind === "salary" ? "Salary entry deleted." : "Expense deleted.",
  };
}
