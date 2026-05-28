"use client";

import { useState, useEffect } from "react";
import { X, FlaskConical, CheckCircle2, XCircle, Clock, DollarSign, Sparkles, Download, History } from "lucide-react";
import type { EvalRunResult } from "@/app/api/evals/route";

interface EvalsModalProps {
  onClose: () => void;
}

interface HistoryEntry {
  runAt: string;
  accuracy: number;
  correctCount: number;
  totalCount: number;
  latencyMs: number;
  estimatedCostUsd: number;
  avgConfidence: number;
}

const HISTORY_KEY = "spend_scanner_eval_history";
const MAX_HISTORY = 10;

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(entry: HistoryEntry) {
  const existing = loadHistory();
  const updated = [entry, ...existing].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return updated;
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

function HistoryChart({ history }: { history: HistoryEntry[] }) {
  if (history.length < 2) return null;
  const entries = [...history].reverse(); // oldest first
  const max = 1;
  const min = Math.min(...entries.map((e) => e.accuracy)) - 0.05;
  const range = max - min;
  const H = 48;
  const W = 100;
  const points = entries.map((e, i) => {
    const x = (i / (entries.length - 1)) * W;
    const y = H - ((e.accuracy - min) / range) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          Accuracy Over Time
          <span className="text-xs font-normal text-slate-400">last {entries.length} runs</span>
        </h3>
        <span className="text-xs text-slate-400">
          {entries[entries.length - 1].accuracy > entries[0].accuracy ? "↑" : entries[entries.length - 1].accuracy < entries[0].accuracy ? "↓" : "→"}{" "}
          {Math.abs(Math.round((entries[entries.length - 1].accuracy - entries[0].accuracy) * 100))}pp since first run
        </span>
      </div>
      <div className="flex items-end gap-0">
        <svg viewBox={`0 0 ${W} ${H + 4}`} className="w-full h-12 overflow-visible">
          <polyline
            points={points.join(" ")}
            fill="none"
            stroke="#7c3aed"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {entries.map((e, i) => {
            const x = (i / (entries.length - 1)) * W;
            const y = H - ((e.accuracy - min) / range) * H;
            return (
              <circle key={i} cx={x} cy={y} r="2.5" fill="#7c3aed" />
            );
          })}
        </svg>
      </div>
      <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {entries.slice(-4).map((e, i) => (
          <div key={i} className="text-center">
            <p className={`text-sm font-bold ${e.accuracy >= 0.9 ? "text-emerald-600" : e.accuracy >= 0.75 ? "text-amber-600" : "text-danger-600"}`}>
              {pct(e.accuracy)}
            </p>
            <p className="text-[10px] text-slate-400">
              {new Date(e.runAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function downloadReport(result: EvalRunResult) {
  const categoryRows = Object.keys(result.precisionByCategory).map((cat) => {
    const p = result.precisionByCategory[cat];
    const r = result.recallByCategory[cat];
    const f1 = p + r > 0 ? (2 * p * r) / (p + r) : 0;
    return { cat, p, r, f1 };
  }).sort((a, b) => a.f1 - b.f1);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>SpendScanner AI Eval Report — ${new Date(result.runAt).toLocaleDateString()}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1e293b; max-width: 800px; margin: 40px auto; padding: 0 24px; }
    h1 { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
    .subtitle { color: #64748b; font-size: 13px; margin-bottom: 32px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
    .card-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 6px; }
    .card-value { font-size: 24px; font-weight: 800; }
    .card-sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }
    .green { color: #059669; } .amber { color: #d97706; } .red { color: #dc2626; }
    h2 { font-size: 15px; font-weight: 700; margin: 28px 0 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 8px 12px; background: #f8fafc; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; }
    td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; border: 1px solid; }
    .badge-green { background: #d1fae5; color: #065f46; border-color: #a7f3d0; }
    .badge-amber { background: #fef3c7; color: #92400e; border-color: #fde68a; }
    .badge-red { background: #fee2e2; color: #991b1b; border-color: #fecaca; }
    .calib-bar-bg { height: 8px; background: #f1f5f9; border-radius: 4px; }
    .calib-bar { height: 8px; border-radius: 4px; }
    .tx-correct { color: #059669; } .tx-wrong { color: #dc2626; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>SpendScanner AI Eval Report</h1>
  <p class="subtitle">Model: claude-haiku-4-5 · Run: ${new Date(result.runAt).toLocaleString()} · Dataset: ${result.totalCount} transactions</p>

  <div class="grid">
    <div class="card">
      <div class="card-label">Accuracy</div>
      <div class="card-value ${result.accuracy >= 0.9 ? "green" : result.accuracy >= 0.75 ? "amber" : "red"}">${pct(result.accuracy)}</div>
      <div class="card-sub">${result.correctCount}/${result.totalCount} correct</div>
    </div>
    <div class="card">
      <div class="card-label">Latency</div>
      <div class="card-value">${(result.latencyMs / 1000).toFixed(1)}s</div>
      <div class="card-sub">wall-clock time</div>
    </div>
    <div class="card">
      <div class="card-label">Est. Cost</div>
      <div class="card-value">$${result.estimatedCostUsd.toFixed(4)}</div>
      <div class="card-sub">${result.inputTokens.toLocaleString()} in · ${result.outputTokens.toLocaleString()} out tokens</div>
    </div>
    <div class="card">
      <div class="card-label">Avg Confidence</div>
      <div class="card-value">${pct(result.avgConfidence)}</div>
      <div class="card-sub">self-reported</div>
    </div>
  </div>

  <h2>Confidence Calibration</h2>
  <table>
    <thead><tr><th>Bucket</th><th>Count</th><th>Accuracy</th><th>Avg Confidence</th></tr></thead>
    <tbody>
      ${result.calibrationBuckets.map((b) => `
      <tr>
        <td>${b.label}</td>
        <td>${b.count}</td>
        <td><span class="badge ${b.accuracy >= 0.9 ? "badge-green" : b.accuracy >= 0.75 ? "badge-amber" : "badge-red"}">${pct(b.accuracy)}</span></td>
        <td>${pct(b.avgConfidence)}</td>
      </tr>`).join("")}
    </tbody>
  </table>

  <h2>Per-Category Performance (sorted by F1)</h2>
  <table>
    <thead><tr><th>Category</th><th>Precision</th><th>Recall</th><th>F1</th></tr></thead>
    <tbody>
      ${categoryRows.map((r) => `
      <tr>
        <td>${r.cat}</td>
        <td><span class="badge ${r.p >= 0.9 ? "badge-green" : r.p >= 0.75 ? "badge-amber" : "badge-red"}">${pct(r.p)}</span></td>
        <td><span class="badge ${r.r >= 0.9 ? "badge-green" : r.r >= 0.75 ? "badge-amber" : "badge-red"}">${pct(r.r)}</span></td>
        <td><span class="badge ${r.f1 >= 0.9 ? "badge-green" : r.f1 >= 0.75 ? "badge-amber" : "badge-red"}">${pct(r.f1)}</span></td>
      </tr>`).join("")}
    </tbody>
  </table>

  <h2>Transaction Results</h2>
  <table>
    <thead><tr><th>#</th><th>Description</th><th>Expected</th><th>Predicted</th><th>Conf.</th><th>Result</th></tr></thead>
    <tbody>
      ${result.results.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td style="font-family:monospace;font-size:11px">${r.description}</td>
        <td>${r.expectedCategory}</td>
        <td class="${r.correct ? "tx-correct" : "tx-wrong"}">${r.predictedCategory}</td>
        <td>${pct(r.confidence)}</td>
        <td>${r.correct ? "✓" : "✗"}</td>
      </tr>`).join("")}
    </tbody>
  </table>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `spendscanner-evals-${new Date(result.runAt).toISOString().slice(0, 10)}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export function EvalsModal({ onClose }: EvalsModalProps) {
  const [result, setResult] = useState<EvalRunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const runEvals = async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/evals", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Eval run failed");
      const evalResult = data as EvalRunResult;
      setResult(evalResult);

      // Save to history
      const entry: HistoryEntry = {
        runAt: evalResult.runAt,
        accuracy: evalResult.accuracy,
        correctCount: evalResult.correctCount,
        totalCount: evalResult.totalCount,
        latencyMs: evalResult.latencyMs,
        estimatedCostUsd: evalResult.estimatedCostUsd,
        avgConfidence: evalResult.avgConfidence,
      };
      setHistory(saveHistory(entry));
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
            <p className="text-xs text-slate-400">38-transaction golden dataset · claude-haiku-4-5</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {result && (
              <button
                onClick={() => downloadReport(result)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download Report
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Run button + intro */}
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm text-slate-500 max-w-md">
              Runs the production categorization model against a curated set of 38 labeled
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

          {/* Version history chart */}
          <HistoryChart history={history} />

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
