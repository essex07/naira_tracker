import { z } from "zod";

import { CATEGORY_KEYS } from "@/lib/types";

const amountField = z
  .string()
  .trim()
  .min(1, "Enter an amount")
  .transform((value, ctx) => {
    const parsed = Number(value.replace(/,/g, ""));

    if (!Number.isFinite(parsed) || parsed <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Enter an amount greater than ₦0",
      });
      return z.NEVER;
    }

    if (parsed > 100_000_000) {
      ctx.addIssue({
        code: "custom",
        message: "Amount must be ₦100,000,000 or less",
      });
      return z.NEVER;
    }

    return Math.round(parsed * 100) / 100;
  });

const dateField = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, "Choose a valid date");

const noteField = z
  .string()
  .trim()
  .max(200, "Note must be 200 characters or fewer")
  .transform((value) => (value ? value : null));

export const salarySchema = z.object({
  amount: amountField,
  receivedOn: dateField,
  note: noteField,
});

export const expenseSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, "Describe the expense")
    .max(120, "Description must be 120 characters or fewer"),
  amount: amountField,
  category: z.enum(CATEGORY_KEYS, { error: "Choose a category" }),
  occurredOn: dateField,
});

export type SalaryInput = z.infer<typeof salarySchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;

export function fieldErrors(
  error: z.ZodError,
): Record<string, string> {
  const flattened = error.flatten().fieldErrors as Record<
    string,
    string[] | undefined
  >;

  return Object.fromEntries(
    Object.entries(flattened).map(([field, messages]) => [
      field,
      messages?.[0] ?? "Invalid value",
    ]),
  );
}
