"use client";

import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import type { AnalysisTotals } from "@/lib/types";

interface HeroStatsProps {
  totals: AnalysisTotals;
  endingBalance?: number;
}

function formatDollars(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.abs(n));
}

export function HeroStats({ totals, endingBalance }: HeroStatsProps) {
  const net = totals.totalIn - totals.totalOut;
  const isPositive = net >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Card 1: Account Balance */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wide">
          <Wallet className="w-3.5 h-3.5" />
          Account Balance
        </div>
        {endingBalance !== undefined ? (
          <>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatDollars(endingBalance)}
            </p>
            <p className="text-xs text-slate-400">From your latest statement</p>
          </>
        ) : (
          <>
            <p className="text-3xl font-extrabold text-slate-400 tracking-tight">—</p>
            <p className="text-xs text-slate-400">Balance not found in statement</p>
          </>
        )}
      </div>

      {/* Card 2: Money In / Out */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wide">
          <TrendingUp className="w-3.5 h-3.5" />
          Money In / Out
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-emerald-600 tracking-tight">
            +{formatDollars(totals.totalIn)}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-danger-500 tracking-tight">
            −{formatDollars(totals.totalOut)}
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Across {totals.monthCount} month{totals.monthCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Card 3: Net */}
      <div
        className={`rounded-2xl border shadow-sm p-5 flex flex-col gap-1.5 ${
          isPositive
            ? "bg-emerald-50 border-emerald-100"
            : "bg-danger-50 border-danger-100"
        }`}
      >
        <div
          className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${
            isPositive ? "text-emerald-500" : "text-danger-400"
          }`}
        >
          {isPositive ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5" />
          )}
          Net {isPositive ? "Saved" : "Spent"}
        </div>
        <p
          className={`text-3xl font-extrabold tracking-tight ${
            isPositive ? "text-emerald-700" : "text-danger-600"
          }`}
        >
          {isPositive ? "+" : "−"}
          {formatDollars(net)}
        </p>
        <p className="text-xs text-slate-500">
          {isPositive
            ? `~${formatDollars(net / Math.max(totals.monthCount, 1))}/mo saved`
            : `~${formatDollars(Math.abs(net) / Math.max(totals.monthCount, 1))}/mo overspent`}
        </p>
      </div>
    </div>
  );
}
