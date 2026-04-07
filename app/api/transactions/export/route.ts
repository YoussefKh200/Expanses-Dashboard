// app/api/transactions/export/route.ts
// Export transactions as CSV with security

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { rateLimiters, checkRateLimit } from "@/lib/security/rateLimit";
import { sanitizeQueryParams } from "@/lib/security/sanitize";
import { securityHeaders } from "@/lib/security/headers";

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

    const transactions = await prisma.transaction.findMany({
      where: {
        ...(startDate && { date: { gte: startDate } }),
        ...(endDate && { date: { lte: endDate } }),
      },
      orderBy: { date: "desc" },
      take: 100000, // Limit to prevent memory issues
    });

    // If too many transactions, return error
    if (transactions.length > 50000) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many transactions to export (${transactions.length}). Please use a narrower date range.`,
        },
        { status: 413, headers: securityHeaders }
      );
    }

    const headers = ["Date", "Description", "Amount", "Category"];
    const rows = transactions.map((t) => [
      format(t.date, "yyyy-MM-dd"),
      `"${t.description.replace(/"/g, '""')}"`, // Properly escape quotes
      t.amount.toFixed(2),
      t.category ? `"${(t.category as string).replace(/"/g, '""')}"` : "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const response = new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="transactions.csv"',
        "X-Content-Type-Options": securityHeaders["X-Content-Type-Options"],
        "X-Frame-Options": securityHeaders["X-Frame-Options"],
      },
    });

    // Add other security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      if (!response.headers.has(key)) {
        response.headers.set(key, value);
      }
    });

    return response;
  } catch (error) {
    console.error("Export error:", error);

    const response = NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Failed to export transactions",
      },
      { status: 500 }
    );

    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }
};
