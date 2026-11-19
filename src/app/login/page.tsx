import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your NairaTrack salary ledger.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const notice =
    error === "link_expired" || error === "missing_code"
      ? "That sign-in link is invalid or has expired. Sign in with your email and password, or create a new account."
      : undefined;

  return (
    <AuthShell>
      <AuthForm mode="login" notice={notice} />
    </AuthShell>
  );
}
