"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { getTraces, clearTraces, type TraceEntry, TRACE_UPDATED_EVENT } from "@/lib/traceLog";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatCost(usd: number): string {
  if (usd < 0.00005) return "<$0.0001";
  return `$${usd.toFixed(4)}`;
}

function ModelBadge({ model }: { model: string }) {
  const isHaiku = model.includes("haiku");
  return (
    <span
      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
        isHaiku
          ? "bg-violet-100 text-violet-700"
          : "bg-brand-100 text-brand-700"
      }`}
    >
      {isHaiku ? "Haiku" : "Sonnet"}
    </span>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="text-base font-bold text-slate-800 tabular-nums">{value}</p>
    </div>
  );
}

export function TraceLogPanel() {
  const [traces, setTraces] = useState<TraceEntry[]>([]);
  const [expanded, setExpanded] = useState(false);

  const reload = useCallback(() => setTraces(getTraces()), []);

  useEffect(() => {
    reload();
    window.addEventListener(TRACE_UPDATED_EVENT, reload);
    return () => window.removeEventListener(TRACE_UPDATED_EVENT, reload);
  }, [reload]);

  if (traces.length === 0 && !expanded) return null;

  const totalCalls = traces.length;
  const totalTokens = traces.reduce((s, t) => s + t.inputTokens + t.outputTokens, 0);
  const totalCost = traces.reduce((s, t) => s + t.estimatedCostUsd, 0);
  const avgLatency =
    traces.length > 0
      ? traces.reduce((s, t) => s + t.latencyMs, 0) / traces.length
      : 0;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">Trace Log</span>
          {traces.length > 0 && (
            <span className="text-xs text-slate-400">
              {totalCalls} call{totalCalls !== 1 ? "s" : ""} ·{" "}
              {totalTokens.toLocaleString()} tokens · {formatCost(totalCost)} ·{" "}
              {Math.round(avgLatency)}ms avg
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-slate-100">
          {/* Summary row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-100">
            <SummaryCell label="Total Calls" value={String(totalCalls)} />
            <SummaryCell label="Total Tokens" value={totalTokens.toLocaleString()} />
            <SummaryCell label="Est. Cost" value={formatCost(totalCost)} />
            <SummaryCell label="Avg Latency" value={`${Math.round(avgLatency)}ms`} />
          </div>

          {/* Actions bar */}
          <div className="px-5 py-3 flex items-center justify-between border-b border-slate-50">
            <p className="text-xs text-slate-400">
              Last {traces.length} entries · newest first · persists across sessions
            </p>
            <button
              onClick={() => {
                clearTraces();
                setTraces([]);
              }}
              className="flex items-center gap-1.5 text-xs font-medium text-danger-500 hover:text-danger-700 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Traces
            </button>
          </div>

          {/* Table */}
          {traces.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">
              No traces yet. Use AI features to generate traces.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    {[
                      "Time",
                      "Operation",
                      "Model",
                      "In Tokens",
                      "Out Tokens",
                      "Est. Cost",
                      "Latency",
                      "Prompt Ver.",
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={`px-4 py-2 font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap ${
                          i >= 3 && i <= 6 ? "text-right" : ""
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {traces.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-slate-500 font-mono whitespace-nowrap">
                        {formatTime(t.timestamp)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium whitespace-nowrap">
                          {t.operation}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <ModelBadge model={t.model} />
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-600 tabular-nums">
                        {t.inputTokens.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-600 tabular-nums">
                        {t.outputTokens.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-600 tabular-nums font-mono">
                        {formatCost(t.estimatedCostUsd)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-600 tabular-nums">
                        {t.latencyMs}ms
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 font-mono">
                        {t.promptVersion}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
