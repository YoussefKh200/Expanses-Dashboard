// lib/constants.ts
// Application constants and category definitions

// Default expense categories
export const EXPENSE_CATEGORIES = {
  HOUSING: "Housing",
  UTILITIES: "Utilities",
  GROCERIES: "Groceries",
  TRANSPORT: "Transport",
  HEALTHCARE: "Healthcare",
  ENTERTAINMENT: "Entertainment",
  DINING: "Dining Out",
  SHOPPING: "Shopping",
  TRAVEL: "Travel",
  EDUCATION: "Education",
  PERSONAL: "Personal Care",
  INSURANCE: "Insurance",
  SUBSCRIPTIONS: "Subscriptions",
  FEES: "Bank Fees",
  TRANSFER: "Transfer",
  TAX: "Tax",
  OTHER: "Other",
} as const;

// Default income categories
export const INCOME_CATEGORIES = {
  SALARY: "Salary",
  FREELANCE: "Freelance",
  INVESTMENT: "Investment",
  REFUND: "Refund",
  GIFT: "Gift",
  OTHER_INCOME: "Other Income",
} as const;

// Category colors for charts
export const CATEGORY_COLORS: Record<string, string> = {
  [EXPENSE_CATEGORIES.HOUSING]: "#ef4444",
  [EXPENSE_CATEGORIES.UTILITIES]: "#f97316",
  [EXPENSE_CATEGORIES.GROCERIES]: "#eab308",
  [EXPENSE_CATEGORIES.TRANSPORT]: "#84cc16",
  [EXPENSE_CATEGORIES.HEALTHCARE]: "#22c55e",
  [EXPENSE_CATEGORIES.ENTERTAINMENT]: "#10b981",
  [EXPENSE_CATEGORIES.DINING]: "#14b8a6",
  [EXPENSE_CATEGORIES.SHOPPING]: "#06b6d4",
  [EXPENSE_CATEGORIES.TRAVEL]: "#0ea5e9",
  [EXPENSE_CATEGORIES.EDUCATION]: "#3b82f6",
  [EXPENSE_CATEGORIES.PERSONAL]: "#6366f1",
  [EXPENSE_CATEGORIES.INSURANCE]: "#8b5cf6",
  [EXPENSE_CATEGORIES.SUBSCRIPTIONS]: "#a855f7",
  [EXPENSE_CATEGORIES.FEES]: "#d946ef",
  [EXPENSE_CATEGORIES.TRANSFER]: "#f43f5e",
  [EXPENSE_CATEGORIES.TAX]: "#78716c",
  [EXPENSE_CATEGORIES.OTHER]: "#a8a29e",
  [INCOME_CATEGORIES.SALARY]: "#22c55e",
  [INCOME_CATEGORIES.FREELANCE]: "#10b981",
  [INCOME_CATEGORIES.INVESTMENT]: "#14b8a6",
  [INCOME_CATEGORIES.REFUND]: "#06b6d4",
  [INCOME_CATEGORIES.GIFT]: "#3b82f6",
  [INCOME_CATEGORIES.OTHER_INCOME]: "#8b5cf6",
};

