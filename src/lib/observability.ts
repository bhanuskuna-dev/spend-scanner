export type OperationLabel =
  | "transaction-categorization"
  | "savings-coach"
  | "eval-judge"
  | "feedback-improvement";

export type ModelLabel = "claude-haiku-4-5" | "claude-sonnet-4-6";

export interface TraceEntry {
  id: string;
  timestamp: string;
  operation: OperationLabel;
  model: ModelLabel;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
  promptVersion: string;
  success: boolean;
  error?: string;
  inputSummary?: string;
  outputSummary?: string;
}

const STORAGE_KEY = "observability-traces";
const MAX_ENTRIES = 100;

// Prices per 1M tokens
const PRICING: Record<ModelLabel, { input: number; output: number }> = {
  "claude-haiku-4-5": { input: 0.8, output: 4.0 },
  "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
};

export function calcCost(model: ModelLabel, inputTokens: number, outputTokens: number): number {
  const p = PRICING[model];
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
}

export function getTraces(): TraceEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TraceEntry[]) : [];
  } catch {
    return [];
  }
}

function notify() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("observability-update"));
  }
}

export function logTrace(trace: Omit<TraceEntry, "id">): TraceEntry {
  const entry: TraceEntry = {
    ...trace,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  const updated = [entry, ...getTraces()].slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notify();
  } catch {
    // storage full or unavailable
  }
  return entry;
}

export function clearTraces(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    notify();
  }
}

export function exportTraces(): void {
  const traces = getTraces();
  const blob = new Blob([JSON.stringify(traces, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `spendscanner-observability-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function getSessionCost(): number {
  return getTraces().reduce((s, t) => s + t.estimatedCostUsd, 0);
}
