const STORAGE_KEY = "spendscanner_traces";
export const TRACE_UPDATED_EVENT = "spendscanner:trace-updated";
const MAX_ENTRIES = 20;

export interface TraceEntry {
  id: string;
  timestamp: string;
  operation: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
  promptVersion: string;
}

// Per user spec: Haiku $0.25/$1.25 per 1M, Sonnet $3/$15 per 1M
const PRICING: Record<string, { in: number; out: number }> = {
  "claude-haiku-4-5": { in: 0.25, out: 1.25 },
  "claude-sonnet-4-6": { in: 3.0, out: 15.0 },
};

function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const p = PRICING[model] ?? PRICING["claude-sonnet-4-6"];
  return (inputTokens / 1_000_000) * p.in + (outputTokens / 1_000_000) * p.out;
}

export function addTrace(
  entry: Omit<TraceEntry, "id" | "timestamp" | "promptVersion" | "estimatedCostUsd">
): void {
  const full: TraceEntry = {
    ...entry,
    id: Math.random().toString(36).slice(2, 9),
    timestamp: new Date().toISOString(),
    promptVersion: "v1.0",
    estimatedCostUsd: estimateCost(entry.model, entry.inputTokens, entry.outputTokens),
  };
  try {
    const updated = [full, ...getTraces()].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(TRACE_UPDATED_EVENT));
  } catch {
    // localStorage unavailable
  }
}

export function getTraces(): TraceEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TraceEntry[]) : [];
  } catch {
    return [];
  }
}

export function clearTraces(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(TRACE_UPDATED_EVENT));
  } catch {
    // localStorage unavailable
  }
}
