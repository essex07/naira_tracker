import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  getLegacyAuthCookiePrefix,
  getSiteUrl,
  getSupabaseCookieOptions,
  getSupabaseEnv,
} from "@/lib/supabase/env";

function createCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${
      isDev ? " 'unsafe-eval'" : ""
    }`,
    // Some components use style props for category colours and progress bars,
    // so inline style attributes must remain allowed. Scripts stay nonce-only.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ].join("; ");
}

function nextWithCsp(
  request: NextRequest,
  nonce: string,
  csp: string,
  legacyCookies: string[] = [],
): NextResponse {
  request.headers.set("x-nonce", nonce);
  request.headers.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request });
  response.headers.set("Content-Security-Policy", csp);

  // Expire pre-__Host- Supabase cookies so old sessions do not linger.
  for (const name of legacyCookies) {
    response.cookies.delete(name);
  }

  return response;
}

function redirectWithCookies(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
  csp: string,
  legacyCookies: string[],
): NextResponse {
  // Build redirects from the trusted canonical origin, not from a
  // request-derived Host header. In development getSiteUrl() falls back to the
  // current origin so other ports still work.
  const redirect = NextResponse.redirect(
    new URL(pathname, getSiteUrl(request.nextUrl.origin)),
  );

  // Preserve refreshed Supabase auth cookies on the redirect response.
  for (const cookie of response.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }

  for (const name of legacyCookies) {
    redirect.cookies.delete(name);
  }

  // A token refresh may have written new auth cookies immediately before this
  // redirect. Keep the response out of shared caches in that case too.
  redirect.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, max-age=0, must-revalidate",
  );
  redirect.headers.set("Expires", "0");
  redirect.headers.set("Pragma", "no-cache");
  redirect.headers.set("Content-Security-Policy", csp);

  return redirect;
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = createCsp(nonce);
  const { url, key } = getSupabaseEnv();

  // @supabase/ssr used to store the session under sb-<ref>-auth-token. Expire
  // those host-only cookies now that the client uses a __Host- name.
  const legacyPrefix = getLegacyAuthCookiePrefix(url);
  const legacyCookies = legacyPrefix
    ? request.cookies
        .getAll()
        .map((cookie) => cookie.name)
        .filter(
          (name) => name === legacyPrefix || name.startsWith(`${legacyPrefix}.`),
        )
    : [];

  for (const name of legacyCookies) {
    request.cookies.delete(name);
  }

  let response = nextWithCsp(request, nonce, csp, legacyCookies);

  const supabase = createServerClient(url, key, {
    cookieOptions: getSupabaseCookieOptions(),
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headersToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = nextWithCsp(request, nonce, csp, legacyCookies);

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });

        // @supabase/ssr requires these headers whenever it writes auth
        // cookies, so a CDN or reverse proxy cannot cache a response carrying
        // one user's session.
        for (const [name, value] of Object.entries(headersToSet)) {
          response.headers.set(name, value);
        }
      },
    },
  });

  // IMPORTANT: keep this immediately after createServerClient. It refreshes
  // expired auth tokens and keeps browser/server cookies in sync.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isProtected = pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  if (!user && (isProtected || pathname === "/")) {
    return redirectWithCookies(request, response, "/login", csp, legacyCookies);
  }

  if (user && (isAuthPage || pathname === "/")) {
    return redirectWithCookies(
      request,
      response,
      "/dashboard",
      csp,
      legacyCookies,
    );
  }

  if (isProtected) {
    // Dashboard HTML and RSC payloads contain the user's ledger. Keep them out
    // of shared caches and search indexes even if a CDN is placed in front.
    response.headers.set(
      "Cache-Control",
      "private, no-store, max-age=0, must-revalidate",
    );
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
