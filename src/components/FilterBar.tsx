"use client";

import { SlidersHorizontal } from "lucide-react";
import clsx from "clsx";

export type SortOption = "amount" | "count" | "alpha";
export type ViewOption = "all" | "spending" | "income";

interface FilterBarProps {
  sort: SortOption;
  view: ViewOption;
  onSort: (s: SortOption) => void;
  onView: (v: ViewOption) => void;
}

export function FilterBar({ sort, view, onSort, onView }: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 w-fit">
        {([
          { v: "all" as const,      label: "All" },
          { v: "spending" as const, label: "Spending only" },
          { v: "income" as const,   label: "Income only" },
        ]).map(({ v, label }) => (
          <button
            key={v}
            onClick={() => onView(v)}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
              view === v
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Sort:
        </div>
        {([
          { v: "amount" as const, label: "Amount" },
          { v: "count" as const,  label: "Frequency" },
          { v: "alpha" as const,  label: "A–Z" },
        ]).map(({ v, label }) => (
          <button
            key={v}
            onClick={() => onSort(v)}
            className={clsx(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-all border",
              sort === v
                ? "bg-brand-500 text-white border-brand-500"
                : "bg-white text-slate-500 border-slate-200 hover:border-brand-300"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
