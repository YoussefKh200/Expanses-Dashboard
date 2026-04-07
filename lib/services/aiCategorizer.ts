// lib/services/aiCategorizer.ts
// AI-powered transaction categorization with local LLM support

import { prisma } from "../prisma";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, KEYWORD_PATTERNS } from "../constants";

// Ollama API configuration
const OLLAMA_HOST = process.env.OLLAMA_HOST ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2";
const ENABLE_CLOUD_AI = process.env.ENABLE_CLOUD_AI === "true";

// Category list for AI classification
const EXPENSE_CATEGORIES_LIST = Object.values(EXPENSE_CATEGORIES);
const INCOME_CATEGORIES_LIST = Object.values(INCOME_CATEGORIES);
const ALL_CATEGORIES = [...EXPENSE_CATEGORIES_LIST, ...INCOME_CATEGORIES_LIST];

export interface CategorizationResult {
  category: string;
  confidence: number;
  source: "memory" | "ai" | "rule" | "fallback";
}

/**
 * Categorize a transaction using multiple strategies:
 * 1. Check memory (previous user corrections)
 * 2. Rule-based matching (already done in CSV parser, but double-check)
 * 3. Local LLM via Ollama
 * 4. Fallback to "Other"
 */
export async function categorizeTransaction(
  description: string,
  amount: number,
  useAI: boolean = true
): Promise<CategorizationResult> {
  const isExpense = amount < 0;
  const relevantCategories = isExpense ? EXPENSE_CATEGORIES_LIST : INCOME_CATEGORIES_LIST;

  // Step 1: Check memory for previous user corrections
  const memoryResult = await checkMemory(description);
  if (memoryResult) {
    return {
      category: memoryResult,
      confidence: 1.0,
      source: "memory",
    };
  }

  // Step 2: Rule-based matching (already applied in CSV parser, but verify)
  const ruleResult = categorizeWithRules(description, amount);
  if (ruleResult) {
    return {
      category: ruleResult,
      confidence: 0.8,
      source: "rule",
    };
  }

  // Step 3: AI categorization (if enabled)
  if (useAI) {
    try {
      const aiResult = await categorizeWithAI(description, amount, relevantCategories);
      if (aiResult) {
        return aiResult;
      }
    } catch (error) {
      console.warn("AI categorization failed, falling back to rules:", error);
    }
  }

  // Step 4: Fallback
  return {
    category: isExpense ? EXPENSE_CATEGORIES.OTHER : INCOME_CATEGORIES.OTHER_INCOME,
    confidence: 0.3,
    source: "fallback",
  };
}

/**
 * Check categorization memory for previous user corrections
 */
async function checkMemory(description: string): Promise<string | null> {
  try {
    // Normalize description for matching
    const normalized = normalizeDescription(description);

    const memory = await prisma.categorizationMemory.findFirst({
      where: {
        description: {
          contains: normalized,
        },
      },
      orderBy: {
        confidence: "desc",
      },
    });

    if (memory) {
      return memory.categoryId;
    }
  } catch (error) {
    console.warn("Memory lookup failed:", error);
  }

  return null;
}

/**
 * Rule-based categorization as fallback
 */
function categorizeWithRules(description: string, amount: number): string | null {
  const lowerDesc = description.toLowerCase();
  const isExpense = amount < 0;

  for (const { pattern, category, isIncome } of KEYWORD_PATTERNS) {
    const regex = new RegExp(pattern, "i");
    if (regex.test(lowerDesc)) {
      const matchesType = isIncome ? !isExpense : isExpense;
      if (matchesType || amount === 0) {
        return category;
      }
    }
  }

  return null;
}

/**
 * Categorize using local LLM via Ollama
 */
async function categorizeWithAI(
  description: string,
  amount: number,
  categories: string[]
): Promise<CategorizationResult | null> {
  if (!ENABLE_CLOUD_AI) {
    // Try local Ollama
    try {
      return await categorizeWithOllama(description, amount, categories);
    } catch (error) {
      console.warn("Ollama not available:", error);
      return null;
    }
  }

  // Cloud AI would go here if configured
  return null;
}

/**
 * Categorize using Ollama local LLM
 */
