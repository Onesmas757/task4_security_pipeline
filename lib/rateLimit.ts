// Simple in-memory sliding-window rate limiter.
// For a single-process demo only — a real multi-server deployment
// would back this with Redis or similar shared storage instead.

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 5; // 5 attempts per window per key

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };

  // Drop timestamps outside the current window (the "sliding" part).
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < WINDOW_MS);

  if (bucket.timestamps.length >= MAX_REQUESTS) {
    const oldest = bucket.timestamps[0];
    const retryAfterSeconds = Math.ceil((WINDOW_MS - (now - oldest)) / 1000);
    buckets.set(key, bucket);
    return { allowed: false, limit: MAX_REQUESTS, remaining: 0, retryAfterSeconds };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return {
    allowed: true,
    limit: MAX_REQUESTS,
    remaining: MAX_REQUESTS - bucket.timestamps.length,
    retryAfterSeconds: 0,
  };
}

// Exposed only for tests, to reset state between test cases.
export function _resetRateLimitsForTests() {
  buckets.clear();
}
