// app/api/categories/route.ts
// Categories API endpoint with security

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCategoryStats } from "@/lib/services/dataAggregator";
import { rateLimiters, checkRateLimit } from "@/lib/security/rateLimit";
import { sanitizeString, sanitizeRequestBody } from "@/lib/security/sanitize";
import { securityHeaders } from "@/lib/security/headers";
import { z } from "zod";

// GET /api/categories - List all categories with stats
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

    // Get custom categories from database
    const customCategories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });

    // Get transaction stats by category
    const stats = await getCategoryStats();

    const response = NextResponse.json({
      customCategories,
      transactionCategories: stats.categories,
      uncategorized: stats.uncategorized,
    });

    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error("Get categories error:", error);

    const response = NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Failed to fetch categories",
      },
      { status: 500 }
    );

    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }
};

// POST /api/categories - Create custom category
export const POST = async (request: NextRequest) => {
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

    const body = await request.json();

    // Validate request body with strict schema
    const categorySchema = z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional().nullable(),
      color: z
        .string()
        .regex(/^#[0-9a-f]{6}$/i)
        .optional()
        .nullable(),
      isIncome: z.boolean().optional(),
    });

    try {
      sanitizeRequestBody(body, categorySchema);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Invalid request body",
        },
        { status: 400, headers: securityHeaders }
      );
    }

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: "Category name is required" },
        { status: 400, headers: securityHeaders }
      );
    }

    // Sanitize inputs
    const sanitizedName = sanitizeString(body.name, 100);
    const sanitizedDescription = body.description
      ? sanitizeString(body.description, 500)
      : null;

    if (!sanitizedName) {
      return NextResponse.json(
        { success: false, error: "Invalid category name" },
        { status: 400, headers: securityHeaders }
      );
    }

    // Check for duplicate
    const existing = await prisma.category.findFirst({
      where: { name: sanitizedName },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Category with this name already exists" },
        { status: 409, headers: securityHeaders }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: sanitizedName,
        description: sanitizedDescription,
        color: body.color ?? null,
        isIncome: body.isIncome ?? false,
      },
    });

    const response = NextResponse.json(category, { status: 201 });

    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error("Create category error:", error);

    const response = NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Failed to create category",
      },
      { status: 500 }
    );

    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }
};
