import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import {
  getSupabaseCookieOptions,
  getSupabaseEnv,
} from "@/lib/supabase/env";

/**
 * Server-side Supabase client for Server Components, Server Actions and Route
 * Handlers. Auth cookies are refreshed by src/proxy.ts.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseEnv();

  return createServerClient(url, key, {
    cookieOptions: getSupabaseCookieOptions(),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // @supabase/ssr also supplies anti-cache headers here. Next.js sets
        // `Cache-Control: no-store` on Server Action responses, and the auth
        // callback route sets the same headers on its redirects, so the cookie
        // write is already protected in every place this client is used.
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component. The proxy already refreshes the
          // session, so this can be safely ignored here.
        }
      },
    },
  });
}