// Keyword patterns for rule-based categorization
export const KEYWORD_PATTERNS: { pattern: string; category: string; isIncome: boolean }[] = [
  // Housing
  { pattern: "rent|mortgage|lease", category: EXPENSE_CATEGORIES.HOUSING, isIncome: false },
  { pattern: "property tax|council tax", category: EXPENSE_CATEGORIES.HOUSING, isIncome: false },

  // Utilities
  { pattern: "electric|gas|water|sewer|utility", category: EXPENSE_CATEGORIES.UTILITIES, isIncome: false },
  { pattern: "internet|cable|phone|mobile|verizon|at&t|comcast", category: EXPENSE_CATEGORIES.UTILITIES, isIncome: false },
  { pattern: "trash|garbage|waste", category: EXPENSE_CATEGORIES.UTILITIES, isIncome: false },

  // Groceries
  { pattern: "grocery|supermarket|walmart|target|costco|trader|whole foods|safeway", category: EXPENSE_CATEGORIES.GROCERIES, isIncome: false },
  { pattern: "farmers market|produce", category: EXPENSE_CATEGORIES.GROCERIES, isIncome: false },

  // Transport
  { pattern: "uber|lyft|taxi|cab", category: EXPENSE_CATEGORIES.TRANSPORT, isIncome: false },
  { pattern: "gas station|shell|exxon|chevron|bp|fuel", category: EXPENSE_CATEGORIES.TRANSPORT, isIncome: false },
  { pattern: "parking|toll|metro|subway|bus|train", category: EXPENSE_CATEGORIES.TRANSPORT, isIncome: false },
  { pattern: "car payment|auto loan", category: EXPENSE_CATEGORIES.TRANSPORT, isIncome: false },

  // Healthcare
  { pattern: "pharmacy|cvs|walgreens|rite aid", category: EXPENSE_CATEGORIES.HEALTHCARE, isIncome: false },
  { pattern: "doctor|hospital|clinic|medical|health", category: EXPENSE_CATEGORIES.HEALTHCARE, isIncome: false },
  { pattern: "dental|orthodont|teeth", category: EXPENSE_CATEGORIES.HEALTHCARE, isIncome: false },
  { pattern: "vision|optical|glasses|contacts", category: EXPENSE_CATEGORIES.HEALTHCARE, isIncome: false },

  // Entertainment
  { pattern: "netflix|hulu|disney|spotify|apple music", category: EXPENSE_CATEGORIES.ENTERTAINMENT, isIncome: false },
  { pattern: "cinema|movie|theater|concert", category: EXPENSE_CATEGORIES.ENTERTAINMENT, isIncome: false },
  { pattern: "gym|fitness|yoga|crossfit", category: EXPENSE_CATEGORIES.ENTERTAINMENT, isIncome: false },
  { pattern: "game|steam|playstation|xbox|nintendo", category: EXPENSE_CATEGORIES.ENTERTAINMENT, isIncome: false },

  // Dining
  { pattern: "restaurant|cafe|coffee|starbucks|mcdonald|burger|pizza", category: EXPENSE_CATEGORIES.DINING, isIncome: false },
  { pattern: "doordash|ubereats|grubhub|postmates", category: EXPENSE_CATEGORIES.DINING, isIncome: false },
  { pattern: "bar|pub|club|liquor|wine|beer", category: EXPENSE_CATEGORIES.DINING, isIncome: false },

  // Shopping
  { pattern: "amazon|ebay|etsy", category: EXPENSE_CATEGORIES.SHOPPING, isIncome: false },
  { pattern: "clothing|apparel|nike|adidas|zara|h&m", category: EXPENSE_CATEGORIES.SHOPPING, isIncome: false },
  { pattern: "electronics|best buy|apple store", category: EXPENSE_CATEGORIES.SHOPPING, isIncome: false },

  // Travel
  { pattern: "airline|united|delta|american|southwest|jetblue", category: EXPENSE_CATEGORIES.TRAVEL, isIncome: false },
  { pattern: "hotel|marriott|hilton|airbnb|booking", category: EXPENSE_CATEGORIES.TRAVEL, isIncome: false },
  { pattern: "car rental|hertz|enterprise|avis", category: EXPENSE_CATEGORIES.TRAVEL, isIncome: false },

  // Education
  { pattern: "tuition|student loan|school|university|college", category: EXPENSE_CATEGORIES.EDUCATION, isIncome: false },
  { pattern: "books|textbook|coursera|udemy|skillshare", category: EXPENSE_CATEGORIES.EDUCATION, isIncome: false },

  // Personal
  { pattern: "hair|salon|barber|nail|spa|massage", category: EXPENSE_CATEGORIES.PERSONAL, isIncome: false },
  { pattern: "cosmetics|sephora|ulta", category: EXPENSE_CATEGORIES.PERSONAL, isIncome: false },

  // Insurance
  { pattern: "insurance|premium|geico|state farm|allstate", category: EXPENSE_CATEGORIES.INSURANCE, isIncome: false },
  { pattern: "life insurance|health insurance|auto insurance", category: EXPENSE_CATEGORIES.INSURANCE, isIncome: false },

  // Subscriptions
  { pattern: "subscription|membership|premium", category: EXPENSE_CATEGORIES.SUBSCRIPTIONS, isIncome: false },
  { pattern: "adobe|microsoft|github", category: EXPENSE_CATEGORIES.SUBSCRIPTIONS, isIncome: false },

  // Fees
  { pattern: "fee|charge|penalty|overdraft|atm fee", category: EXPENSE_CATEGORIES.FEES, isIncome: false },

  // Tax
  { pattern: "tax|irs|tax payment", category: EXPENSE_CATEGORIES.TAX, isIncome: false },

  // Income patterns
  { pattern: "salary|paycheck|direct deposit", category: INCOME_CATEGORIES.SALARY, isIncome: true },
  { pattern: "freelance|contract|consulting|1099", category: INCOME_CATEGORIES.FREELANCE, isIncome: true },
  { pattern: "dividend|interest|investment return", category: INCOME_CATEGORIES.INVESTMENT, isIncome: true },
  { pattern: "refund|return", category: INCOME_CATEGORIES.REFUND, isIncome: true },
  { pattern: "gift|present|venmo|cash app", category: INCOME_CATEGORIES.GIFT, isIncome: true },
];

