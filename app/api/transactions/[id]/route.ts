// app/api/transactions/[id]/route.ts
// Single transaction API endpoint with security

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveCategorizationMemory } from "@/lib/services/aiCategorizer";
import { rateLimiters, checkRateLimit } from "@/lib/security/rateLimit";
import { sanitizeString } from "@/lib/security/sanitize";
import { securityHeaders } from "@/lib/security/headers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/transactions/:id - Get single transaction
export const GET = async (request: NextRequest, { params }: RouteParams) => {
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

    const { id } = await params;

    // Validate ID format (UUID)
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid transaction ID format" },
        { status: 400, headers: securityHeaders }
      );
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404, headers: securityHeaders }
      );
    }

    const response = NextResponse.json(transaction);
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error("Get transaction error:", error);

    const response = NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Failed to fetch transaction",
      },
      { status: 500 }
    );

    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }
};

// PATCH /api/transactions/:id - Update transaction (e.g., change category)
export const PATCH = async (request: NextRequest, { params }: RouteParams) => {
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

    const { id } = await params;

    // Validate ID format (UUID)
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid transaction ID format" },
        { status: 400, headers: securityHeaders }
      );
    }

    const body = await request.json();
    const { category } = body;

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category is required" },
        { status: 400, headers: securityHeaders }
      );
    }

    // Sanitize category input
    const sanitizedCategory = sanitizeString(String(category), 100);

    if (!sanitizedCategory) {
      return NextResponse.json(
        { success: false, error: "Invalid category value" },
        { status: 400, headers: securityHeaders }
      );
    }

    // Update transaction
    const updated = await prisma.transaction.update({
      where: { id },
      data: { category: sanitizedCategory },
    });

    // Save to memory for future learning
    const transaction = await prisma.transaction.findUnique({ where: { id } });
    if (transaction) {
      await saveCategorizationMemory(transaction.description, sanitizedCategory, "user");
    }

    const response = NextResponse.json(updated);
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error("Update transaction error:", error);

    const response = NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Failed to update transaction",
      },
      { status: 500 }
    );

    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }
};

// DELETE /api/transactions/:id - Delete single transaction
export const DELETE = async (request: NextRequest, { params }: RouteParams) => {
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

    const { id } = await params;

    // Validate ID format (UUID)
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid transaction ID format" },
        { status: 400, headers: securityHeaders }
      );
    }

    await prisma.transaction.delete({
      where: { id },
    });

    const response = NextResponse.json({
      success: true,
      message: "Transaction deleted",
    });

    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error("Delete transaction error:", error);

    const response = NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Failed to delete transaction",
      },
      { status: 500 }
    );

    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }
};
