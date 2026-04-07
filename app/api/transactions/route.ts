// app/api/transactions/route.ts
// Transactions API endpoint with caching and security

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTransactions as getTransactionsService } from "@/lib/services/dataAggregator";
import { cache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache";
import { rateLimiters, checkRateLimit } from "@/lib/security/rateLimit";
import { sanitizeString, sanitizeQueryParams } from "@/lib/security/sanitize";
import { securityHeaders } from "@/lib/security/headers";

// GET /api/transactions - List transactions with pagination and filters
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

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
    const category = searchParams.get("category") ? sanitizeString(searchParams.get("category")!, 100) : undefined;
    const search = searchParams.get("search") ? sanitizeString(searchParams.get("search")!, 200) : undefined;
    
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

    // Create cache key
    const cacheKey = `${CACHE_KEYS.TRANSACTIONS}${page}-${limit}-${category || "all"}-${search || "all"}-${startDate ? startDate.toISOString() : "all"}-${endDate ? endDate.toISOString() : "all"}`;

    // Try cache
    const cached = cache.get(cacheKey);
    if (cached) {
      const response = NextResponse.json(cached);
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    const result = await getTransactionsService({
      page,
      limit,
      category: category === "all" ? undefined : category,
      startDate,
      endDate,
      search,
    });

    const responseData = {
      transactions: result.transactions,
      pagination: {
        page,
        limit,
        total: result.total,
        hasMore: result.hasMore,
      },
    };

    // Cache the result
    cache.set(cacheKey, responseData, CACHE_TTL.TRANSACTIONS);

    const response = NextResponse.json(responseData);
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error("Get transactions error:", error);

    const response = NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Failed to fetch transactions",
      },
      { status: 500 }
    );

    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }
};

// DELETE /api/transactions - Delete all transactions (reset)
export const DELETE = async (request: NextRequest) => {
  try {
    // Apply rate limiting (10 requests per hour for destructive operations)
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

    await prisma.transaction.deleteMany();
    // Invalidate all caches
    cache.clear();

    const response = NextResponse.json({
      success: true,
      message: "All transactions deleted",
    });

    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error("Delete transactions error:", error);

    const response = NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Failed to delete transactions",
      },
      { status: 500 }
    );

    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }
};
