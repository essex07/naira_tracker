import "server-only";

import type { CookieOptions } from "@supabase/ssr";

type SupabaseEnv = {
  url: string;
  key: string;
};

function readEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

export function getSupabaseEnv(): SupabaseEnv {
  // The publishable/anon key is deliberately read only on the server. It is
  // not a secret (RLS is the security boundary), but keeping it out of the
  // browser bundle means the Supabase REST/Auth endpoints are not advertised
  // to the client. Never use a service-role/secret key here.
  const url = readEnv("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
  const key = readEnv(
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY (or SUPABASE_ANON_KEY) to .env.local.",
    );
  }

  return { url, key };
}

export function getSiteUrl(fallbackOrigin?: string | null): string {
  const configured = readEnv("SITE_URL", "NEXT_PUBLIC_SITE_URL");

  // Never build email links from a client-supplied origin in production: a
  // spoofed Host/Origin header could otherwise poison confirmation emails.
  if (!configured && process.env.NODE_ENV === "production") {
    throw new Error("SITE_URL must be set in production.");
  }

  const value = (
    configured ??
    fallbackOrigin ??
    "http://localhost:3000"
  ).replace(/\/+$/, "");

  try {
    const parsed = new URL(value);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("SITE_URL must use http or https.");
    }

    return parsed.origin;
  } catch {
    throw new Error("SITE_URL must be an absolute http(s) URL.");
  }
}

export function getSupabaseCookieOptions(): CookieOptions {
  return {
    path: "/",
    sameSite: "lax",
    // All Supabase access happens in server code, so the browser never needs
    // to read the session cookie. HttpOnly keeps XSS from stealing it.
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
}
