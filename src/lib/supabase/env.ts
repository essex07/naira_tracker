import "server-only";

import type { CookieOptionsWithName } from "@supabase/ssr";

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

  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error("SITE_URL must be an absolute http(s) URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("SITE_URL must use http or https.");
  }

  const isLocalHost =
    parsed.hostname === "localhost" ||
    parsed.hostname === "127.0.0.1" ||
    parsed.hostname === "[::1]";

  if (
    process.env.NODE_ENV === "production" &&
    parsed.protocol !== "https:" &&
    !isLocalHost
  ) {
    throw new Error("SITE_URL must use https in production.");
  }

  return parsed.origin;
}

export function getSupabaseCookieOptions(): CookieOptionsWithName {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    // __Host- forbids a Domain attribute and requires Path=/ plus Secure, so a
    // sibling subdomain cannot overwrite the session cookie. Development keeps
    // the unprefixed name because Secure is not guaranteed over plain HTTP.
    name: isProduction ? "__Host-nairatrack-auth" : "nairatrack-auth",
    path: "/",
    sameSite: "lax",
    // All Supabase access happens in server code, so the browser never needs
    // to read the session cookie. HttpOnly keeps XSS from stealing it.
    httpOnly: true,
    secure: isProduction,
  };
}

/**
 * The cookie name @supabase/ssr used before the __Host- change. It is derived
 * from the project reference exactly as supabase-js does. Returned so the proxy
 * can expire the old host-only cookies instead of leaving orphaned sessions in
 * browsers indefinitely.
 */
export function getLegacyAuthCookiePrefix(supabaseUrl: string): string | null {
  try {
    const ref = new URL(supabaseUrl).hostname.split(".")[0];
    return ref ? `sb-${ref}-auth-token` : null;
  } catch {
    return null;
  }
}