async function categorizeWithOllama(
  description: string,
  amount: number,
  categories: string[]
): Promise<CategorizationResult | null> {
  const isExpense = amount < 0;
  const categoryType = isExpense ? "expense" : "income";

  const prompt = buildCategorizationPrompt(description, amount, categories);

  const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.1, // Low temperature for consistent results
        top_p: 0.9,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const aiResponse = data.response?.trim().toLowerCase() ?? "";

  // Parse AI response
  for (const category of categories) {
    if (aiResponse.includes(category.toLowerCase())) {
      return {
        category,
        confidence: 0.85,
        source: "ai",
      };
    }
  }

  // If no match found, return null to fall back
  return null;
}

/**
 * Build prompt for LLM categorization
 */
function buildCategorizationPrompt(description: string, amount: number, categories: string[]): string {
  const isExpense = amount < 0;
  const categoryType = isExpense ? "expense" : "income";
  const absAmount = Math.abs(amount);

  return `You are a financial transaction categorization assistant.
Categorize the following transaction into ONE of these categories:

Available ${categoryType} categories:
${categories.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Transaction Details:
- Description: "${description}"
- Amount: $${absAmount.toFixed(2)} (${isExpense ? "expense" : "income"})

Rules:
- Choose the MOST appropriate category based on the merchant/description
- Consider typical spending patterns for this type of merchant
- If uncertain, choose the closest matching category
- Respond with ONLY the category name, nothing else

Category:`;
}

/**
 * Normalize description for memory matching
 */
function normalizeDescription(description: string): string {
  return description
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove special chars
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()
    .split(" ")
    .slice(0, 5) // Use first 5 words
    .join(" ");
}

/**
 * Save user correction to memory for future learning
 */
export async function saveCategorizationMemory(
  description: string,
  category: string,
  source: "user" | "ai" = "user"
): Promise<void> {
  try {
    const normalized = normalizeDescription(description);

    // Upsert memory entry
    await prisma.categorizationMemory.upsert({
      where: {
        description: normalized,
      },
      update: {
        categoryId: category,
        confidence: source === "user" ? 1.0 : 0.85,
        source,
        updatedAt: new Date(),
      },
      create: {
        description: normalized,
        categoryId: category,
        confidence: source === "user" ? 1.0 : 0.85,
        source,
      },
    });
  } catch (error) {
    console.error("Failed to save categorization memory:", error);
  }
}

/**
 * Batch categorize multiple transactions
 */
export async function batchCategorize(
  transactions: Array<{ id?: string; description: string; amount: number }>,
  useAI: boolean = true
): Promise<Map<string, CategorizationResult>> {
  const results = new Map<string, CategorizationResult>();

  for (const transaction of transactions) {
    const result = await categorizeTransaction(transaction.description, transaction.amount, useAI);
    results.set(transaction.id ?? transaction.description, result);
  }

  return results;
}

/**
 * Recategorize all uncategorized transactions
 */
export async function recategorizeAll(useAI: boolean = true): Promise<{ success: number; failed: number }> {
  const uncategorized = await prisma.transaction.findMany({
    where: {
      OR: [{ category: null }, { category: "" }],
    },
  });

  let success = 0;
  let failed = 0;

  for (const transaction of uncategorized) {
    try {
      const result = await categorizeTransaction(transaction.description, transaction.amount, useAI);

      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { category: result.category },
      });

      success++;
    } catch (error) {
      console.error(`Failed to categorize transaction ${transaction.id}:`, error);
      failed++;
    }
  }

  return { success, failed };
}

/**
 * Get categorization statistics
 */
export async function getCategorizationStats(): Promise<{
  total: number;
  categorized: number;
  uncategorized: number;
  bySource: Record<string, number>;
}> {
  const total = await prisma.transaction.count();
  const categorized = await prisma.transaction.count({
    where: {
      NOT: {
        category: null,
      },
    },
  });
  const uncategorized = total - categorized;

  const bySourceResult = await prisma.transaction.groupBy({
    by: ["source"],
    _count: true,
  });

  const bySource: Record<string, number> = {};
  for (const row of bySourceResult) {
    bySource[row.source] = row._count;
  }

  return {
    total,
    categorized,
    uncategorized,
    bySource,
  };
}
