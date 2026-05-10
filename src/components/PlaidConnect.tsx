"use client";

import { useState } from "react";
import { Building2, Loader2, AlertCircle, ServerCog } from "lucide-react";
import clsx from "clsx";
import type { RawTransaction } from "@/lib/types";

interface PlaidConnectProps {
  onTransactionsLoaded: (transactions: RawTransaction[]) => void;
}

export function PlaidConnect({ onTransactionsLoaded }: PlaidConnectProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<30 | 60 | 90 | 180>(90);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/plaid/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      if (!Array.isArray(data.transactions) || data.transactions.length === 0) {
        throw new Error("Plaid returned no transactions for this date range.");
      }
      onTransactionsLoaded(data.transactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-card p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-brand-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900">Import live from Plaid</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pull transactions from your linked bank accounts via the Plaid Dashboard MCP server.
          </p>
        </div>
      </div>

      {/* Range picker */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-500">Range:</span>
        {([30, 60, 90, 180] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            disabled={loading}
            className={clsx(
              "px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border",
              days === d
                ? "bg-brand-500 text-white border-brand-500"
                : "bg-white text-slate-500 border-slate-200 hover:border-brand-300"
            )}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={handleConnect}
        disabled={loading}
        className={clsx(
          "w-full px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2",
          loading
            ? "bg-brand-400 cursor-wait"
            : "bg-brand-500 hover:bg-brand-600 active:bg-brand-700"
        )}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Fetching transactions…
          </>
        ) : (
          <>
            <ServerCog className="w-4 h-4" />
            Fetch last {days} days via MCP
          </>
        )}
      </button>

      {error && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-danger-50 border border-danger-200 text-danger-700 text-xs">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Privacy disclaimer — different from the file-upload path */}
      <p className="text-[11px] text-slate-400 leading-relaxed">
        <span className="font-semibold text-slate-500">Note:</span> unlike file upload, this path
        sends a request to your server, which calls Plaid's MCP endpoint via the Anthropic API.
        Your transactions never persist on disk, but they do leave your browser.
      </p>
    </div>
  );
}
