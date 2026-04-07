// prisma/seed.ts
// Seed database with default categories

import { PrismaClient } from "@prisma/client";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CATEGORY_COLORS } from "../lib/constants";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with default categories...");

  // Create expense categories
  for (const [key, name] of Object.entries(EXPENSE_CATEGORIES)) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: {
        name,
        description: `Expense category: ${name}`,
        color: CATEGORY_COLORS[name] ?? null,
        isIncome: false,
      },
    });
  }

  // Create income categories
  for (const [key, name] of Object.entries(INCOME_CATEGORIES)) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: {
        name,
        description: `Income category: ${name}`,
        color: CATEGORY_COLORS[name] ?? null,
        isIncome: true,
      },
    });
  }

  // Create default categorization rules
  const rules = [
    { pattern: "uber|lyft", category: "Transport", priority: 10 },
    { pattern: "starbucks|coffee", category: "Dining Out", priority: 10 },
    { pattern: "amazon", category: "Shopping", priority: 10 },
    { pattern: "netflix|spotify", category: "Subscriptions", priority: 10 },
    { pattern: "walmart|target|costco", category: "Groceries", priority: 10 },
    { pattern: "shell|exxon|gas", category: "Transport", priority: 5 },
    { pattern: "rent", category: "Housing", priority: 20 },
    { pattern: "electric|water|gas", category: "Utilities", priority: 10 },
  ];

  for (const rule of rules) {
    const category = await prisma.category.findUnique({
      where: { name: rule.category },
    });

    if (category) {
      await prisma.categorizationRule.create({
        data: {
          pattern: rule.pattern,
          categoryId: category.id,
          priority: rule.priority,
          isActive: true,
        },
      });
    }
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