// Bank format configurations
export const BANK_FORMATS = {
  CHASE: {
    name: "Chase",
    dateFormats: ["MM/dd/yyyy", "MM-dd-yyyy"],
    columns: {
      date: ["Transaction Date", "Date", "Posting Date"],
      description: ["Description", "Merchant Name", "Details"],
      amount: ["Amount", "Debit (-)/Credit (+)", "Transaction Amount"],
    },
  },
  BOFA: {
    name: "Bank of America",
    dateFormats: ["MM/dd/yyyy"],
    columns: {
      date: ["Date"],
      description: ["Description"],
      amount: ["Amount"],
    },
  },
  WELLS_FARGO: {
    name: "Wells Fargo",
    dateFormats: ["MM/dd/yyyy"],
    columns: {
      date: ["Date"],
      description: ["Description"],
      amount: ["Amount"],
    },
  },
  CITI: {
    name: "Citibank",
    dateFormats: ["MM/dd/yyyy"],
    columns: {
      date: ["Post Date", "Date"],
      description: ["Description"],
      amount: ["Amount"],
    },
  },
  AMEX: {
    name: "American Express",
    dateFormats: ["MM/dd/yyyy"],
    columns: {
      date: ["Date"],
      description: ["Description"],
      amount: ["Amount"],
    },
  },
  GENERIC: {
    name: "Generic",
    dateFormats: ["yyyy-MM-dd", "MM/dd/yyyy", "dd/MM/yyyy", "MM-dd-yyyy"],
    columns: {
      date: ["date", "Date", "DATE", "transaction_date", "Transaction Date"],
      description: ["description", "Description", "DESCRIPTION", "merchant", "Merchant", "narrative", "Narrative", "details", "Details"],
      amount: ["amount", "Amount", "AMOUNT", "value", "Value", "transaction_amount"],
    },
  },
} as const;

export const DEFAULT_BUDGET_LIMITS: Record<string, number> = {
  [EXPENSE_CATEGORIES.GROCERIES]: 600,
  [EXPENSE_CATEGORIES.DINING]: 300,
  [EXPENSE_CATEGORIES.ENTERTAINMENT]: 200,
  [EXPENSE_CATEGORIES.SHOPPING]: 400,
  [EXPENSE_CATEGORIES.TRANSPORT]: 300,
  [EXPENSE_CATEGORIES.UTILITIES]: 200,
};
