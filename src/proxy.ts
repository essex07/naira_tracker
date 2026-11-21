import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
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
): NextResponse {
  request.headers.set("x-nonce", nonce);
  request.headers.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request });
  response.headers.set("Content-Security-Policy", csp);

  return response;
}

function redirectWithCookies(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
  csp: string,
): NextResponse {
  const redirect = NextResponse.redirect(new URL(pathname, request.url));

  // Preserve refreshed Supabase auth cookies on the redirect response.
  for (const cookie of response.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }

  redirect.headers.set("Content-Security-Policy", csp);

  return redirect;
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = createCsp(nonce);
  let response = nextWithCsp(request, nonce, csp);
  const { url, key } = getSupabaseEnv();

  const supabase = createServerClient(url, key, {
    cookieOptions: getSupabaseCookieOptions(),
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = nextWithCsp(request, nonce, csp);

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
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
    return redirectWithCookies(request, response, "/login", csp);
  }

  if (user && (isAuthPage || pathname === "/")) {
    return redirectWithCookies(request, response, "/dashboard", csp);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
