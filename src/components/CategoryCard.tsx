"use client";

import { useState } from "react";
import { ChevronRight, X, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import clsx from "clsx";
import type { CategorySummary, CategorizedTransaction } from "@/lib/types";
import { CATEGORY_META } from "@/lib/categories";

const TONE_BAR: Record<string, string> = {
  income:   "bg-success-400",
  fixed:    "bg-brand-400",
  variable: "bg-amber-400",
  neutral:  "bg-slate-300",
};

const TONE_AMOUNT: Record<string, string> = {
  income:   "text-success-600",
  fixed:    "text-brand-700",
  variable: "text-amber-700",
  neutral:  "text-slate-700",
};

const TONE_BADGE: Record<string, string> = {
  income:   "bg-success-50 text-success-700 border-success-200",
  fixed:    "bg-brand-50 text-brand-700 border-brand-200",
  variable: "bg-amber-50 text-amber-700 border-amber-200",
  neutral:  "bg-slate-50 text-slate-600 border-slate-200",
};

interface CategoryCardProps {
  summary: CategorySummary;
  totalCashOut: number;
}

export function CategoryCard({ summary, totalCashOut }: CategoryCardProps) {
  const [open, setOpen] = useState(false);
  const meta = CATEGORY_META[summary.category];
  const isIncome = summary.category === "Income";
  const pctOfSpend = totalCashOut > 0 && !isIncome ? (summary.total / totalCashOut) * 100 : 0;

  return (
    <>
      {/* Card */}
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left rounded-2xl border border-slate-200 bg-white shadow-card hover:shadow-card-hover hover:border-slate-300 transition-all overflow-hidden animate-fade-in-up group"
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-2xl select-none shrink-0 group-hover:scale-105 transition-transform">
              {meta.emoji}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3 mb-0.5">
                <h3 className="font-semibold text-slate-900 truncate">{summary.category}</h3>
                <p className={clsx("text-lg font-bold tabular-nums shrink-0", TONE_AMOUNT[meta.tone])}>
                  {isIncome ? "+" : ""}${summary.total.toFixed(2)}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                <span className="truncate">
                  {summary.count} transaction{summary.count !== 1 ? "s" : ""} · top: <span className="text-slate-500">{summary.topMerchant}</span>
                </span>
                <div className="flex items-center gap-1 shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors">
                  {!isIncome && pctOfSpend > 0 && (
                    <span className="font-medium text-slate-500 mr-1">{pctOfSpend.toFixed(1)}%</span>
                  )}
                  <span className="text-[11px] font-medium">View</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {!isIncome && (
                <div className="h-1.5 mt-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={clsx("h-full rounded-full transition-all duration-700", TONE_BAR[meta.tone])}
                    style={{ width: `${Math.min(pctOfSpend, 100)}%` }}
                  />
                </div>
              )}

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Chip>${summary.monthlyAverage.toFixed(2)} / mo avg</Chip>
                {!isIncome && summary.topMerchantAmount > 0 && (
                  <Chip>${summary.topMerchantAmount.toFixed(2)} at top merchant</Chip>
                )}
              </div>
            </div>
          </div>
        </div>
      </button>

      {/* Drawer */}
      {open && (
        <CategoryDrawer
          summary={summary}
          meta={meta}
          isIncome={isIncome}
          pctOfSpend={pctOfSpend}
          onClose={() => setOpen(false)}
          toneBadge={TONE_BADGE[meta.tone]}
          toneAmount={TONE_AMOUNT[meta.tone]}
        />
      )}
    </>
  );
}

// ── Drawer ────────────────────────────────────────────────────────────────────

interface DrawerProps {
  summary: CategorySummary;
  meta: { emoji: string; tone: string };
  isIncome: boolean;
  pctOfSpend: number;
  onClose: () => void;
  toneBadge: string;
  toneAmount: string;
}

function CategoryDrawer({ summary, meta, isIncome, pctOfSpend, onClose, toneBadge, toneAmount }: DrawerProps) {
  // Group transactions by month for a nicer layout
  const byMonth = new Map<string, CategorizedTransaction[]>();
  for (const tx of summary.transactions) {
    const key = tx.date.slice(0, 7);
    const arr = byMonth.get(key) ?? [];
    arr.push(tx);
    byMonth.set(key, arr);
  }
  const months = [...byMonth.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  function fmtMonth(key: string) {
    const [y, m] = key.split("-");
    return `${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
  }
  function fmtDate(iso: string) {
    const [, m, d] = iso.split("-");
    return `${MONTH_NAMES[parseInt(m) - 1]} ${parseInt(d)}`;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-2xl shrink-0">
            {meta.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-slate-900 truncate">{summary.category}</h2>
            <p className="text-xs text-slate-400">{summary.count} transaction{summary.count !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-px bg-slate-100 border-b border-slate-100">
          <Stat label="Total" value={`${isIncome ? "+" : ""}$${summary.total.toFixed(2)}`} className={toneAmount} />
          <Stat label="Monthly avg" value={`$${summary.monthlyAverage.toFixed(2)}`} />
          {isIncome
            ? <Stat label="Deposits" value={`${summary.count}`} />
            : <Stat label="% of spend" value={pctOfSpend > 0 ? `${pctOfSpend.toFixed(1)}%` : "—"} />
          }
        </div>

        {/* Top merchant badge */}
        {summary.topMerchant !== "—" && (
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <span className="text-xs text-slate-400">Top merchant:</span>
            <span className={clsx("text-xs font-semibold px-2.5 py-1 rounded-full border", toneBadge)}>
              {summary.topMerchant} · ${summary.topMerchantAmount.toFixed(2)}
            </span>
          </div>
        )}

        {/* Transaction list */}
        <div className="flex-1 overflow-y-auto">
          {months.map(([key, txs]) => (
            <div key={key}>
              <div className="sticky top-0 bg-slate-50 border-b border-slate-100 px-5 py-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{fmtMonth(key)}</span>
                <span className="text-xs text-slate-400 ml-2">
                  ${txs.reduce((s, t) => s + Math.abs(t.amount), 0).toFixed(2)}
                </span>
              </div>
              {txs.map((tx, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-5 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors"
                >
                  <div className={clsx(
                    "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                    tx.amount < 0 ? "bg-success-100 text-success-600" : "bg-slate-100 text-slate-500"
                  )}>
                    {tx.amount < 0
                      ? <ArrowDownLeft className="w-3.5 h-3.5" />
                      : <ArrowUpRight className="w-3.5 h-3.5" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 font-medium truncate">{tx.description}</p>
                    <p className="text-xs text-slate-400">{fmtDate(tx.date)}</p>
                  </div>
                  <p className={clsx(
                    "text-sm font-bold tabular-nums shrink-0",
                    tx.amount < 0 ? "text-success-600" : "text-slate-800"
                  )}>
                    {tx.amount < 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="bg-white px-4 py-3 text-center">
      <p className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold">{label}</p>
      <p className={clsx("text-base font-bold tabular-nums text-slate-800 mt-0.5", className)}>{value}</p>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
      {children}
    </span>
  );
}
