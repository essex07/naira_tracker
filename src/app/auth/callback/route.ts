import { NextResponse } from "next/server";

import { getSiteUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return "/dashboard";
  }

  try {
    const target = new URL(value, "http://internal.invalid");

    // Reject protocol-relative or absolute paths that URL normalization could
    // turn into an external redirect.
    if (
      target.origin !== "http://internal.invalid" ||
      !target.pathname.startsWith("/") ||
      target.pathname.startsWith("//")
    ) {
      return "/dashboard";
    }

    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "/dashboard";
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const siteUrl = getSiteUrl(requestUrl.origin);
  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", siteUrl));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=link_expired", siteUrl));
  }

  const redirectUrl = new URL(next, siteUrl);

  // Final same-origin guard in case URL normalization changes the target.
  if (redirectUrl.origin !== new URL(siteUrl).origin) {
    return NextResponse.redirect(new URL("/dashboard", siteUrl));
  }

  return NextResponse.redirect(redirectUrl);
}
