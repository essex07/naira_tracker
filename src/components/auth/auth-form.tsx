"use client";

import { AlertCircle, ArrowRight, Eye, EyeOff, MailCheck } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { signInAction, signUpAction } from "@/app/auth/actions";
import { INITIAL_ACTION_STATE } from "@/lib/types";

type AuthFormProps = {
  mode: "login" | "signup";
  notice?: string;
};

function PasswordField({
  id,
  name,
  label,
  autoComplete,
  error,
  placeholder,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: string;
  error?: string;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          className="field-input pr-11"
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted transition hover:text-ink"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

function AuthSubmit({ mode }: { mode: "login" | "signup" }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary group mt-2 h-12 w-full justify-between px-5 text-[13px]"
    >
      <span>
        {pending
          ? mode === "login"
            ? "Opening your ledger…"
            : "Creating account…"
          : mode === "login"
            ? "Sign in"
            : "Create account"}
      </span>
      <ArrowRight
        className="size-4 transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </button>
  );
}

export function AuthForm({ mode, notice }: AuthFormProps) {
  const action = mode === "login" ? signInAction : signUpAction;
  const [state, formAction] = useActionState(action, INITIAL_ACTION_STATE);
  const isSignup = mode === "signup";
  const emailSent = isSignup && state.status === "success";

  if (emailSent) {
    return (
      <div className="card p-7 text-center sm:p-9">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-success-soft text-success">
          <MailCheck className="size-7" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl tracking-[-0.02em]">
          Check your inbox.
        </h2>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-muted">
          {state.message}
        </p>
        <Link
          href="/login"
          className="btn-primary mt-7 h-11 w-full text-[13px]"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <p className="eyebrow mb-3 flex items-center gap-2">
          <span className="h-px w-6 bg-gold" aria-hidden="true" />
          {isSignup ? "New ledger" : "Welcome back"}
        </p>
        <h1 className="font-display text-[2.7rem] leading-[1.02] tracking-[-0.035em] text-ink sm:text-5xl">
          {isSignup ? "Start your ledger." : "Open this month."}
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-6 text-muted">
          {isSignup
            ? "One account, seven categories, and a clear view of what every naira is doing."
            : "Sign in to see your balance, weekly limits and savings shadow."}
        </p>
      </div>

      {notice && (
        <div className="mb-5 flex gap-2.5 rounded-xl border border-gold/40 bg-gold-soft/40 px-3.5 py-3 text-xs leading-5 text-ink">
          <AlertCircle
            className="mt-0.5 size-4 shrink-0 text-gold"
            aria-hidden="true"
          />
          <p>{notice}</p>
        </div>
      )}

      <form action={formAction} className="space-y-4" noValidate>
        {isSignup && (
          <div>
            <label htmlFor="fullName" className="field-label">
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              className="field-input"
              placeholder="Ada Okafor"
              aria-invalid={Boolean(state.errors?.fullName)}
              aria-describedby={
                state.errors?.fullName ? "fullName-error" : undefined
              }
            />
            {state.errors?.fullName && (
              <p id="fullName-error" className="field-error">
                {state.errors.fullName}
              </p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="email" className="field-label">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            className="field-input"
            placeholder="you@example.com"
            aria-invalid={Boolean(state.errors?.email)}
            aria-describedby={state.errors?.email ? "email-error" : undefined}
          />
          {state.errors?.email && (
            <p id="email-error" className="field-error">
              {state.errors.email}
            </p>
          )}
        </div>

        <PasswordField
          id="password"
          name="password"
          label="Password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          placeholder={isSignup ? "At least 8 characters" : "Your password"}
          error={state.errors?.password}
        />

        {isSignup && (
          <PasswordField
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            error={state.errors?.confirmPassword}
          />
        )}

        {state.status === "error" && state.message && (
          <div
            role="alert"
            aria-live="polite"
            className="flex gap-2.5 rounded-xl border border-danger/25 bg-danger-soft px-3.5 py-3 text-xs leading-5 text-danger"
          >
            <AlertCircle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <p>{state.message}</p>
          </div>
        )}

        <AuthSubmit mode={mode} />
      </form>

      <p className="mt-6 text-center text-[13px] text-muted">
        {isSignup ? "Already tracking?" : "First time here?"}{" "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-bold text-forest underline decoration-gold/60 decoration-1 underline-offset-4 transition hover:decoration-forest"
        >
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
