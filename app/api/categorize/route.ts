// app/api/categorize/route.ts
// AI Categorization API endpoint with security

import { NextRequest, NextResponse } from "next/server";
import { categorizeTransaction, recategorizeAll, saveCategorizationMemory } from "@/lib/services/aiCategorizer";
import { prisma } from "@/lib/prisma";
import { rateLimiters, checkRateLimit } from "@/lib/security/rateLimit";
import { sanitizeString, sanitizeNumber, sanitizeRequestBody } from "@/lib/security/sanitize";
import { securityHeaders } from "@/lib/security/headers";
import { z } from "zod";

// POST /api/categorize - Categorize a transaction or all uncategorized
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
    const categorizeSchema = z.object({
      transactionId: z.string().uuid().optional(),
      description: z.string().max(500).optional(),
      amount: z.number().optional(),
      recategorizeAll: z.boolean().optional(),
    });

    try {
      sanitizeRequestBody(body, categorizeSchema);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Invalid request body",
        },
        { status: 400, headers: securityHeaders }
      );
    }

    const { transactionId, description, amount, recategorizeAll: all } = body;

    // Recategorize all uncategorized transactions
    if (all) {
      const result = await recategorizeAll(true);

      const response = NextResponse.json({
        success: true,
        categorized: result.success,
        failed: result.failed,
      });

      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    }

    // Categorize single transaction
    if (transactionId) {
      // Validate UUID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(transactionId)) {
        return NextResponse.json(
          { success: false, error: "Invalid transaction ID format" },
          { status: 400, headers: securityHeaders }
        );
      }

      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction) {
        return NextResponse.json(
          { success: false, error: "Transaction not found" },
          { status: 404, headers: securityHeaders }
        );
      }

      const result = await categorizeTransaction(
        transaction.description,
        transaction.amount,
        true
      );

      // Update the transaction
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { category: result.category },
      });

      const response = NextResponse.json({
        success: true,
        category: result.category,
        source: result.source,
        confidence: result.confidence,
      });

      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    }

    // Categorize without saving (preview)
    if (description && amount !== undefined) {
      // Sanitize inputs
      const sanitizedDescription = sanitizeString(description, 500);
      const sanitizedAmount = sanitizeNumber(amount);

      if (!sanitizedDescription || sanitizedAmount === null) {
        return NextResponse.json(
          { success: false, error: "Invalid description or amount" },
          { status: 400, headers: securityHeaders }
        );
      }

      const result = await categorizeTransaction(
        sanitizedDescription,
        sanitizedAmount,
        true
      );

      const response = NextResponse.json({
        success: true,
        category: result.category,
        source: result.source,
        confidence: result.confidence,
      });

      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: "Provide transactionId or description+amount" },
      { status: 400, headers: securityHeaders }
    );
  } catch (error) {
    console.error("Categorize error:", error);

    const response = NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Failed to categorize transaction",
      },
      { status: 500 }
    );

    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }
};

// Save user correction to memory - helper function
const handleSaveMemory = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { description, category } = body;

    if (!description || !category) {
      return NextResponse.json(
        { error: "Description and category are required" },
        { status: 400 }
      );
    }

    await saveCategorizationMemory(description, category, "user");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save memory error:", error);
    return NextResponse.json(
      { error: "Failed to save memory" },
      { status: 500 }
    );
  }
};
