// lib/security/rateLimit.ts
// Rate limiting implementation for API endpoints

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: any) => string; // Function to generate rate limit key
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limiting middleware creator
 */
export function createRateLimiter(config: RateLimitConfig) {
  const { windowMs, maxRequests, keyGenerator } = config;

  function rateLimit(req: any) {
    // Generate key from IP or custom generator
    const key = keyGenerator ? keyGenerator(req) : getClientIp(req);
    const now = Date.now();

    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return { allowed: true, remaining: maxRequests - 1 };
    }

    const entry = store[key];

    // Reset if window expired
    if (now > entry.resetTime) {
      entry.count = 1;
      entry.resetTime = now + windowMs;
      return { allowed: true, remaining: maxRequests - 1 };
    }

    // Check if limit exceeded
    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        retryAfter,
        resetTime: entry.resetTime,
      };
    }

    entry.count++;
    return { allowed: true, remaining: maxRequests - entry.count };
  }

  // Attach config to the function for later access
  (rateLimit as any).config = config;

  return rateLimit;
}

/**
 * Extract client IP from request
 */
function getClientIp(req: any): string {
  // Check various headers for IP
  return (
    (req.headers?.["x-forwarded-for"] as string)?.split(",")[0].trim() ||
    (req.headers?.["x-real-ip"] as string) ||
    req.ip ||
    "unknown"
  );
}

/**
 * Pre-configured rate limiters
 */
export const rateLimiters = {
  // Login/Auth endpoints: 5 attempts per 15 minutes
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
  }),

  // Upload endpoint: 10 uploads per 1 hour
  upload: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
  }),

  // General API: 100 requests per 1 hour
  api: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    maxRequests: 100,
  }),

  // Strict: 3 attempts per 5 minutes for sensitive operations
  strict: createRateLimiter({
    windowMs: 5 * 60 * 1000,
    maxRequests: 3,
  }),
};

/**
 * Check rate limit and return response if exceeded
 */
export function checkRateLimit(limiter: any, req: any) {
  const result = limiter(req);
  const config = limiter.config as RateLimitConfig;

  if (!result.allowed) {
    return {
      status: 429,
      error: `Too many requests. Please try again in ${result.retryAfter} seconds.`,
      headers: {
        "Retry-After": result.retryAfter.toString(),
        "X-RateLimit-Limit": config.maxRequests.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
      },
    };
  }

  return {
    status: 200,
    remaining: result.remaining,
    headers: {
      "X-RateLimit-Limit": config.maxRequests.toString(),
      "X-RateLimit-Remaining": result.remaining?.toString() || config.maxRequests.toString(),
    },
  };
}
