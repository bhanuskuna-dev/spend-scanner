/**
 * chatTools.ts
 *
 * Pure, synchronous tool functions for the Savings Planning Agent.
 * These run CLIENT-SIDE against the user's already-parsed transaction data —
 * financial data never leaves the browser. The API route only receives
 * the structured tool call results, not the raw transactions.
 */

import type { CategorySummary, RawTransaction, AnalysisTotals, SpendCategory } from "@/lib/types";

export interface SpendData {
  summaries: CategorySummary[];
  transactions: RawTransaction[];
  totals: AnalysisTotals;
}

// ─── Tool 1: get_spending_by_category ────────────────────────────────────────
export interface CategorySpend {
  category: SpendCategory;
  total: number;
  monthlyAverage: number;
  count: number;
  topMerchant: string;
}

export function getSpendingByCategory(data: SpendData): CategorySpend[] {
  return data.summaries
    .filter((s) => s.category !== "Income" && s.total > 0)
    .sort((a, b) => b.total - a.total)
    .map((s) => ({
      category: s.category,
      total: s.total,
      monthlyAverage: s.monthlyAverage,
      count: s.count,
      topMerchant: s.topMerchant,
    }));
}

// ─── Tool 2: identify_discretionary_vs_fixed ──────────────────────────────────
const FIXED_CATEGORIES: SpendCategory[] = [
  "Mortgage & Rent",
  "Credit Card Payments",
  "Insurance",
  "Utilities",
  "Auto & Transportation",
  "Healthcare",
];

const DISCRETIONARY_CATEGORIES: SpendCategory[] = [
  "Dining & Coffee",
  "Shopping",
  "Entertainment",
  "Travel",
  "Subscriptions",
  "Groceries",
  "Fees",
  "Other",
  "Transfers",
];

export interface DiscretionaryBreakdown {
  fixed: CategorySpend[];
  discretionary: CategorySpend[];
  fixedTotal: number;
  discretionaryTotal: number;
}

export function identifyDiscretionaryVsFixed(data: SpendData): DiscretionaryBreakdown {
  const byCategory = getSpendingByCategory(data);
  const fixed = byCategory.filter((c) => FIXED_CATEGORIES.includes(c.category));
  const discretionary = byCategory.filter((c) => DISCRETIONARY_CATEGORIES.includes(c.category));
  return {
    fixed,
    discretionary,
    fixedTotal: fixed.reduce((s, c) => s + c.total, 0),
    discretionaryTotal: discretionary.reduce((s, c) => s + c.total, 0),
  };
}

// ─── Tool 3: find_top_savings_opportunities ───────────────────────────────────
// National monthly averages (US Bureau of Labor Statistics 2024 Consumer Expenditure Survey)
const NATIONAL_BENCHMARKS: Partial<Record<SpendCategory, number>> = {
  "Dining & Coffee": 160,
  "Groceries": 400,
  "Shopping": 150,
  "Entertainment": 60,
  "Subscriptions": 60,
  "Travel": 100,
  "Auto & Transportation": 320,
  "Utilities": 200,
};

export interface SavingsOpportunity {
  category: SpendCategory;
  currentMonthly: number;
  benchmarkMonthly: number | null;
  potentialMonthlySavings: number;
  suggestion: string;
}

export function findTopSavingsOpportunities(data: SpendData, n = 3): SavingsOpportunity[] {
  const byCategory = getSpendingByCategory(data);
  const opportunities: SavingsOpportunity[] = [];

  for (const cat of byCategory) {
    const benchmark = NATIONAL_BENCHMARKS[cat.category] ?? null;
    const excess = benchmark !== null ? cat.monthlyAverage - benchmark : cat.monthlyAverage * 0.2;

    if (excess <= 5) continue; // skip trivial wins

    let suggestion = "";
    if (cat.category === "Dining & Coffee") {
      suggestion = `Cut dining out to ${Math.round(benchmark ?? cat.monthlyAverage * 0.5)}/mo by cooking more at home`;
    } else if (cat.category === "Subscriptions") {
      suggestion = `Audit subscriptions — cancel unused services to hit the $60/mo benchmark`;
    } else if (cat.category === "Shopping") {
      suggestion = `Introduce a 24-hour "cooling off" rule before purchases over $50`;
    } else if (cat.category === "Entertainment") {
      suggestion = `Rotate streaming services monthly instead of subscribing to all simultaneously`;
    } else if (cat.category === "Groceries") {
      suggestion = `Meal plan weekly and shop with a list — reduces impulse buys by ~25%`;
    } else {
      suggestion = `Reduce ${cat.category} spend by 20% — you're above the typical household average`;
    }

    opportunities.push({
      category: cat.category,
      currentMonthly: cat.monthlyAverage,
      benchmarkMonthly: benchmark,
      potentialMonthlySavings: Math.max(0, Math.round(excess)),
      suggestion,
    });
  }

  return opportunities
    .sort((a, b) => b.potentialMonthlySavings - a.potentialMonthlySavings)
    .slice(0, n);
}

// ─── Tool 4: calculate_snowball_projection ─────────────────────────────────────
export interface SnowballMonth {
  month: number;
  label: string;
  monthlySavings: number;
  totalSaved: number;
}

/**
 * Simple savings snowball: each month you save `monthlySavings`.
 * Optionally grows by 5% every 3 months (simulating the snowball habit forming).
 */
