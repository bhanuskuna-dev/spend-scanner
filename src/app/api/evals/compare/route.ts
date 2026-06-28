import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { EVAL_DATASET } from "@/lib/evalDataset";
import { EVAL_SYSTEM_PROMPT } from "@/lib/evalSystemPrompt";
import type { SpendCategory } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_CATEGORIES: SpendCategory[] = [
  "Income", "Credit Card Payments", "Mortgage & Rent", "Auto & Transportation",
  "Utilities", "Insurance", "Groceries", "Dining & Coffee", "Healthcare",
  "Subscriptions", "Shopping", "Entertainment", "Travel", "Transfers", "Fees", "Other",
];

const PRICING: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5":  { input: 1.00, output: 5.00 },
  "claude-sonnet-4-6": { input: 3.00, output: 15.00 },
};

export interface ModelComparisonEntry {
  model: string;
  accuracy: number;
  correctCount: number;
  totalCount: number;
  estimatedCostUsd: number;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
}

export interface ModelComparisonResult {
  entries: ModelComparisonEntry[];
  markdownTable: string;
  runAt: string;
}

const client = new Anthropic();

async function runModelEval(model: string): Promise<ModelComparisonEntry> {
  const batch = EVAL_DATASET.map((t, i) => ({ id: String(i), description: t.description, amount: t.amount }));

  const userContent = `Categorize these ${batch.length} bank transactions.
Return a JSON array with one object per transaction: [{"id":"...","category":"...","confidence":0.0,"reasoning":"..."},...]

Transactions:
${batch.map(t =>
  `${t.id}: "${t.description}" | $${Math.abs(t.amount).toFixed(2)} (${t.amount < 0 ? "credit" : "debit"})`
).join("\n")}`;

  const startTime = Date.now();
  const message = await client.messages.create({
    model,
    max_tokens: 2048,
    system: [
      {
        type: "text",
        text: EVAL_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userContent }],
  });
  const latencyMs = Date.now() - startTime;

  const { input_tokens, output_tokens } = message.usage;
  const pricing = PRICING[model] ?? { input: 0, output: 0 };
  const estimatedCostUsd =
    (input_tokens / 1_000_000) * pricing.input +
    (output_tokens / 1_000_000) * pricing.output;

  const rawText = message.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error(`Model ${model} did not return a JSON array`);

  const parsed = JSON.parse(jsonMatch[0]) as Array<{
    id: string;
    category: string;
    confidence: number;
    reasoning: string;
  }>;

  let correctCount = 0;
  for (const item of parsed) {
    const idx = Number(item.id);
    const evalTx = EVAL_DATASET[idx];
    if (!evalTx) continue;
    const predicted = VALID_CATEGORIES.includes(item.category as SpendCategory)
      ? (item.category as SpendCategory)
      : "Other";
    if (predicted === evalTx.expectedCategory) correctCount++;
  }

  return {
    model,
    accuracy: parsed.length > 0 ? correctCount / parsed.length : 0,
    correctCount,
    totalCount: parsed.length,
    estimatedCostUsd,
    latencyMs,
    inputTokens: input_tokens,
    outputTokens: output_tokens,
  };
}

function buildMarkdownTable(entries: ModelComparisonEntry[]): string {
  const header = "| Model | Accuracy | Avg Cost per Run | Avg Latency |";
  const sep    = "|-------|----------|-----------------|-------------|";
  const rows = entries.map((e) =>
    `| ${e.model} | ${Math.round(e.accuracy * 100)}% | $${e.estimatedCostUsd.toFixed(4)} | ${(e.latencyMs / 1000).toFixed(1)}s |`
  );
  return [header, sep, ...rows].join("\n");
}

export async function POST() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Server is missing ANTHROPIC_API_KEY." },
      { status: 500 }
    );
  }

  try {
    const haiku = await runModelEval("claude-haiku-4-5");
    const sonnet = await runModelEval("claude-sonnet-4-6");

    const entries: ModelComparisonEntry[] = [haiku, sonnet];
    const markdownTable = buildMarkdownTable(entries);

    const result: ModelComparisonResult = {
      entries,
      markdownTable,
      runAt: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/evals/compare]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Comparison run failed." },
      { status: 500 }
    );
  }
}
