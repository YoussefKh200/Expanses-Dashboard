// app/api/upload/route.ts
// CSV Upload API endpoint with security measures

import { NextRequest, NextResponse } from "next/server";
import { parseCSV, validateTransactions } from "@/lib/services/csvParser";
import { categorizeTransaction } from "@/lib/services/aiCategorizer";
import { prisma } from "@/lib/prisma";
import { cache } from "@/lib/cache";
import { rateLimiters, checkRateLimit } from "@/lib/security/rateLimit";
import { validateFile, sanitizeString } from "@/lib/security/sanitize";
import { securityHeaders } from "@/lib/security/headers";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const POST = async (request: NextRequest) => {
  try {
    // Apply rate limiting (10 uploads per hour)
    const limitResult = checkRateLimit(rateLimiters.upload, request);
    if (limitResult.status !== 200) {
      return NextResponse.json(
        { success: false, error: limitResult.error },
        {
          status: limitResult.status,
          headers: limitResult.headers as any,
        }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400, headers: securityHeaders }
      );
    }

    // Validate file
    try {
      validateFile(file, {
        maxSize: MAX_FILE_SIZE,
        allowedTypes: ["text/csv", "application/vnd.ms-excel"],
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Invalid file",
        },
        { status: 400, headers: securityHeaders }
      );
    }

    // Additional filename validation
    const filename = sanitizeString(file.name, 255);
    if (!filename.endsWith(".csv")) {
      return NextResponse.json(
        { success: false, error: "Only CSV files are supported" },
        { status: 400, headers: securityHeaders }
      );
    }

    // Read file content
    const content = await file.text();

    // Validate content size (prevent DOS)
    if (content.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "File content exceeds maximum size",
        },
        { status: 413, headers: securityHeaders }
      );
    }

    // Parse CSV
    const parseResult = parseCSV(content);

    if (parseResult.transactions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid transactions found",
          errors: parseResult.errors,
        },
        { status: 400, headers: securityHeaders }
      );
    }

    // Cap transactions to prevent memory issues
    const maxTransactions = 10000;
    if (parseResult.transactions.length > maxTransactions) {
      return NextResponse.json(
        {
          success: false,
          error: `Maximum ${maxTransactions} transactions per upload. Found ${parseResult.transactions.length}`,
        },
        { status: 400, headers: securityHeaders }
      );
    }

    // Validate transactions
    const { valid, invalid } = validateTransactions(parseResult.transactions);

    if (valid.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "All transactions failed validation",
          errors: invalid,
        },
        { status: 400, headers: securityHeaders }
      );
    }

    // Store transactions in database with batch optimization
    const createdTransactions = [];
    const errors: Array<{ row: number; message: string }> = [];

    // Pre-categorize all transactions in parallel
    const categorizationPromises = valid.map(async (t) => {
      if (t.category) return { ...t, category: t.category };

      try {
        const aiResult = await categorizeTransaction(t.description, t.amount, true);
        return { ...t, category: aiResult.category };
      } catch {
        return t; // Fallback to no category
      }
    });

    const categorizedTransactions = await Promise.all(categorizationPromises);

    // Batch insert using Prisma's createMany (SQLite doesn't support it well, so we use transaction)
    await prisma.$transaction(
      categorizedTransactions.map((t) =>
        prisma.transaction.create({
          data: {
            date: t.date,
            description: t.description,
            amount: t.amount,
            category: t.category ?? null,
            source: t.source ?? "csv",
          },
        })
      )
    );

    // Invalidate all caches after successful upload
    cache.clear();

    const response = NextResponse.json({
      success: true,
      count: categorizedTransactions.length,
      format: parseResult.detectedFormat,
      errors: errors.length > 0 ? errors : undefined,
      invalid: invalid.length > 0 ? invalid : undefined,
    });

    // Apply security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error("Upload error:", error);

    // Sanitize error message to prevent info disclosure
    const errorMessage =
      error instanceof Error && process.env.NODE_ENV === "development"
        ? error.message
        : "Failed to process file";

    const response = NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );

    // Apply security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }
};

export const GET = () => {
  return NextResponse.json({
    message: "POST a CSV file with form-data field 'file'",
    supportedFormats: [
      "Chase",
      "Bank of America",
      "Wells Fargo",
      "Citibank",
      "American Express",
      "Generic (any CSV with date, description, amount columns)",
    ],
  });
};