export function calculateSnowballProjection(
  monthlySavings: number,
  months = 12,
  growthRate = 0 // additional % per 3-month period, e.g. 0.05 = 5%
): SnowballMonth[] {
  const result: SnowballMonth[] = [];
  let totalSaved = 0;
  let currentMonthly = monthlySavings;
  const now = new Date();

  for (let m = 1; m <= months; m++) {
    if (growthRate > 0 && m > 1 && (m - 1) % 3 === 0) {
      currentMonthly = currentMonthly * (1 + growthRate);
    }
    totalSaved += currentMonthly;

    const date = new Date(now.getFullYear(), now.getMonth() + m, 1);
    const label = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

    result.push({
      month: m,
      label,
      monthlySavings: Math.round(currentMonthly),
      totalSaved: Math.round(totalSaved),
    });
  }

  return result;
}

// ─── Tool 5: get_subscription_list ────────────────────────────────────────────
export function getSubscriptionList(data: SpendData): RawTransaction[] {
  const subSummary = data.summaries.find((s) => s.category === "Subscriptions");
  return subSummary?.transactions ?? [];
}

// ─── Tool 6: compare_to_benchmark ─────────────────────────────────────────────
export interface BenchmarkComparison {
  category: SpendCategory;
  userMonthlyAverage: number;
  nationalMonthlyAverage: number | null;
  delta: number; // positive = user spends more
  percentOverBenchmark: number | null;
}

export function compareToBenchmark(data: SpendData, category: SpendCategory): BenchmarkComparison {
  const summary = data.summaries.find((s) => s.category === category);
  const userAvg = summary?.monthlyAverage ?? 0;
  const national = NATIONAL_BENCHMARKS[category] ?? null;
  const delta = national !== null ? userAvg - national : 0;
  const pct = national !== null && national > 0 ? (delta / national) * 100 : null;

  return {
    category,
    userMonthlyAverage: Math.round(userAvg),
    nationalMonthlyAverage: national,
    delta: Math.round(delta),
    percentOverBenchmark: pct !== null ? Math.round(pct) : null,
  };
}

// ─── Tool dispatcher ───────────────────────────────────────────────────────────
// Maps Claude tool call names → local function calls.
// Called in SavingsAgent.tsx when the API returns stop_reason === "tool_use".

export function dispatchTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  data: SpendData
): unknown {
  switch (toolName) {
    case "get_spending_by_category":
      return getSpendingByCategory(data);
    case "identify_discretionary_vs_fixed":
      return identifyDiscretionaryVsFixed(data);
    case "find_top_savings_opportunities":
      return findTopSavingsOpportunities(data, (toolInput.n as number) ?? 3);
    case "calculate_snowball_projection":
      return calculateSnowballProjection(
        toolInput.monthly_savings as number,
        (toolInput.months as number) ?? 12,
        (toolInput.growth_rate as number) ?? 0
      );
    case "get_subscription_list":
      return getSubscriptionList(data);
    case "compare_to_benchmark":
      return compareToBenchmark(data, toolInput.category as SpendCategory);
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// ─── Tool definitions for Claude API ──────────────────────────────────────────
// Passed as `tools` in the /api/chat request body.

export const TOOL_DEFINITIONS = [
  {
    name: "get_spending_by_category",
    description:
      "Returns all spending categories sorted by total amount. Use this first to understand the user's overall spending profile.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "identify_discretionary_vs_fixed",
    description:
      "Splits spending into fixed costs (rent, insurance, utilities) vs. discretionary (dining, shopping, entertainment). Useful for showing users where they have flexibility to cut.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "find_top_savings_opportunities",
    description:
      "Identifies the top N categories where the user is spending significantly above national benchmarks, with specific savings suggestions for each.",
    input_schema: {
      type: "object" as const,
      properties: {
        n: {
          type: "number",
          description: "Number of opportunities to return (default 3)",
        },
      },
      required: [],
    },
  },
  {
    name: "calculate_snowball_projection",
    description:
      "Given a monthly savings amount, projects the cumulative savings over N months using the snowball method. Returns month-by-month totals.",
    input_schema: {
      type: "object" as const,
      properties: {
        monthly_savings: {
          type: "number",
          description: "How many dollars per month the user will save",
        },
        months: {
          type: "number",
          description: "Number of months to project (default 12)",
        },
        growth_rate: {
          type: "number",
          description:
            "Optional: additional growth rate per 3-month period (e.g. 0.05 = 5% snowball acceleration). Default 0.",
        },
      },
      required: ["monthly_savings"],
    },
  },
  {
    name: "get_subscription_list",
    description:
      "Returns all individual subscription transactions. Use when the user wants to audit their subscriptions to find ones to cancel.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "compare_to_benchmark",
    description:
      "Compares the user's monthly average spend in a category against US national averages. Returns whether they're above or below benchmark.",
    input_schema: {
      type: "object" as const,
      properties: {
        category: {
          type: "string",
          description:
            "The spending category to compare. One of: Income, Credit Card Payments, Mortgage & Rent, Auto & Transportation, Utilities, Insurance, Groceries, Dining & Coffee, Healthcare, Subscriptions, Shopping, Entertainment, Travel, Transfers, Fees, Other",
        },
      },
      required: ["category"],
    },
  },
];
