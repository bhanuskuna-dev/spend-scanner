"use client";

import { useState, useCallback, useMemo } from "react";
import { AlertTriangle, RefreshCcw, Wallet2, Github, FileText, X } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { Dashboard } from "@/components/Dashboard";
import { CategoryCard } from "@/components/CategoryCard";
import { CashFlow } from "@/components/CashFlow";
import { FilterBar, type SortOption, type ViewOption } from "@/components/FilterBar";
import { SampleDataButton } from "@/components/SampleDataButton";
import { parseFile } from "@/lib/parser";
import { categorizeTransactions } from "@/lib/categorizer";
import type { RawTransaction, CategorySummary, AnalysisTotals } from "@/lib/types";

type AppState = "idle" | "loading" | "results" | "error";

interface ParsedFile {
  name: string;
  transactions: RawTransaction[];
  endingBalance?: number;
  /** ISO date string of the last transaction in this file, used to pick the authoritative ending balance */
  latestDate: string;
  errors: string[];
}

function deduplicateTransactions(txs: RawTransaction[]): RawTransaction[] {
  const seen = new Set<string>();
  return txs.filter((t) => {
    const key = `${t.date}|${t.description}|${t.amount}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function App() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
  const [summaries, setSummaries] = useState<CategorySummary[]>([]);
  const [totals, setTotals] = useState<AnalysisTotals>({ totalIn: 0, totalOut: 0, net: 0, monthCount: 0 });
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  const [sort, setSort] = useState<SortOption>("amount");
  const [view, setView] = useState<ViewOption>("all");

  /** Merge all parsed files, dedup, then re-run analysis */
  const runAnalysis = useCallback((files: ParsedFile[]) => {
    const allTxs = deduplicateTransactions(
      files.flatMap((f) => f.transactions).sort((a, b) => a.date.localeCompare(b.date))
    );
    const { summaries, totals } = categorizeTransactions(allTxs);
    setSummaries(summaries);
    setTotals(totals);
    setAppState("results");
  }, []);

  const handleFilesAccepted = useCallback(async (files: File[]) => {
    setAppState("loading");

    const newParsed: ParsedFile[] = [];
    const allErrors: string[] = [];

    for (const file of files) {
      try {
        const { transactions, endingBalance, errors } = await parseFile(file);
        if (errors.length) allErrors.push(...errors.map((e) => `${file.name}: ${e}`));
        if (transactions.length > 0) {
          const latestDate = transactions.reduce(
            (max, t) => (t.date > max ? t.date : max),
            transactions[0].date
          );
          newParsed.push({ name: file.name, transactions, endingBalance, latestDate, errors });
        } else {
          allErrors.push(`${file.name}: No transactions found. Make sure the file has date, description, and amount columns.`);
        }
      } catch (err) {
        allErrors.push(`${file.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    setParsedFiles((prev) => {
      const merged = [...prev];
      for (const pf of newParsed) {
        // Replace if same filename, otherwise append
        const idx = merged.findIndex((f) => f.name === pf.name);
        if (idx !== -1) merged[idx] = pf;
        else merged.push(pf);
      }
      const next = merged;
      if (next.length > 0) {
        runAnalysis(next);
      }
      return next;
    });

    setParseErrors(allErrors);

    if (newParsed.length === 0 && allErrors.length > 0) {
      setAppState("error");
    }
  }, [runAnalysis]);

  const handleRemoveFile = useCallback((name: string) => {
    setParsedFiles((prev) => {
      const next = prev.filter((f) => f.name !== name);
      if (next.length === 0) {
        setAppState("idle");
        setSummaries([]);
        setTotals({ totalIn: 0, totalOut: 0, net: 0, monthCount: 0 });
        setParseErrors([]);
        return next;
      }
      runAnalysis(next);
      return next;
    });
  }, [runAnalysis]);

  const handleSampleData = useCallback((transactions: RawTransaction[]) => {
    const sampleFile: ParsedFile = {
      name: "sample-data",
      transactions,
      endingBalance: undefined,
      latestDate: transactions.reduce((max, t) => (t.date > max ? t.date : max), transactions[0]?.date ?? ""),
      errors: [],
    };
    setParsedFiles([sampleFile]);
    setParseErrors([]);
    runAnalysis([sampleFile]);
  }, [runAnalysis]);

  const handleReset = useCallback(() => {
    setAppState("idle");
    setParsedFiles([]);
    setSummaries([]);
    setTotals({ totalIn: 0, totalOut: 0, net: 0, monthCount: 0 });
    setParseErrors([]);
    setSort("amount");
    setView("all");
  }, []);

  /** Ending balance = from the file whose latest transaction date is most recent */
  const endingBalance = useMemo(() => {
    const withBalance = parsedFiles.filter((f) => f.endingBalance !== undefined);
    if (withBalance.length === 0) return undefined;
    withBalance.sort((a, b) => b.latestDate.localeCompare(a.latestDate));
    return withBalance[0].endingBalance;
  }, [parsedFiles]);

  /** All raw transactions merged across files */
  const rawTransactions = useMemo(() =>
    deduplicateTransactions(
      parsedFiles.flatMap((f) => f.transactions).sort((a, b) => a.date.localeCompare(b.date))
    ),
    [parsedFiles]
  );

  const filteredSummaries = useMemo(() => {
    let list = [...summaries];
    if (view === "spending") list = list.filter((s) => s.category !== "Income");
    if (view === "income")   list = list.filter((s) => s.category === "Income");

    const income = list.filter((s) => s.category === "Income");
    const rest   = list.filter((s) => s.category !== "Income");

    if (sort === "amount") rest.sort((a, b) => b.total - a.total);
    if (sort === "count")  rest.sort((a, b) => b.count - a.count);
    if (sort === "alpha")  rest.sort((a, b) => a.category.localeCompare(b.category));

    return [...income, ...rest];
  }, [summaries, view, sort]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet2 className="w-5 h-5 text-brand-600" />
            <span className="font-bold text-slate-900 tracking-tight">SpendScanner</span>
          </div>
          <div className="flex items-center gap-3">
            {appState === "results" && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                Start over
              </button>
            )}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* ── Hero ── */}
        {appState === "idle" && (
          <section className="space-y-8">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-600 text-xs font-semibold mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                100% Browser-Based · Zero Data Shared
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">
                See exactly where{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-danger-500 to-brand-600">
                  your money
                </span>{" "}
                goes each month
              </h1>
              <p className="text-slate-500 text-lg">
                Upload one or more bank statements. We'll break down every dollar of cash
                in vs. cash out — sorted into mortgage, credit cards, auto, groceries, and more.
              </p>
            </div>
            <FileUpload onFilesAccepted={handleFilesAccepted} isLoading={false} />
            <div className="flex justify-center">
              <SampleDataButton onLoad={handleSampleData} />
            </div>
          </section>
        )}

        {/* ── Loading ── */}
        {appState === "loading" && (
          <section className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-slate-800">Crunching your transactions…</h2>
              <p className="text-slate-500 text-sm">All processing happens in your browser.</p>
            </div>
            <FileUpload onFilesAccepted={handleFilesAccepted} isLoading={true} />
          </section>
        )}

        {/* ── Error ── */}
        {appState === "error" && (
          <section className="max-w-2xl mx-auto space-y-6">
            <div className="rounded-2xl border border-danger-200 bg-danger-50 p-6 space-y-3">
              <div className="flex items-center gap-2 text-danger-700 font-semibold">
                <AlertTriangle className="w-5 h-5" />
                Could not parse your file{parseErrors.length > 1 ? "s" : ""}
              </div>
              <ul className="space-y-1">
                {parseErrors.map((e, i) => (
                  <li key={i} className="text-sm text-danger-600">• {e}</li>
                ))}
              </ul>
            </div>
            <div className="text-center">
              <button
                onClick={handleReset}
                className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors"
              >
                Try different files
              </button>
            </div>
            <FileUpload onFilesAccepted={handleFilesAccepted} isLoading={false} />
          </section>
        )}

        {/* ── Results ── */}
        {appState === "results" && (
          <section className="space-y-8">
            {/* Soft parse warnings */}
            {parseErrors.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm text-amber-700">
                  <span className="font-semibold">Heads up:</span> {parseErrors.join("; ")}
                </div>
              </div>
            )}

            {/* Loaded files list */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Loaded:</span>
              {parsedFiles.map((f) => (
                <div
                  key={f.name}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 shadow-sm"
                >
                  <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="max-w-[180px] truncate">{f.name}</span>
                  <span className="text-slate-400">· {f.transactions.length} txns</span>
                  <button
                    onClick={() => handleRemoveFile(f.name)}
                    className="ml-1 text-slate-300 hover:text-danger-500 transition-colors"
                    aria-label={`Remove ${f.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <Dashboard
              transactions={rawTransactions}
              summaries={summaries}
              totals={totals}
              endingBalance={endingBalance}
            />

            <CashFlow transactions={rawTransactions} endingBalance={endingBalance} />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  Spending by category
                  <span className="ml-2 text-sm font-normal text-slate-400">
                    ({filteredSummaries.length} {filteredSummaries.length === 1 ? "category" : "categories"})
                  </span>
                </h2>
              </div>

              <FilterBar sort={sort} view={view} onSort={setSort} onView={setView} />

              {filteredSummaries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
                  <p className="text-slate-400 text-sm">No categories match the current filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredSummaries.map((summary) => (
                    <CategoryCard
                      key={summary.category}
                      summary={summary}
                      totalCashOut={totals.totalOut}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Add more statements */}
            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-500 mb-4">
                Add another statement
              </h3>
              <FileUpload onFilesAccepted={handleFilesAccepted} isLoading={false} />
            </div>
          </section>
        )}
      </main>

      <footer className="mt-16 border-t border-slate-100 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span>SpendScanner — all processing is local, no data sent to any server.</span>
          <span>Built with Next.js · Tailwind · PapaParse</span>
        </div>
      </footer>
    </div>
  );
}
