// lib/services/csvParser.ts
// Robust CSV parser with auto-detection for multiple bank formats

import Papa from "papaparse";
import { parse, isValid } from "date-fns";
import { BANK_FORMATS, KEYWORD_PATTERNS, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../constants";
import { TransactionInput } from "../validators";

export interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
  category?: string | null;
  source: "csv" | "manual" | "import";
}

export interface ParseResult {
  transactions: ParsedTransaction[];
  errors: ParseError[];
  detectedFormat: string;
}

export interface ParseError {
  row: number;
  message: string;
  data?: Record<string, string>;
}

/**
 * Parse CSV file content and return normalized transactions
 */
export function parseCSV(content: string): ParseResult {
  const transactions: ParsedTransaction[] = [];
  const errors: ParseError[] = [];

  // Parse CSV with Papa Parse
  const parseResult = Papa.parse<string[]>(content, {
    header: false,
    skipEmptyLines: true,
    dynamicTyping: false,
    delimitersToGuess: [",", "\t", ";", "|"],
  });

  if (parseResult.errors.length > 0) {
    errors.push(
      ...parseResult.errors.map((e) => ({
        row: e.row ?? 0,
        message: e.message,
      }))
    );
  }

  if (parseResult.data.length === 0) {
    return { transactions: [], errors: [{ row: 0, message: "Empty CSV file" }], detectedFormat: "unknown" };
  }

  // Detect bank format and column mapping
  const headerRow = parseResult.data[0];
  let formatInfo = detectBankFormat(headerRow);

  if (!formatInfo) {
    // Try generic detection
    const genericMapping = findColumnMapping(headerRow);
    if (!genericMapping) {
      return {
        transactions: [],
        errors: [{ row: 0, message: "Unable to detect CSV format. Please ensure CSV has date, description, and amount columns." }],
        detectedFormat: "unknown",
      };
    }
    formatInfo = { mapping: genericMapping, name: "Generic", dateFormats: [] };
  }

  // Parse data rows (skip header)
  for (let i = 1; i < parseResult.data.length; i++) {
    const row = parseResult.data[i];
    const rowNumber = i + 1; // 1-indexed for user display

    try {
      const transaction = parseRow(row, formatInfo.mapping!, formatInfo.dateFormats);
      if (transaction) {
        transactions.push(transaction);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown parsing error";
      errors.push({
        row: rowNumber,
        message,
        data: Object.fromEntries(row.map((val, idx) => [headerRow[idx] ?? `col${idx}`, val])),
      });
    }
  }

  return {
    transactions,
    errors,
    detectedFormat: formatInfo.name,
  };
}

interface FormatInfo {
  name: string;
  mapping: ColumnMapping;
  dateFormats: readonly string[];
}

interface ColumnMapping {
  dateIndex: number;
  descriptionIndex: number;
  amountIndex: number;
}

/**
 * Detect bank format from header row
 */
function detectBankFormat(headers: string[]): FormatInfo | null {
  const headerString = headers.join(" ").toLowerCase();

  // Check each known bank format
  for (const [key, format] of Object.entries(BANK_FORMATS)) {
    const dateCol = findColumnIndex(headers, format.columns.date);
    const descCol = findColumnIndex(headers, format.columns.description);
    const amountCol = findColumnIndex(headers, format.columns.amount);

    if (dateCol !== -1 && descCol !== -1 && amountCol !== -1) {
      return {
        name: format.name,
        mapping: {
          dateIndex: dateCol,
          descriptionIndex: descCol,
          amountIndex: amountCol,
        },
        dateFormats: format.dateFormats,
      };
    }
  }

  return null;
}

/**
 * Find column index from list of possible names
 */
function findColumnIndex(headers: string[], possibleNames: readonly string[]): number {
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());
  for (const name of possibleNames) {
    const index = lowerHeaders.indexOf(name.toLowerCase());
    if (index !== -1) return index;
  }
  return -1;
}

/**
 * Generic column mapping fallback
 */
function findColumnMapping(headers: string[]): ColumnMapping | null {
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  // Find date column
  const datePatterns = ["date", "transaction date", "posting date", "time"];
  let dateIndex = -1;
  for (const pattern of datePatterns) {
    const idx = lowerHeaders.findIndex((h) => h.includes(pattern));
    if (idx !== -1) {
      dateIndex = idx;
      break;
    }
  }

  // Find description column
  const descPatterns = ["description", "merchant", "narrative", "details", "name", "payee"];
  let descriptionIndex = -1;
  for (const pattern of descPatterns) {
    const idx = lowerHeaders.findIndex((h) => h.includes(pattern));
    if (idx !== -1) {
      descriptionIndex = idx;
      break;
    }
  }

  // Find amount column
  const amountPatterns = ["amount", "value", "debit", "credit", "transaction amount"];
  let amountIndex = -1;
  for (const pattern of amountPatterns) {
    const idx = lowerHeaders.findIndex((h) => h.includes(pattern));
    if (idx !== -1) {
      amountIndex = idx;
      break;
    }
  }

  if (dateIndex === -1 || descriptionIndex === -1 || amountIndex === -1) {
    return null;
  }

  return { dateIndex, descriptionIndex, amountIndex };
}

