// lib/security/sanitize.ts
// Input sanitization and validation utilities

import { z } from "zod";

/**
 * Sanitize strings to prevent XSS and injection attacks
 */
export function sanitizeString(input: string, maxLength: number = 255): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Enforce max length
  if (sanitized.length > maxLength) {
    console.warn(`Input exceeded max length of ${maxLength}, truncating`);
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, "");

  // Escape HTML entities
  sanitized = escapeHtml(sanitized);

  return sanitized;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;",
  };
  return text.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string {
  const sanitized = sanitizeString(email, 254).toLowerCase();

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    throw new Error("Invalid email format");
  }

  return sanitized;
}

/**
 * Validate and sanitize numeric input
 */
export function sanitizeNumber(
  input: any,
  min?: number,
  max?: number
): number {
  const num = Number(input);

  if (isNaN(num)) {
    throw new Error("Invalid number");
  }

  if (min !== undefined && num < min) {
    throw new Error(`Number must be at least ${min}`);
  }

  if (max !== undefined && num > max) {
    throw new Error(`Number must be at most ${max}`);
  }

  return num;
}

/**
 * Validate file upload
 */
export function validateFile(
  file: File,
  options?: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
  }
): void {
  if (!file) {
    throw new Error("No file provided");
  }

  // Check file size (default 10MB)
  const maxSize = options?.maxSize || 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error(`File size exceeds maximum of ${maxSize / 1024 / 1024}MB`);
  }

  // Check file type
  if (options?.allowedTypes && !options.allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} not allowed`);
  }

  // Check filename doesn't contain suspicious patterns
  const filename = sanitizeString(file.name, 255);
  if (filename !== file.name) {
    throw new Error("Invalid filename");
  }
}

/**
 * Validate and sanitize a JSON object against a Zod schema
 */
export function sanitizeRequestBody<T>(
  body: any,
  schema: z.ZodSchema<T>
): T {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Validation error: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ")}`
      );
    }
    throw new Error("Invalid request body");
  }
}

/**
 * Sanitize query parameters
 */
export function sanitizeQueryParams(
  params: Record<string, any>
): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(params)) {
    // Sanitize key
    const sanitizedKey = sanitizeString(key, 50);

    // Sanitize value based on type
    if (typeof value === "string") {
      sanitized[sanitizedKey] = sanitizeString(value, 1000);
    } else if (typeof value === "number") {
      try {
        sanitized[sanitizedKey] = sanitizeNumber(value);
      } catch {
        continue; // Skip invalid numbers
      }
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = value.slice(0, 100).map((v) =>
        typeof v === "string" ? sanitizeString(v, 500) : v
      );
    } else if (typeof value === "boolean") {
      sanitized[sanitizedKey] = value;
    }
    // Skip other types
  }

  return sanitized;
}

/**
 * Common validation schemas
 */
export const schemas = {
  loginSchema: z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),

  signupSchema: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters").max(100),
  }),

  uploadSchema: z.object({
    file: z.instanceof(File),
  }),

  transactionFiltersSchema: z.object({
    page: z.number().int().positive().optional(),
    limit: z.number().int().min(1).max(1000).optional(),
    category: z.string().max(100).optional(),
    search: z.string().max(500).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
};
