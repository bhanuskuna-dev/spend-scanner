"use client";

import { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import { X, Activity, Download, Trash2 } from "lucide-react";
import {
  getTraces,
  clearTraces,
  exportTraces,
  type TraceEntry,
  type OperationLabel,
} from "@/lib/observability";

interface ObservabilityDashboardProps {
  onClose: () => void;
}

const OP_COLOR: Record<OperationLabel, string> = {
  "transaction-categorization": "#6366f1",
  "savings-coach": "#0ea5e9",
  "eval-judge": "#8b5cf6",
  "feedback-improvement": "#10b981",
};

const OP_LABEL: Record<OperationLabel, string> = {
  "transaction-categorization": "Categorization",
  "savings-coach": "Savings Coach",
  "eval-judge": "Eval Judge",
  "feedback-improvement": "Feedback",
};

function fmtMs(ms: number) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}

function fmtCost(n: number) {
  return `$${n.toFixed(4)}`;
}

export function ObservabilityDashboard({ onClose }: ObservabilityDashboardProps) {
  const [traces, setTraces] = useState<TraceEntry[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const refresh = useCallback(() => setTraces(getTraces()), []);

  useEffect(() => {
    refresh();
    window.addEventListener("observability-update", refresh);
    return () => window.removeEventListener("observability-update", refresh);
  }, [refresh]);

  const summary = useMemo(() => {
    if (traces.length === 0) return null;
    const errors = traces.filter((t) => !t.success).length;
    return {
      totalCalls: traces.length,
      totalIn: traces.reduce((s, t) => s + t.inputTokens, 0),
      totalOut: traces.reduce((s, t) => s + t.outputTokens, 0),
      totalCost: traces.reduce((s, t) => s + t.estimatedCostUsd, 0),
      avgLatency: traces.reduce((s, t) => s + t.latencyMs, 0) / traces.length,
      errorRate: errors / traces.length,
    };
  }, [traces]);

  // Cost by operation
  const costByOp = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const t of traces) acc[t.operation] = (acc[t.operation] ?? 0) + t.estimatedCostUsd;
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
  }, [traces]);
  const maxCost = costByOp[0]?.[1] ?? 0.0001;

  // Latency trend — last 20 calls, oldest→newest
  const latencyTrend = useMemo(() => [...traces].reverse().slice(0, 20), [traces]);
  const maxLatency = Math.max(...latencyTrend.map((t) => t.latencyMs), 1);
  const SVG_W = 400;
  const SVG_H = 56;
  const latencyPoints = latencyTrend.map((t, i) => {
    const x = latencyTrend.length < 2 ? SVG_W / 2 : (i / (latencyTrend.length - 1)) * SVG_W;
    const y = SVG_H - (t.latencyMs / maxLatency) * SVG_H * 0.88 - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  // Prompt version stats
  const byVersion = useMemo(() => {
    const acc: Record<string, { calls: number; latency: number; cost: number; errors: number }> = {};
    for (const t of traces) {
      const v = t.promptVersion;
      if (!acc[v]) acc[v] = { calls: 0, latency: 0, cost: 0, errors: 0 };
      acc[v].calls++;
      acc[v].latency += t.latencyMs;
      acc[v].cost += t.estimatedCostUsd;
      if (!t.success) acc[v].errors++;
    }
    return Object.entries(acc);
  }, [traces]);

  const displayTraces = traces.slice(0, 50);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">AI Observability</p>
            <p className="text-xs text-slate-400">Token · cost · latency tracking across all Claude API calls</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={exportTraces}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>
            <button
              onClick={() => { clearTraces(); setTraces([]); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-100 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {traces.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center">
                <Activity className="w-6 h-6 text-sky-300" />
              </div>
              <p className="text-slate-500 text-sm font-medium">No traces yet</p>
              <p className="text-slate-400 text-xs max-w-xs">
                Use the app — categorize transactions, chat with the savings agent, or run evals — to start capturing traces.
              </p>
            </div>
          ) : (
            <>
              {/* ── Summary Row ── */}
              {summary && (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {[
                    { label: "Total Calls", value: summary.totalCalls.toString() },
                    { label: "Tokens In", value: summary.totalIn.toLocaleString() },
                    { label: "Tokens Out", value: summary.totalOut.toLocaleString() },
                    { label: "Total Cost", value: fmtCost(summary.totalCost) },
                    { label: "Avg Latency", value: fmtMs(summary.avgLatency) },
                    { label: "Error Rate", value: `${Math.round(summary.errorRate * 100)}%` },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
                      <p className="text-lg font-extrabold text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Cost by Operation ── */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3">Cost by Operation</h3>
                <div className="space-y-3">
                  {costByOp.map(([op, cost]) => (
                    <div key={op} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-36 shrink-0">
                        {OP_LABEL[op as OperationLabel] ?? op}
                      </span>
                      <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-3 rounded-full transition-all"
                          style={{
                            width: `${(cost / maxCost) * 100}%`,
                            backgroundColor: OP_COLOR[op as OperationLabel] ?? "#94a3b8",
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-700 w-20 text-right font-mono">
                        {fmtCost(cost)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Latency Trend ── */}
              {latencyTrend.length >= 2 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-3">
                    Latency Trend
                    <span className="ml-2 text-xs font-normal text-slate-400">last {latencyTrend.length} calls</span>
                  </h3>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <svg viewBox={`0 0 ${SVG_W} ${SVG_H + 8}`} className="w-full h-16 overflow-visible">
                      <polyline
                        points={latencyPoints.join(" ")}
                        fill="none"
                        stroke="#0ea5e9"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {latencyTrend.map((t, i) => {
                        const x = latencyTrend.length < 2 ? SVG_W / 2 : (i / (latencyTrend.length - 1)) * SVG_W;
                        const y = SVG_H - (t.latencyMs / maxLatency) * SVG_H * 0.88 - 2;
                        return (
                          <circle key={i} cx={x} cy={y} r="3" fill={t.success ? "#0ea5e9" : "#ef4444"} />
                        );
                      })}
                    </svg>
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>oldest</span>
                      <span>avg {fmtMs(latencyTrend.reduce((s, t) => s + t.latencyMs, 0) / latencyTrend.length)}</span>
                      <span>newest</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Prompt Version Comparison ── */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3">
                  Prompt Version Comparison
                  <span className="ml-2 text-xs font-normal text-slate-400">A/B testing foundation</span>
                </h3>
                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Version</th>
                        <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Calls</th>
                        <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Avg Latency</th>
                        <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Avg Cost</th>
                        <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Success Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {byVersion.map(([version, stats]) => {
                        const successRate = (stats.calls - stats.errors) / stats.calls;
                        return (
                          <tr key={version} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-2.5 font-mono text-xs font-bold text-slate-700">{version}</td>
                            <td className="px-3 py-2.5 text-center text-xs text-slate-600">{stats.calls}</td>
                            <td className="px-3 py-2.5 text-center text-xs text-slate-600">{fmtMs(stats.latency / stats.calls)}</td>
                            <td className="px-3 py-2.5 text-center text-xs font-mono text-slate-600">{fmtCost(stats.cost / stats.calls)}</td>
                            <td className="px-3 py-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                                successRate >= 0.95
                                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                  : "bg-amber-100 text-amber-700 border-amber-200"
                              }`}>
                                {Math.round(successRate * 100)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Trace Log ── */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3">
                  Trace Log
                  <span className="ml-2 text-xs font-normal text-slate-400">last 50 · click to expand</span>
                </h3>
                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Time</th>
                        <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Operation</th>
                        <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Model</th>
                        <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tokens In/Out</th>
                        <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cost</th>
                        <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Latency</th>
                        <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {displayTraces.map((trace) => (
                        <Fragment key={trace.id}>
                          <tr
                            onClick={() => setExpandedRow(expandedRow === trace.id ? null : trace.id)}
                            className="hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <td className="px-3 py-2.5 text-xs text-slate-500 font-mono">
                              {new Date(trace.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="px-3 py-2.5">
                              <span
                                className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                style={{ backgroundColor: OP_COLOR[trace.operation] ?? "#94a3b8" }}
                              >
                                {OP_LABEL[trace.operation] ?? trace.operation}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-slate-500 font-mono">
                              {trace.model.includes("haiku") ? "haiku-4-5" : "sonnet-4-6"}
                            </td>
                            <td className="px-3 py-2.5 text-center text-xs text-slate-600 font-mono">
                              {trace.inputTokens.toLocaleString()} / {trace.outputTokens.toLocaleString()}
                            </td>
                            <td className="px-3 py-2.5 text-center text-xs font-mono text-slate-600">
                              {fmtCost(trace.estimatedCostUsd)}
                            </td>
                            <td className="px-3 py-2.5 text-center text-xs text-slate-600">
                              {fmtMs(trace.latencyMs)}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              {trace.success ? (
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">OK</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">ERR</span>
                              )}
                            </td>
                          </tr>
                          {expandedRow === trace.id && (
                            <tr>
                              <td colSpan={7} className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                                <div className="space-y-1.5">
                                  {trace.inputSummary && (
                                    <p className="text-xs text-slate-600">
                                      <span className="font-semibold text-slate-500">Input: </span>
                                      <span className="font-mono">{trace.inputSummary}</span>
                                    </p>
                                  )}
                                  {trace.outputSummary && (
                                    <p className="text-xs text-slate-600">
                                      <span className="font-semibold text-slate-500">Output: </span>
                                      <span className="font-mono">{trace.outputSummary}</span>
                                    </p>
                                  )}
                                  {trace.error && (
                                    <p className="text-xs text-red-600">
                                      <span className="font-semibold">Error: </span>{trace.error}
                                    </p>
                                  )}
                                  <p className="text-xs text-slate-400">
                                    Prompt: <span className="font-mono">{trace.promptVersion}</span>
                                    <span className="mx-2">·</span>
                                    ID: <span className="font-mono">{trace.id}</span>
                                  </p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
