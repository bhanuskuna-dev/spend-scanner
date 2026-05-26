"use client";

import { useState } from "react";
import { X, FlaskConical, CheckCircle2, XCircle, Clock, DollarSign, Sparkles } from "lucide-react";
import type { EvalRunResult } from "@/app/api/evals/route";

interface EvalsModalProps {
  onClose: () => void;
}

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function AccuracyBadge({ value }: { value: number }) {
  const cls =
    value >= 0.9
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : value >= 0.75
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-danger-100 text-danger-700 border-danger-200";
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${cls}`}>
      {pct(value)}
    </span>
  );
}

export function EvalsModal({ onClose }: EvalsModalProps) {
  const [result, setResult] = useState<EvalRunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const runEvals = async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/evals", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Eval run failed");
      setResult(data as EvalRunResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsRunning(false);
    }
  };

  const categoryRows = result
    ? Object.keys(result.precisionByCategory)
        .map((cat) => ({
          cat,
          precision: result.precisionByCategory[cat],
          recall: result.recallByCategory[cat],
          f1:
            result.precisionByCategory[cat] + result.recallByCategory[cat] > 0
              ? (2 * result.precisionByCategory[cat] * result.recallByCategory[cat]) /
                (result.precisionByCategory[cat] + result.recallByCategory[cat])
              : 0,
        }))
        .sort((a, b) => a.f1 - b.f1)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <FlaskConical className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">AI Categorization Evals</p>
            <p className="text-xs text-slate-400">30-transaction golden dataset · claude-haiku-4-5</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Run button + intro */}
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm text-slate-500 max-w-md">
              Runs the production categorization model against a curated set of 30 labeled
              transactions — including tricky edge cases. Measures accuracy, precision/recall per
              category, and confidence calibration.
            </p>
            <button
              onClick={runEvals}
              disabled={isRunning}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold shrink-0 transition-colors shadow-sm"
            >
              {isRunning ? (
                <>
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  Running…
                </>
              ) : (
                <>
                  <FlaskConical className="w-4 h-4" />
                  Run Evals
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
              {error}
            </div>
          )}

          {result && (
            <>
              {/* Hero metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Accuracy</p>
                  <p
                    className={`text-2xl font-extrabold ${
                      result.accuracy >= 0.9
                        ? "text-emerald-600"
                        : result.accuracy >= 0.75
                        ? "text-amber-600"
                        : "text-danger-600"
                    }`}
                  >
                    {pct(result.accuracy)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {result.correctCount}/{result.totalCount} correct
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Latency
                  </p>
                  <p className="text-2xl font-extrabold text-slate-800">
                    {(result.latencyMs / 1000).toFixed(1)}s
                  </p>
                  <p className="text-xs text-slate-400">wall-clock time</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Est. Cost
                  </p>
                  <p className="text-2xl font-extrabold text-slate-800">
                    ${result.estimatedCostUsd.toFixed(4)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {result.inputTokens.toLocaleString()}in · {result.outputTokens.toLocaleString()}out
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Avg Confidence</p>
                  <p className="text-2xl font-extrabold text-slate-800">
                    {pct(result.avgConfidence)}
                  </p>
                  <p className="text-xs text-slate-400">self-reported</p>
                </div>
              </div>

              {/* Calibration chart */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3">
                  Confidence Calibration
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    Are high-confidence predictions actually more accurate?
                  </span>
                </h3>
                <div className="space-y-2">
                  {result.calibrationBuckets.map((b) => (
                    <div key={b.label} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-36 shrink-0">{b.label}</span>
                      {b.count === 0 ? (
                        <span className="text-xs text-slate-300 italic">no predictions</span>
                      ) : (
                        <>
                          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full ${
                                b.accuracy >= 0.9
                                  ? "bg-emerald-500"
                                  : b.accuracy >= 0.75
                                  ? "bg-amber-400"
                                  : "bg-danger-400"
                              }`}
                              style={{ width: `${b.accuracy * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700 w-10 text-right">
                            {pct(b.accuracy)}
                          </span>
                          <span className="text-xs text-slate-400 w-16 text-right">
                            n={b.count}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  A well-calibrated model has higher accuracy in higher-confidence buckets.
                </p>
              </div>

              {/* Per-category table */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3">
                  Per-Category Performance
                  <span className="ml-2 text-xs font-normal text-slate-400">sorted by F1 (lowest first)</span>
                </h3>
                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                        <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Precision</th>
                        <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Recall</th>
                        <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">F1</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {categoryRows.map((row) => (
                        <tr key={row.cat} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2.5 text-slate-700 font-medium text-xs">{row.cat}</td>
                          <td className="px-3 py-2.5 text-center">
                            <AccuracyBadge value={row.precision} />
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <AccuracyBadge value={row.recall} />
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <AccuracyBadge value={row.f1} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transaction drill-down */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3">
                  Transaction Results
                  <span className="ml-2 text-xs font-normal text-slate-400">click to see notes</span>
                </h3>
                <div className="space-y-1.5">
                  {result.results.map((r) => (
                    <div key={r.id}>
                      <button
                        onClick={() => setExpandedRow(expandedRow === r.id ? null : r.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
                      >
                        {r.correct ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-danger-500 shrink-0" />
                        )}
                        <span className="flex-1 text-xs text-slate-700 truncate font-mono">
                          {r.description}
                        </span>
                        <span className="text-xs text-slate-400 shrink-0">
                          {r.correct ? (
                            <span className="text-emerald-600 font-medium">{r.predictedCategory}</span>
                          ) : (
                            <>
                              <span className="text-danger-600 font-medium line-through mr-1">
                                {r.predictedCategory}
                              </span>
                              <span className="text-slate-600">→ {r.expectedCategory}</span>
                            </>
                          )}
                        </span>
                        <span className="text-xs text-slate-300 font-mono shrink-0">
                          {pct(r.confidence)}
                        </span>
                      </button>
                      {expandedRow === r.id && (
                        <div className="mx-3 mb-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                          <p className="text-xs text-slate-500">
                            <span className="font-semibold text-slate-700">AI reasoning:</span> {r.reasoning}
                          </p>
                          <p className="text-xs text-slate-400">
                            <span className="font-semibold text-slate-600">Why it&apos;s {r.expectedCategory}:</span> {r.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {!result && !isRunning && !error && (
            <div className="flex flex-col items-center justify-center py-14 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center">
                <FlaskConical className="w-6 h-6 text-violet-400" />
              </div>
              <p className="text-slate-500 text-sm font-medium">No eval run yet</p>
              <p className="text-slate-400 text-xs max-w-xs">
                Click &ldquo;Run Evals&rdquo; to test the categorization model against the golden dataset.
                Each run costs ~$0.001 and takes 3–5 seconds.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
