import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnv } from "@/lib/supabase/env";

function redirectWithCookies(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
): NextResponse {
  const redirect = NextResponse.redirect(new URL(pathname, request.url));

  // Preserve refreshed Supabase auth cookies on the redirect response.
  for (const cookie of response.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }

  return redirect;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = getSupabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

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
    return redirectWithCookies(request, response, "/login");
  }

  if (user && (isAuthPage || pathname === "/")) {
    return redirectWithCookies(request, response, "/dashboard");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
