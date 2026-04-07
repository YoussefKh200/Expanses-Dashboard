// lib/validators.ts
// Zod schemas for data validation

import { z } from "zod";

// Transaction validation schema
export const transactionSchema = z.object({
  date: z.coerce.date(),
  description: z.string().min(1).max(500),
  amount: z.number(),
  category: z.string().optional().nullable(),
  source: z.enum(["csv", "manual", "import"]).optional().default("csv"),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

// CSV Row schema (raw parsed data)
export const csvRowSchema = z.object({
  date: z.string(),
  description: z.string(),
  amount: z.string(),
  extra: z.record(z.string()).optional(),
});

export type CSVRow = z.infer<typeof csvRowSchema>;

// Categorization request schema
export const categorizeRequestSchema = z.object({
  transactionId: z.string().optional(),
  description: z.string(),
  amount: z.number().optional(),
});

export type CategorizeRequest = z.infer<typeof categorizeRequestSchema>;

// Category update schema
export const updateCategorySchema = z.object({
  categoryId: z.string(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// Upload response schema
export const uploadResponseSchema = z.object({
  success: z.boolean(),
  count: z.number(),
  errors: z.array(z.object({
    row: z.number(),
    message: z.string(),
  })).optional(),
});

export type UploadResponse = z.infer<typeof uploadResponseSchema>;

// Stats response schema
export const statsSchema = z.object({
  totalIncome: z.number(),
  totalExpenses: z.number(),
  netCashflow: z.number(),
  transactionCount: z.number(),
  categoryBreakdown: z.array(z.object({
    category: z.string(),
    amount: z.number(),
    percentage: z.number(),
    count: z.number(),
  })),
  monthlyTrend: z.array(z.object({
    month: z.string(),
    income: z.number(),
    expenses: z.number(),
  })),
});

export type Stats = z.infer<typeof statsSchema>;
