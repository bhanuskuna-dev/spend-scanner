import type {
  RawTransaction,
  CategorizedTransaction,
  CategorySummary,
  SpendCategory,
  AnalysisTotals,
} from "./types";
import { categorizeDescription } from "./categories";

function normalizeMerchant(desc: string): string {
  return desc
    .replace(/\b\d{4,}\b/g, "")
    .replace(/[*#]+/g, "")
    .replace(/\b(ach|pos|debit|credit|purchase|payment|recurring|auto|autopay)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 4)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ") || desc.trim();
}

function uniqueMonths(txs: RawTransaction[]): number {
  const set = new Set<string>();
  for (const t of txs) set.add(t.date.slice(0, 7));
  return Math.max(set.size, 1);
}

export interface CategorizationResult {
  categorized: CategorizedTransaction[];
  summaries: CategorySummary[];
  totals: AnalysisTotals;
}

export function categorizeTransactions(
  transactions: RawTransaction[]
): CategorizationResult {
  // 1. Categorize each transaction. Cash inflows always count as Income
  //    regardless of description (deposit logic > keyword logic).
  const categorized: CategorizedTransaction[] = transactions.map((t) => ({
    ...t,
    category: t.amount < 0 ? "Income" : categorizeDescription(t.description),
  }));

  // 2. Group by category
  const groups = new Map<SpendCategory, CategorizedTransaction[]>();
  for (const t of categorized) {
    const arr = groups.get(t.category) ?? [];
    arr.push(t);
    groups.set(t.category, arr);
  }

  const monthCount = uniqueMonths(transactions);

  // 3. Build summaries
  const summaries: CategorySummary[] = [];
  for (const [category, txs] of groups.entries()) {
    const total = txs.reduce((s, t) => s + Math.abs(t.amount), 0);

    const merchantMap = new Map<string, number>();
    for (const t of txs) {
      const key = normalizeMerchant(t.description);
      merchantMap.set(key, (merchantMap.get(key) ?? 0) + Math.abs(t.amount));
    }
    const top = [...merchantMap.entries()].sort((a, b) => b[1] - a[1])[0];

    summaries.push({
      category,
      total,
      count: txs.length,
      transactions: txs.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)),
      topMerchant: top?.[0] ?? "—",
      topMerchantAmount: top?.[1] ?? 0,
      monthlyAverage: total / monthCount,
    });
  }

  // 4. Sort: Income first, then by total spend descending
  summaries.sort((a, b) => {
    if (a.category === "Income") return -1;
    if (b.category === "Income") return 1;
    return b.total - a.total;
  });

  // 5. Top-level totals
  const totalIn = transactions
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalOut = transactions
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);

  return {
    categorized,
    summaries,
    totals: {
      totalIn,
      totalOut,
      net: totalIn - totalOut,
      monthCount,
    },
  };
}
