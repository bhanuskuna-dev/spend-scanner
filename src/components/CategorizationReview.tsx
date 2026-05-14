"use client";

import { useState } from "react";
import { Sparkles, Check, ChevronDown } from "lucide-react";
import clsx from "clsx";
import type { RawTransaction, SpendCategory } from "@/lib/types";
import { CATEGORY_META } from "@/lib/categories";

const ALL_CATEGORIES: SpendCategory[] = [
  "Income", "Credit Card Payments", "Mortgage & Rent", "Auto & Transportation",
  "Utilities", "Insurance", "Groceries", "Dining & Coffee", "Healthcare",
  "Subscriptions", "Shopping", "Entertainment", "Travel", "Transfers", "Fees", "Other",
];

export interface ReviewItem {
  transaction: RawTransaction;
  txKey: string;
  suggestedCategory: SpendCategory;
  confidence: number;
  reasoning: string;
}

interface Props {
  items: ReviewItem[];
  autoAppliedCount: number;
  onConfirm: (selections: Map<string, SpendCategory>) => void;
  onSkip: () => void;
}

export function CategorizationReview({ items, autoAppliedCount, onConfirm, onSkip }: Props) {
  const [selections, setSelections] = useState<Map<string, SpendCategory>>(
    () => new Map(items.map((item) => [item.txKey, item.suggestedCategory]))
  );

  function setCategory(key: string, category: SpendCategory) {
    setSelections((prev) => new Map(prev).set(key, category));
  }

  const totalApplied = autoAppliedCount + items.length;

  return (
    <div className="rounded-2xl border border-brand-200 bg-white shadow-lg overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-r from-brand-50 to-white border-b border-brand-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">AI Categorization Review</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {autoAppliedCount > 0 && (
                <span className="text-success-600 font-semibold">{autoAppliedCount} auto-applied</span>
              )}
              {autoAppliedCount > 0 && items.length > 0 && " · "}
              {items.length > 0 && (
                <span>{items.length} need{items.length === 1 ? "s" : ""} your confirmation</span>
              )}
              {items.length === 0 && autoAppliedCount > 0 && (
                <span className="text-slate-400"> — all categorized with high confidence</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Review list */}
      {items.length > 0 && (
        <div className="divide-y divide-slate-100 max-h-[55vh] overflow-y-auto">
          {items.map((item) => {
            const selected = selections.get(item.txKey) ?? item.suggestedCategory;
            const isChanged = selected !== item.suggestedCategory;
            const isCredit = item.transaction.amount < 0;
            const confidencePct = Math.round(item.confidence * 100);
            const barColor =
              item.confidence >= 0.7 ? "bg-success-400" :
              item.confidence >= 0.5 ? "bg-amber-400" : "bg-danger-400";

            return (
              <div key={item.txKey} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: transaction details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-medium text-slate-800 text-sm truncate max-w-[260px]">
                        {item.transaction.description}
                      </span>
                      <span className={clsx(
                        "text-xs font-bold tabular-nums shrink-0",
                        isCredit ? "text-success-600" : "text-danger-600"
                      )}>
                        {isCredit ? "+" : ""}${Math.abs(item.transaction.amount).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">{item.transaction.date}</span>
                    </div>

                    {/* AI suggestion row */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        AI suggests:
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-50 border border-brand-100 text-brand-700 text-[11px] font-semibold">
                        {CATEGORY_META[item.suggestedCategory].emoji} {item.suggestedCategory}
                      </span>
                      {/* Confidence bar */}
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-14 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={clsx("h-full rounded-full transition-all", barColor)}
                            style={{ width: `${confidencePct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 tabular-nums">{confidencePct}%</span>
                      </div>
                    </div>

                    {item.reasoning && (
                      <p className="text-[10px] text-slate-400 mt-0.5 italic truncate max-w-xs">
                        &ldquo;{item.reasoning}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Right: category picker */}
                  <div className="shrink-0 relative">
                    <select
                      value={selected}
                      onChange={(e) => setCategory(item.txKey, e.target.value as SpendCategory)}
                      className={clsx(
                        "appearance-none text-xs font-semibold pl-2.5 pr-7 py-2 rounded-lg border cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-brand-300",
                        isChanged
                          ? "border-brand-300 bg-brand-50 text-brand-700"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      )}
                    >
                      {ALL_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {CATEGORY_META[cat].emoji} {cat}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
        <button
          onClick={onSkip}
          className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
        >
          Skip AI improvements
        </button>
        <button
          onClick={() => onConfirm(selections)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors shadow-sm"
        >
          <Check className="w-4 h-4" />
          Apply {totalApplied} categorization{totalApplied !== 1 ? "s" : ""}
        </button>
      </div>
    </div>
  );
}
