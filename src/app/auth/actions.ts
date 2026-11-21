"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getSiteUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";
import { fieldErrors } from "@/lib/validation";

const emailField = z
  .string()
  .trim()
  .min(1, "Enter your email")
  .email("Enter a valid email address")
  .transform((value) => value.toLowerCase());

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be 72 characters or fewer");

const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password"),
});

const signUpSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Enter your name")
      .max(80, "Name must be 80 characters or fewer"),
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

function catchMessage(error: { message?: string } | null): string {
  const message = error?.message?.toLowerCase() ?? "";

  if (message.includes("invalid login credentials")) {
    return "Email or password is incorrect.";
  }

  if (message.includes("email not confirmed")) {
    return "Check your inbox and confirm your email before signing in.";
  }

  if (message.includes("already registered")) {
    return "An account already exists for this email. Try signing in.";
  }

  if (message.includes("rate limit")) {
    return "Too many attempts. Wait a moment and try again.";
  }

  return "Something went wrong. Please try again.";
}

export async function signInAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      errors: fieldErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { status: "error", message: catchMessage(error) };
  }

  redirect("/dashboard");
}

export async function signUpAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      errors: fieldErrors(parsed.error),
    };
  }

  const headerStore = await headers();
  const siteUrl = getSiteUrl(headerStore.get("origin"));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    return { status: "error", message: catchMessage(error) };
  }

  if (data.session) {
    redirect("/dashboard");
  }

  return {
    status: "success",
    message:
      "Account created. Check your inbox and confirm your email, then sign in.",
  };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
