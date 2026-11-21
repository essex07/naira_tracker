import "server-only";

import { createHash } from "node:crypto";

/**
 * Best-effort, per-account sign-in throttle.
 *
 * Supabase already rate-limits Auth by IP, but every request from this app is
 * made by the Next.js server, so all users effectively share one IP. This
 * throttle adds a second, account-scoped barrier that cannot be sidestepped by
 * rotating source addresses.
 *
 * The store is process-local. It is effective for a single `next start`
 * instance, but it is not shared across serverless instances or a multi-node
 * deployment. For those deployments, add an edge/WAF or distributed limiter as
 * described in the README.
 */

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 30 * 60 * 1000;
const MAX_FAILURES = 5;
const MAX_TRACKED_ACCOUNTS = 10_000;

type FailureBucket = {
  failures: number;
  firstFailureAt: number;
  blockedUntil: number;
};

const buckets = new Map<string, FailureBucket>();

function keyFor(email: string): string {
  // Hashing keeps raw email addresses out of process memory and bounds the key
  // length regardless of what the client submits.
  return createHash("sha256")
    .update(email.trim().toLowerCase(), "utf8")
    .digest("hex");
}

function isExpired(bucket: FailureBucket, now: number): boolean {
  return (
    bucket.blockedUntil <= now &&
    now - bucket.firstFailureAt >= WINDOW_MS
  );
}

function pruneExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (isExpired(bucket, now)) {
      buckets.delete(key);
    }
  }
}

export type LoginThrottleResult =
  | { allowed: true }
  | { allowed: false; retryAfterMinutes: number };

export function checkLoginThrottle(email: string): LoginThrottleResult {
  const key = keyFor(email);
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket) {
    return { allowed: true };
  }

  if (bucket.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterMinutes: Math.max(
        1,
        Math.ceil((bucket.blockedUntil - now) / 60_000),
      ),
    };
  }

  if (isExpired(bucket, now)) {
    buckets.delete(key);
  }

  return { allowed: true };
}

export function recordLoginFailure(email: string): void {
  const key = keyFor(email);
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || isExpired(bucket, now)) {
    if (buckets.size >= MAX_TRACKED_ACCOUNTS) {
      pruneExpired(now);

      // Do not evict an active lockout. If the table is full of live entries,
      // skip tracking new accounts rather than weakening existing protection.
      if (buckets.size >= MAX_TRACKED_ACCOUNTS) {
        return;
      }
    }

    buckets.set(key, {
      failures: 1,
      firstFailureAt: now,
      blockedUntil: 0,
    });
    return;
  }

  bucket.failures += 1;

  if (bucket.failures >= MAX_FAILURES) {
    bucket.blockedUntil = now + BLOCK_MS;
  }
}

export function clearLoginFailures(email: string): void {
  buckets.delete(keyFor(email));
}
