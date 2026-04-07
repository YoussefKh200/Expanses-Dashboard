# System Architecture - Local Financial Dashboard

## Overview

A local-first financial analytics dashboard that processes bank transaction CSVs entirely on the user's machine, with optional AI categorization via local LLM.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ Upload Page │  │ Dashboard    │  │ Transaction Table       │ │
│  │ Drag & Drop │  │ Charts/Stats │  │ Filters & Edits         │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER (Next.js API)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ /api/upload  │  │ /api/stats   │  │ /api/transactions    │  │
│  │ /api/categorize│ │ /api/trends  │  │ /api/categories      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER (TypeScript)                   │
│  ┌────────────────┐  ┌─────────────────┐  ┌──────────────────┐ │
│  │ CSV Parser     │  │ AI Categorizer  │  │ Data Aggregator  │ │
│  │ - Auto-detect  │  │ - Ollama LLM    │  │ - Monthly stats  │ │
│  │ - Normalize    │  │ - Rule fallback │  │ - Trends         │ │
│  └────────────────┘  └─────────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER (Prisma + SQLite)                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Tables: transactions, categories, categorization_rules  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Module Breakdown

### 1. Frontend Module (`/app`)
- **Upload Page** (`/app/upload/page.tsx`): Drag-and-drop CSV upload
- **Dashboard Page** (`/app/dashboard/page.tsx`): Main analytics view
- **Components** (`/components`): Reusable UI components with ShadCN

### 2. API Module (`/app/api`)
- **POST /api/upload**: Handle CSV file upload and parsing
- **POST /api/categorize**: Trigger AI categorization
- **GET /api/stats**: Get aggregated statistics
- **GET /api/transactions**: Get paginated transactions with filters
- **PATCH /api/transactions/:id**: Update transaction category

### 3. Service Layer (`/lib/services`)
- **csvParser.ts**: Multi-format CSV parsing with column auto-detection
- **aiCategorizer.ts**: Ollama LLM integration with rule-based fallback
- **dataAggregator.ts**: Monthly aggregation and trend computation

### 4. Data Layer (`/prisma`)
- **schema.prisma**: Database schema definition
- SQLite for zero-configuration local storage

### 5. Utilities (`/lib`)
- **validators.ts**: Zod schemas for data validation
- **constants.ts**: Category definitions and mappings
- **utils.ts**: Helper functions

## Data Flow

1. **CSV Upload**: User drops file → Frontend validates → POST to /api/upload
2. **Parsing**: CSV parser detects format → Normalizes to standard schema
3. **Storage**: Validated transactions stored in SQLite via Prisma
4. **Categorization**: 
   - Check cache for existing category
   - Apply rule-based matching (keywords/regex)
   - Fall back to local LLM if enabled
5. **Analytics**: Aggregator computes stats → Frontend renders charts

## Security Model

- No external API calls by default
- All data stored locally in SQLite
- File uploads processed in-memory, never written to disk
- Optional cloud AI requires explicit user configuration

## Environment Variables

```bash
# Optional: Local LLM configuration
OLLAMA_HOST=localhost:11434
OLLAMA_MODEL=llama3.2

# Optional: Cloud AI (disabled by default)
ENABLE_CLOUD_AI=false
OPENAI_API_KEY=
```
