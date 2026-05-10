"use client";

import { ArrowDownLeft, ArrowUpRight, Wallet, PieChart, Landmark, TrendingUp } from "lucide-react";
import clsx from "clsx";
import type { CategorySummary, AnalysisTotals, RawTransaction } from "@/lib/types";
import { CATEGORY_META } from "@/lib/categories";

interface DashboardProps {
  transactions: RawTransaction[];
  summaries: CategorySummary[];
  totals: AnalysisTotals;
  endingBalance?: number;
}

interface MonthData {
  sortKey: string;
  label: string;
  cashIn: number;
  cashOut: number;
  net: number;
  endingBalance?: number;
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function buildMonthlyData(transactions: RawTransaction[], endingBalance?: number): MonthData[] {
  const map = new Map<string, { cashIn: number; cashOut: number }>();

  for (const tx of transactions) {
    const d = new Date(tx.date);
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const entry = map.get(key) ?? { cashIn: 0, cashOut: 0 };
    if (tx.amount < 0) entry.cashIn += Math.abs(tx.amount);
    else entry.cashOut += tx.amount;
    map.set(key, entry);
  }

  const months: MonthData[] = [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, { cashIn, cashOut }]) => {
      const [year, month] = key.split("-");
      return { sortKey: key, label: `${MONTH_NAMES[parseInt(month) - 1]} ${year}`, cashIn, cashOut, net: cashIn - cashOut };
    });

  if (endingBalance !== undefined && months.length > 0) {
    // Work backwards from the known ending balance
    months[months.length - 1].endingBalance = endingBalance;
    for (let i = months.length - 2; i >= 0; i--) {
      months[i].endingBalance = months[i + 1].endingBalance! - months[i + 1].net;
    }
  }

  return months;
}

function latestMonthBalance(transactions: RawTransaction[]): { label: string; net: number } | null {
  if (transactions.length === 0) return null;
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  const latest = sorted[0].date.slice(0, 7);
  const monthTxs = transactions.filter((t) => t.date.startsWith(latest));
  const cashIn  = monthTxs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const cashOut = monthTxs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const [year, month] = latest.split("-");
  return { label: `${MONTH_NAMES[parseInt(month) - 1]} ${year}`, net: cashIn - cashOut };
}