/**
 * Parse a single row into a transaction
 */
function parseRow(row: string[], mapping: ColumnMapping, dateFormats: readonly string[]): ParsedTransaction | null {
  // Extract fields
  const dateStr = row[mapping.dateIndex]?.trim();
  const description = row[mapping.descriptionIndex]?.trim();
  const amountStr = row[mapping.amountIndex]?.trim();

  if (!dateStr || !description || !amountStr) {
    throw new Error("Missing required fields (date, description, or amount)");
  }

  // Parse date
  const date = parseDate(dateStr, dateFormats);
  if (!date) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }

  // Parse amount
  const amount = parseAmount(amountStr);
  if (isNaN(amount)) {
    throw new Error(`Invalid amount: ${amountStr}`);
  }

  // Auto-categorize using rule-based matching
  const category = categorizeTransaction(description, amount);

  return {
    date,
    description: normalizeDescription(description),
    amount,
    category,
    source: "csv",
  };
}

/**
 * Parse date string with multiple format attempts
 */
function parseDate(dateStr: string, formats: readonly string[]): Date | null {
  // Clean the date string
  const cleaned = dateStr.trim();

  for (const format of formats) {
    const parsed = parse(cleaned, format, new Date());
    if (isValid(parsed)) {
      return parsed;
    }
  }

  // Try ISO format as fallback
  const isoParsed = new Date(cleaned);
  if (!isNaN(isoParsed.getTime())) {
    return isoParsed;
  }

  return null;
}

/**
 * Parse amount string (handle various formats)
 */
function parseAmount(amountStr: string): number {
  // Remove currency symbols and whitespace
  let cleaned = amountStr.replace(/[$£€¥]/g, "").trim();

  // Handle parentheses for negative (accounting format)
  if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
    cleaned = "-" + cleaned.slice(1, -1);
  }

  // Handle comma as decimal separator (European format)
  // Detect by checking if last separator is comma followed by 2 digits
  const commaMatch = cleaned.match(/,(\d{2})$/);
  if (commaMatch && !cleaned.includes(".")) {
    cleaned = cleaned.replace(",", ".");
  }

  // Remove thousand separators
  cleaned = cleaned.replace(/,(?=\d{3}(?!\d))/g, "");

  // Handle CR/DR suffix
  if (cleaned.toUpperCase().endsWith("CR")) {
    cleaned = cleaned.replace(/CR$/i, "").trim();
  } else if (cleaned.toUpperCase().endsWith("DR")) {
    cleaned = "-" + cleaned.replace(/DR$/i, "").trim();
  }

  // Handle + / - prefixes
  const isNegative = cleaned.startsWith("-") || cleaned.startsWith("(");
  cleaned = cleaned.replace(/[^0-9.]/g, "");

  const amount = parseFloat(cleaned);
  return isNegative ? -Math.abs(amount) : amount;
}

/**
 * Normalize description for consistent matching
 */
function normalizeDescription(desc: string): string {
  return desc
    .trim()
    .replace(/\s+/g, " ")
    .substring(0, 200);
}

/**
 * Categorize transaction using rule-based matching
 */
function categorizeTransaction(description: string, amount: number): string | null {
  const lowerDesc = description.toLowerCase();

  for (const { pattern, category, isIncome } of KEYWORD_PATTERNS) {
    const regex = new RegExp(pattern, "i");
    if (regex.test(lowerDesc)) {
      // Verify amount direction matches category type
      const isExpense = amount < 0;
      if ((isIncome && !isExpense) || (!isIncome && isExpense)) {
        return category;
      }
      if (!isIncome && !isExpense) {
        // For zero amounts, use the category anyway
        return category;
      }
    }
  }

  return null; // Unclassified, will need AI or manual categorization
}

/**
 * Validate transactions before saving
 */
export function validateTransactions(transactions: ParsedTransaction[]): { valid: TransactionInput[]; invalid: ParseError[] } {
  const valid: TransactionInput[] = [];
  const invalid: ParseError[] = [];

  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    const errors: string[] = [];

    if (!t.date || isNaN(t.date.getTime())) {
      errors.push("Invalid date");
    }
    if (!t.description || t.description.length === 0) {
      errors.push("Empty description");
    }
    if (typeof t.amount !== "number" || isNaN(t.amount)) {
      errors.push("Invalid amount");
    }

    if (errors.length > 0) {
      invalid.push({
        row: i + 1,
        message: errors.join(", "),
      });
    } else {
      valid.push({
        date: t.date,
        description: t.description,
        amount: t.amount,
        category: t.category,
        source: t.source,
      });
    }
  }

  return { valid, invalid };
}
