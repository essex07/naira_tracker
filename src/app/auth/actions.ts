"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  checkLoginThrottle,
  clearLoginFailures,
  recordLoginFailure,
} from "@/lib/auth-throttle";
import { getSiteUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";
import { fieldErrors } from "@/lib/validation";

const emailField = z
  .string()
  .trim()
  .min(1, "Enter your email")
  .max(254, "Enter a valid email address")
  .email("Enter a valid email address")
  .transform((value) => value.toLowerCase());

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be 72 characters or fewer");

const signInSchema = z.object({
  email: emailField,
  password: z
    .string()
    .min(1, "Enter your password")
    .max(72, "Password must be 72 characters or fewer"),
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

type AuthErrorLike = {
  message?: string;
  status?: number;
  code?: string;
};

function isRateLimitError(error: AuthErrorLike): boolean {
  return (
    error.status === 429 ||
    error.code === "over_request_rate_limit" ||
    error.code === "over_email_send_rate_limit" ||
    /rate limit|too many requests|security purposes|only request this after/i.test(
      error.message ?? "",
    )
  );
}

function isTransientError(error: AuthErrorLike): boolean {
  const status = error.status ?? 0;

  if (status === 429) {
    return false;
  }

  return (
    status >= 500 ||
    /failed to fetch|fetch failed|network|timeout|temporarily unavailable/i.test(
      error.message ?? "",
    )
  );
}

function signInErrorMessage(error: AuthErrorLike): string {
  if (isRateLimitError(error)) {
    return "Too many attempts. Wait a moment and try again.";
  }

  if (isTransientError(error)) {
    return "Sign-in is temporarily unavailable. Try again shortly.";
  }

  // Deliberately identical for unknown emails, wrong passwords and unconfirmed
  // addresses so the form cannot be used to enumerate accounts.
  return "Email or password is incorrect. If you just signed up, confirm your email first.";
}

function isExistingAccountError(error: AuthErrorLike): boolean {
  return (
    error.code === "user_already_exists" ||
    error.code === "email_exists" ||
    /already registered|already exists/i.test(error.message ?? "")
  );
}

function signUpErrorMessage(error: AuthErrorLike): string {
  if (isRateLimitError(error)) {
    return "Too many attempts. Wait a moment and try again.";
  }

  if (isTransientError(error)) {
    return "Sign-up is temporarily unavailable. Try again shortly.";
  }

  if (/weak|leaked|pwned|compromised/i.test(error.message ?? "")) {
    return "Choose a stronger password. Avoid common or previously breached passwords.";
  }

  return "Could not create the account. Try again in a moment.";
}

const CHECK_INBOX_MESSAGE =
  "If this email is new, check your inbox to confirm it. If you already have an account, sign in instead.";

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

  const throttle = checkLoginThrottle(parsed.data.email);

  if (!throttle.allowed) {
    return {
      status: "error",
      message: `Too many sign-in attempts. Try again in ${
        throttle.retryAfterMinutes
      } ${throttle.retryAfterMinutes === 1 ? "minute" : "minutes"}.`,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Do not turn a Supabase outage or its own rate limiter into a local
    // lockout. Only credential-shaped failures count towards the throttle.
    if (!isRateLimitError(error) && !isTransientError(error)) {
      recordLoginFailure(parsed.data.email);
    }

    return { status: "error", message: signInErrorMessage(error) };
  }

  clearLoginFailures(parsed.data.email);
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
    // An existing account must look the same as a new one. Supabase usually
    // obfuscates this itself when email confirmation is on; this also covers
    // projects where confirmation is disabled and the error is explicit.
    if (isExistingAccountError(error)) {
      return { status: "success", message: CHECK_INBOX_MESSAGE };
    }

    return { status: "error", message: signUpErrorMessage(error) };
  }

  if (data.session) {
    redirect("/dashboard");
  }

  return {
    status: "success",
    message: CHECK_INBOX_MESSAGE,
  };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
