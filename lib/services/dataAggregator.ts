// lib/services/dataAggregator.ts
// Optimized data aggregation and trend computation

import { prisma } from "../prisma";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";

export interface MonthlyStats {
  month: string;
  income: number;
  expenses: number;
  netCashflow: number;
  savingsRate: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  count: number;
  isIncome: boolean;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
  transactionCount: number;
  categoryBreakdown: CategoryBreakdown[];
  monthlyTrend: MonthlyStats[];
  topExpenses: Array<{ description: string; amount: number; date: Date; category: string | null }>;
  averageMonthlyExpenses: number;
  burnRate: number;
  dateRange: { min: string; max: string };
}

export interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

/**
 * Get comprehensive dashboard statistics with optimized queries
 */
export async function getDashboardStats(range?: DateRange): Promise<DashboardStats> {
  // First, get the actual date range of data
  const dateBounds = await prisma.transaction.aggregate({
    _min: { date: true },
    _max: { date: true },
  });

  const actualMinDate = dateBounds._min.date;
  const actualMaxDate = dateBounds._max.date;

  // Handle case of no data
  if (!actualMinDate || !actualMaxDate) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netCashflow: 0,
      transactionCount: 0,
      categoryBreakdown: [],
      monthlyTrend: [],
      topExpenses: [],
      averageMonthlyExpenses: 0,
      burnRate: 0,
      dateRange: { min: "", max: "" },
    };
  }

  // Use provided range or fall back to actual data range
  const now = new Date();
  let startDate = range?.startDate || actualMinDate;
  let endDate = range?.endDate || actualMaxDate;

  // Fetch all transactions in range with a single query
  const transactions = await prisma.transaction.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: "desc" },
  });

  // Calculate totals in a single pass
  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryTotals = new Map<string, { amount: number; count: number }>();

  for (const t of transactions) {
    if (t.amount >= 0) {
      totalIncome += t.amount;
    } else {
      const absAmount = Math.abs(t.amount);
      totalExpenses += absAmount;

      const category = t.category ?? "Uncategorized";
      const existing = categoryTotals.get(category) ?? { amount: 0, count: 0 };
      categoryTotals.set(category, {
        amount: existing.amount + absAmount,
        count: existing.count + 1,
      });
    }
  }

  const netCashflow = totalIncome - totalExpenses;

  // Build category breakdown from our single-pass data
  const categoryBreakdown: CategoryBreakdown[] = Array.from(categoryTotals.entries())
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
      count: data.count,
      isIncome: false,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Monthly trend - optimized with single query using groupBy
  const monthlyTrend = await getOptimizedMonthlyTrend(startDate, endDate);

  // Top expenses (already have transactions sorted by date, filter and sort by amount)
  const topExpenses = transactions
    .filter((t) => t.amount < 0)
    .sort((a, b) => a.amount - b.amount)
    .slice(0, 10)
    .map((t) => ({
      description: t.description,
      amount: t.amount,
      date: t.date,
      category: t.category,
    }));

  // Average monthly expenses
  const monthCount = monthlyTrend.length || 1;
  const averageMonthlyExpenses = totalExpenses / monthCount;

  // Burn rate (current month daily average)
  const currentMonthStart = startOfMonth(now);
  const currentMonthExpenses = transactions
    .filter((t) => t.date >= currentMonthStart && t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const daysInMonth = now.getDate() || 1;
  const burnRate = currentMonthExpenses / daysInMonth;

  return {
    totalIncome,
    totalExpenses,
    netCashflow,
    transactionCount: transactions.length,
    categoryBreakdown,
    monthlyTrend,
    topExpenses,
    averageMonthlyExpenses,
    burnRate,
    dateRange: { min: actualMinDate.toISOString(), max: actualMaxDate.toISOString() },
  };
}

/**
 * Optimized monthly trend using raw SQL-like aggregation
 */