export function Dashboard({ transactions, summaries, totals, endingBalance }: DashboardProps) {
  const isPositive = totals.net >= 0;
  const lastMonth = latestMonthBalance(transactions);
  const topCategory = summaries.find((s) => s.category !== "Income");
  const savingsRate = totals.totalIn > 0 ? Math.max(0, (totals.net / totals.totalIn) * 100) : 0;

  const cashInCount  = transactions.filter((t) => t.amount < 0).length;
  const cashOutCount = transactions.filter((t) => t.amount > 0).length;

  const maxBar = Math.max(totals.totalIn, totals.totalOut, 1);
  const inWidth  = (totals.totalIn  / maxBar) * 100;
  const outWidth = (totals.totalOut / maxBar) * 100;

  const months = buildMonthlyData(transactions, endingBalance);
  const latestMonth = months[months.length - 1];
  const hasRealBalance = endingBalance !== undefined;

  return (
    <div className="space-y-4">
      {/* ── Monthly ending balance hero — always visible ── */}
      <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white shadow-card p-6 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
          {/* Big current balance figure */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center shrink-0">
              {hasRealBalance ? <Landmark className="w-6 h-6 text-brand-600" /> : <TrendingUp className="w-6 h-6 text-brand-600" />}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
                {hasRealBalance ? `Ending Balance · ${latestMonth?.label ?? "Latest"}` : `Net This Period`}
              </p>
              <p className="text-3xl sm:text-4xl font-extrabold text-brand-700 tabular-nums leading-tight">
                {hasRealBalance
                  ? `$${endingBalance!.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : `${isPositive ? "+" : "-"}$${Math.abs(totals.net).toFixed(2)}`}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {hasRealBalance
                  ? "Statement ending balance — cash remaining"
                  : "Total cash in minus total cash out"}
              </p>
            </div>
          </div>

          {/* Month-by-month chips */}
          {months.length > 1 && (
            <div className="flex flex-wrap gap-2 sm:justify-end">
              {months.map((m, i) => {
                const isLast = i === months.length - 1;
                const displayAmt = hasRealBalance
                  ? m.endingBalance!
                  : m.net;
                const positive = displayAmt >= 0;
                return (
                  <div
                    key={m.sortKey}
                    className={clsx(
                      "flex flex-col items-end px-3 py-2 rounded-xl border text-xs",
                      isLast
                        ? "bg-brand-100 border-brand-300 text-brand-800"
                        : "bg-white border-slate-200 text-slate-600"
                    )}
                  >
                    <span className="font-semibold text-[10px] uppercase tracking-wide opacity-70">{m.label}</span>
                    <span className={clsx("font-bold text-sm tabular-nums", positive ? (isLast ? "text-brand-700" : "text-success-700") : "text-danger-700")}>
                      {hasRealBalance
                        ? `$${displayAmt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : `${positive ? "+" : "-"}$${Math.abs(displayAmt).toFixed(2)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Saving / overspending badge */}
        <div className={clsx(
          "mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold",
          isPositive ? "bg-success-50 text-success-700 border border-success-200" : "bg-danger-50 text-danger-700 border border-danger-200"
        )}>
          {isPositive ? "▲ Saving" : "▼ Overspending by"} ${Math.abs(totals.net).toFixed(2)}
          {isPositive && totals.totalIn > 0 && ` (${savingsRate.toFixed(1)}% savings rate)`}
          {" "}over the period
        </div>
      </div>

      {/* ── Cash in vs cash out ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-card p-6 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Cash flow overview</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Across {totals.monthCount} month{totals.monthCount !== 1 ? "s" : ""} of activity
            </p>
          </div>

          {/* Cash remaining — always shown */}
          <div className="flex flex-col items-start sm:items-end">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {hasRealBalance ? "Cash remaining" : "Net cash"}
            </p>
            <p className={clsx(
              "text-2xl font-extrabold tabular-nums leading-tight",
              hasRealBalance ? "text-brand-700" : isPositive ? "text-success-700" : "text-danger-700"
            )}>
              {hasRealBalance
                ? `$${endingBalance!.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `${isPositive ? "+" : "-"}$${Math.abs(totals.net).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              }
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {hasRealBalance ? "statement ending balance" : "total in minus total out"}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <BarRow
            icon={<ArrowDownLeft className="w-4 h-4" />}
            label="Total Cash In"
            sub={`${cashInCount} deposit${cashInCount !== 1 ? "s" : ""}`}
            amount={totals.totalIn}
            width={inWidth}
            tone="success"
          />
          <BarRow
            icon={<ArrowUpRight className="w-4 h-4" />}
            label="Total Cash Out"
            sub={`${cashOutCount} charge${cashOutCount !== 1 ? "s" : ""}`}
            amount={totals.totalOut}
            width={outWidth}
            tone="danger"
          />
        </div>
      </div>

      {/* ── Stat row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={lastMonth ? `Net · ${lastMonth.label}` : "Latest Month"}
          value={lastMonth ? `${lastMonth.net >= 0 ? "+" : ""}$${Math.abs(lastMonth.net).toFixed(2)}` : "—"}
          sub={lastMonth && lastMonth.net >= 0 ? "net positive month" : "net negative month"}
          icon={Wallet}
          color={lastMonth && lastMonth.net >= 0 ? "success" : "danger"}
        />
        <StatCard
          label="Avg Monthly Spend"
          value={`$${(totals.totalOut / totals.monthCount).toFixed(2)}`}
          sub={`across ${totals.monthCount} month${totals.monthCount !== 1 ? "s" : ""}`}
          icon={ArrowUpRight}
          color="danger"
        />
        <StatCard
          label="Avg Monthly Income"
          value={`$${(totals.totalIn / totals.monthCount).toFixed(2)}`}
          sub={`across ${totals.monthCount} month${totals.monthCount !== 1 ? "s" : ""}`}
          icon={ArrowDownLeft}
          color="success"
        />
        <StatCard
          label="Top Spend Category"
          value={topCategory ? `${CATEGORY_META[topCategory.category].emoji} ${topCategory.category}` : "—"}
          sub={topCategory ? `$${topCategory.total.toFixed(2)} (${topCategory.count} txns)` : "—"}
          icon={PieChart}
          color="brand"
          compact
        />
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function BarRow({
  icon, label, sub, amount, width, tone,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  amount: number;
  width: number;
  tone: "success" | "danger";
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className={clsx(
            "w-7 h-7 rounded-lg flex items-center justify-center",
            tone === "success" ? "bg-success-100 text-success-600" : "bg-danger-100 text-danger-600"
          )}>
            {icon}
          </span>
          <div>
            <p className="text-xs font-semibold text-slate-700">{label}</p>
            <p className="text-[10px] text-slate-400">{sub}</p>
          </div>
        </div>
        <p className={clsx(
          "text-xl font-bold tabular-nums",
          tone === "success" ? "text-success-700" : "text-danger-700"
        )}>
          ${amount.toFixed(2)}
        </p>
      </div>
      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={clsx(
            "h-full rounded-full transition-all duration-700 ease-out",
            tone === "success" ? "bg-success-400" : "bg-danger-400"
          )}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  color: "success" | "danger" | "brand" | "slate";
  compact?: boolean;
}

function StatCard({ label, value, sub, icon: Icon, color, compact }: StatCardProps) {
  const colorMap = {
    success: { bg: "bg-success-50", border: "border-success-100", icon: "bg-success-100 text-success-600", label: "text-success-600", value: "text-success-700" },
    danger:  { bg: "bg-danger-50",  border: "border-danger-100",  icon: "bg-danger-100 text-danger-600",   label: "text-danger-600",  value: "text-danger-700"  },
    brand:   { bg: "bg-brand-50",   border: "border-brand-100",   icon: "bg-brand-100 text-brand-600",     label: "text-brand-600",   value: "text-brand-700"   },
    slate:   { bg: "bg-slate-50",   border: "border-slate-100",   icon: "bg-slate-100 text-slate-500",     label: "text-slate-500",   value: "text-slate-800"   },
  } as const;
  const c = colorMap[color];

  return (
    <div className={`rounded-2xl border ${c.bg} ${c.border} p-5 shadow-card animate-fade-in-up`}>
      <div className="flex items-start justify-between mb-3">
        <p className={`text-xs font-semibold uppercase tracking-wide ${c.label}`}>{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.icon}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className={clsx("font-bold", c.value, compact ? "text-base truncate" : "text-2xl")}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}
