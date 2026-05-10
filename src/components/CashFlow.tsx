"use client";

import { ArrowDownLeft, ArrowUpRight, Minus } from "lucide-react";
import clsx from "clsx";
import type { RawTransaction } from "@/lib/types";

interface MonthSummary {
  label: string;
  sortKey: string;
  cashIn: number;
  cashOut: number;
  net: number;
}

function buildMonthlySummary(transactions: RawTransaction[]): MonthSummary[] {
  const map = new Map<string, { cashIn: number; cashOut: number }>();

  for (const tx of transactions) {
    const d = new Date(tx.date);
    if (isNaN(d.getTime())) continue;

    const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const entry = map.get(sortKey) ?? { cashIn: 0, cashOut: 0 };

    if (tx.amount < 0) {
      entry.cashIn += Math.abs(tx.amount);
    } else {
      entry.cashOut += tx.amount;
    }
    map.set(sortKey, entry);
  }

  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([sortKey, { cashIn, cashOut }]) => {
      const [year, month] = sortKey.split("-");
      return {
        sortKey,
        label: `${MONTH_NAMES[parseInt(month) - 1]} ${year}`,
        cashIn,
        cashOut,
        net: cashIn - cashOut,
      };
    });
}

/** Work backwards from a known ending balance to produce per-month ending balances. */
function computeEndingBalances(months: MonthSummary[], latestEndingBalance: number): number[] {
  // latestEndingBalance is the balance at end of months[months.length - 1]
  const balances = new Array<number>(months.length);
  balances[months.length - 1] = latestEndingBalance;
  for (let i = months.length - 2; i >= 0; i--) {
    balances[i] = balances[i + 1] - months[i + 1].net;
  }
  return balances;
}

interface CashFlowProps {
  transactions: RawTransaction[];
  endingBalance?: number;
}

export function CashFlow({ transactions, endingBalance }: CashFlowProps) {
  const months = buildMonthlySummary(transactions);
  if (months.length === 0) return null;

  const maxBar = Math.max(...months.flatMap((m) => [m.cashIn, m.cashOut]));
  const totalIn  = months.reduce((s, m) => s + m.cashIn, 0);
  const totalOut = months.reduce((s, m) => s + m.cashOut, 0);
  const avgIn    = totalIn  / months.length;
  const avgOut   = totalOut / months.length;

  const endingBalances = endingBalance !== undefined
    ? computeEndingBalances(months, endingBalance)
    : null;

  return (
    <div className="rounded-2xl border bg-white shadow-card p-6 space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-slate-900">Monthly Cash Flow</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cash in vs. cash out across {months.length} month{months.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex gap-4 flex-wrap">
          <Stat label="Avg / month in"  value={`$${avgIn.toFixed(2)}`}  variant="success" icon={<ArrowDownLeft className="w-3.5 h-3.5" />} />
          <Stat label="Avg / month out" value={`$${avgOut.toFixed(2)}`} variant="danger"  icon={<ArrowUpRight  className="w-3.5 h-3.5" />} />
          <Stat
            label="Net total"
            value={`${totalIn - totalOut >= 0 ? "+" : ""}$${(totalIn - totalOut).toFixed(2)}`}
            variant={totalIn - totalOut >= 0 ? "success" : "danger"}
            icon={<Minus className="w-3.5 h-3.5" />}
          />
        </div>
      </div>

      {/* Bar chart */}
      <div className="overflow-x-auto scrollbar-none -mx-2 px-2">
        <div className="flex items-end gap-3 min-w-max pb-1">
          {months.map((m) => (
            <MonthBar key={m.sortKey} month={m} max={maxBar} />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 pt-1 border-t border-slate-100 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-success-400 inline-block" />
          Cash in (credits / deposits)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-danger-400 inline-block" />
          Cash out (debits / charges)
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-none">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 border-b border-slate-100">
              <th className="text-left py-2 font-semibold">Month</th>
              <th className="text-right py-2 font-semibold text-success-600">Cash In</th>
              <th className="text-right py-2 font-semibold text-danger-600">Cash Out</th>
              <th className="text-right py-2 font-semibold">Net</th>
              {endingBalances && (
                <th className="text-right py-2 font-semibold text-brand-600">Ending Balance</th>
              )}
            </tr>
          </thead>
          <tbody>
            {months.map((m, i) => (
              <tr key={m.sortKey} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="py-2.5 text-slate-700 font-medium">{m.label}</td>
                <td className="py-2.5 text-right text-success-600 font-medium">${m.cashIn.toFixed(2)}</td>
                <td className="py-2.5 text-right text-danger-600 font-medium">${m.cashOut.toFixed(2)}</td>
                <td className={clsx("py-2.5 text-right font-semibold", m.net >= 0 ? "text-success-700" : "text-danger-700")}>
                  {m.net >= 0 ? "+" : ""}${m.net.toFixed(2)}
                </td>
                {endingBalances && (
                  <td className="py-2.5 text-right font-bold text-brand-700">
                    ${endingBalances[i].toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 text-xs font-bold">
              <td className="py-2.5 text-slate-500 pl-1">Total</td>
              <td className="py-2.5 text-right text-success-700">${totalIn.toFixed(2)}</td>
              <td className="py-2.5 text-right text-danger-700">${totalOut.toFixed(2)}</td>
              <td className={clsx("py-2.5 text-right", totalIn - totalOut >= 0 ? "text-success-700" : "text-danger-700")}>
                {totalIn - totalOut >= 0 ? "+" : ""}${(totalIn - totalOut).toFixed(2)}
              </td>
              {endingBalances && (
                <td className="py-2.5 text-right text-brand-700">
                  ${endingBalances[endingBalances.length - 1].toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MonthBar({ month, max }: { month: MonthSummary; max: number }) {
  const BAR_HEIGHT = 80;
  const inH  = max > 0 ? (month.cashIn  / max) * BAR_HEIGHT : 0;
  const outH = max > 0 ? (month.cashOut / max) * BAR_HEIGHT : 0;

  return (
    <div className="flex flex-col items-center gap-1 w-14">
      <div className={clsx("w-1.5 h-1.5 rounded-full mb-0.5", month.net >= 0 ? "bg-success-400" : "bg-danger-400")} />
      <div className="flex items-end gap-0.5" style={{ height: `${BAR_HEIGHT}px` }}>
        <div className="w-5 rounded-t-md bg-success-400 transition-all duration-500" style={{ height: `${Math.max(inH, 2)}px` }} title={`Cash in: $${month.cashIn.toFixed(2)}`} />
        <div className="w-5 rounded-t-md bg-danger-400 transition-all duration-500"  style={{ height: `${Math.max(outH, 2)}px` }} title={`Cash out: $${month.cashOut.toFixed(2)}`} />
      </div>
      <span className="text-[10px] text-slate-400 font-medium leading-tight text-center">
        {month.label.split(" ")[0]}
        <br />
        <span className="text-[9px]">{month.label.split(" ")[1]}</span>
      </span>
    </div>
  );
}

function Stat({ label, value, variant, icon }: { label: string; value: string; variant: "success" | "danger"; icon: React.ReactNode }) {
  return (
    <div className={clsx("flex items-center gap-2 px-3 py-2 rounded-xl border text-xs", variant === "success" ? "bg-success-50 border-success-100 text-success-700" : "bg-danger-50 border-danger-100 text-danger-700")}>
      {icon}
      <div>
        <p className="opacity-70">{label}</p>
        <p className="font-bold text-sm">{value}</p>
      </div>
    </div>
  );
}
