// app/api/stats/route.ts
// Statistics and analytics API endpoint with caching and security

import { NextRequest, NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/services/dataAggregator";
import { cache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache";
import { rateLimiters, checkRateLimit } from "@/lib/security/rateLimit";
import { sanitizeQueryParams } from "@/lib/security/sanitize";
import { securityHeaders } from "@/lib/security/headers";

// GET /api/stats - Get dashboard statistics
export const GET = async (request: NextRequest) => {
  try {
    // Apply rate limiting (100 requests per hour)
    const limitResult = checkRateLimit(rateLimiters.api, request);
    if (limitResult.status !== 200) {
      return NextResponse.json(
        { success: false, error: limitResult.error },
        {
          status: limitResult.status,
          headers: { ...limitResult.headers, ...securityHeaders } as any,
        }
      );
    }

    const { searchParams } = new URL(request.url);

    // Validate and sanitize query parameters
    try {
      sanitizeQueryParams(Object.fromEntries(searchParams.entries()));
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Invalid query parameters",
        },
        { status: 400, headers: securityHeaders }
      );
    }

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (searchParams.get("startDate")) {
      const parsed = new Date(searchParams.get("startDate")!);
      if (!isNaN(parsed.getTime())) {
        startDate = parsed;
      }
    }

    if (searchParams.get("endDate")) {
      const parsed = new Date(searchParams.get("endDate")!);
      if (!isNaN(parsed.getTime())) {
        endDate = parsed;
      }
    }

    // Validate date range
    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid date range: startDate must be before endDate",
        },
        { status: 400, headers: securityHeaders }
      );
    }

    // Create cache key based on date range
    const cacheKey = `${CACHE_KEYS.STATS}${startDate ? startDate.toISOString() : "all"}-${endDate ? endDate.toISOString() : "all"}`;

    // Try cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      const response = NextResponse.json(cached);
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    const stats = await getDashboardStats({
      startDate,
      endDate,
    });

    // Cache the result
    cache.set(cacheKey, stats, CACHE_TTL.STATS);

    const response = NextResponse.json(stats);
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error("Get stats error:", error);

    const response = NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Failed to fetch statistics",
      },
      { status: 500 }
    );

    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }
};

// DELETE /api/stats - Invalidate stats cache
export const DELETE = async (request: NextRequest) => {
  try {
    // Apply rate limiting (10 requests per hour for admin operations)
    const limitResult = checkRateLimit(rateLimiters.upload, request);
    if (limitResult.status !== 200) {
      return NextResponse.json(
        { success: false, error: limitResult.error },
        {
          status: limitResult.status,
          headers: { ...limitResult.headers, ...securityHeaders } as any,
        }
      );
    }

    cache.invalidatePattern(CACHE_KEYS.STATS);

    const response = NextResponse.json({
      success: true,
      message: "Cache invalidated",
    });

    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error("Stats cache invalidate error:", error);

    const response = NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Failed to invalidate cache",
      },
      { status: 500 }
    );

    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }
};