async function getOptimizedMonthlyTrend(startDate: Date, endDate: Date): Promise<MonthlyStats[]> {
  const months = eachMonthOfInterval({ start: startDate, end: endDate });
  const trends: MonthlyStats[] = [];

  // Fetch all transactions once for the entire period
  const allTransactions = await prisma.transaction.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Group transactions by month in memory
  const transactionsByMonth = new Map<string, { income: number; expenses: number }>();

  for (const t of allTransactions) {
    const monthKey = format(t.date, "yyyy-MM");
    const existing = transactionsByMonth.get(monthKey) ?? { income: 0, expenses: 0 };

    if (t.amount >= 0) {
      existing.income += t.amount;
    } else {
      existing.expenses += Math.abs(t.amount);
    }

    transactionsByMonth.set(monthKey, existing);
  }

  // Build trend array
  for (const month of months) {
    const monthKey = format(month, "yyyy-MM");
    const data = transactionsByMonth.get(monthKey) ?? { income: 0, expenses: 0 };
    const netCashflow = data.income - data.expenses;
    const savingsRate = data.income > 0 ? ((data.income - data.expenses) / data.income) * 100 : 0;

    trends.push({
      month: monthKey,
      income: data.income,
      expenses: data.expenses,
      netCashflow,
      savingsRate,
    });
  }

  return trends;
}

/**
 * Get spending breakdown by category (optimized version)
 */
export async function getCategoryBreakdown(startDate: Date, endDate: Date): Promise<CategoryBreakdown[]> {
  const transactions = await prisma.transaction.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
      amount: {
        lt: 0,
      },
    },
  });

  const categoryMap = new Map<string, { amount: number; count: number }>();

  for (const t of transactions) {
    const category = t.category ?? "Uncategorized";
    const existing = categoryMap.get(category) ?? { amount: 0, count: 0 };
    categoryMap.set(category, {
      amount: existing.amount + Math.abs(t.amount),
      count: existing.count + 1,
    });
  }

  const totalExpenses = Array.from(categoryMap.values()).reduce((sum, c) => sum + c.amount, 0);

  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
      count: data.count,
      isIncome: false,
    }))
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Get transactions with pagination and filters (optimized)
 */
export async function getTransactions(options?: {
  page?: number;
  limit?: number;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}): Promise<{ transactions: any[]; total: number; hasMore: boolean }> {
  const page = options?.page ?? 1;
  const limit = Math.min(options?.limit ?? 50, 100); // Cap at 100
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (options?.category && options.category !== "all") {
    where.category = options.category;
  }

  if (options?.startDate || options?.endDate) {
    where.date = {};
    if (options?.startDate) (where.date as any).gte = options.startDate;
    if (options?.endDate) (where.date as any).lte = options.endDate;
  }

  if (options?.minAmount !== undefined || options?.maxAmount !== undefined) {
    where.amount = {};
    if (options?.minAmount !== undefined) (where.amount as any).gte = options.minAmount;
    if (options?.maxAmount !== undefined) (where.amount as any).lte = options.maxAmount;
  }

  if (options?.search) {
    where.description = {
      contains: options.search,
    };
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: "desc" },
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    transactions,
    total,
    hasMore: skip + transactions.length < total,
  };
}

/**
 * Get category statistics
 */
export async function getCategoryStats(): Promise<{
  categories: Array<{ name: string; count: number; totalAmount: number }>;
  uncategorized: number;
}> {
  const result = await prisma.transaction.groupBy({
    by: ["category"],
    _count: true,
    _sum: {
      amount: true,
    },
  });

  const categories = result
    .filter((r) => r.category !== null && r.category !== "")
    .map((r) => ({
      name: r.category!,
      count: r._count,
      totalAmount: r._sum.amount ?? 0,
    }))
    .sort((a, b) => b.count - a.count);

  const uncategorized = result.find((r) => r.category === null || r.category === "")?._count ?? 0;

  return { categories, uncategorized };
}

/**
 * Delete all transactions (for reset)
 */
export async function deleteAllTransactions(): Promise<number> {
  const result = await prisma.transaction.deleteMany();
  return result.count;
}

/**
 * Quick stats for dashboard header (cached-friendly)
 */
export async function getQuickStats(): Promise<{
  transactionCount: number;
  totalIncome: number;
  totalExpenses: number;
  lastUpdated: Date | null;
}> {
  const [countResult, latestTransaction] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.findFirst({
      orderBy: { date: "desc" },
      select: { date: true, amount: true },
    }),
  ]);

  // Calculate income/expenses split
  const [incomeResult, expenseResult] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { amount: { gte: 0 } },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { amount: { lt: 0 } },
    }),
  ]);

  return {
    transactionCount: countResult._count,
    totalIncome: incomeResult._sum.amount ?? 0,
    totalExpenses: Math.abs(expenseResult._sum.amount ?? 0),
    lastUpdated: latestTransaction?.date ?? null,
  };
}
