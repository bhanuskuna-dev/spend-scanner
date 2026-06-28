import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { EVAL_DATASET } from "@/lib/evalDataset";
import { EVAL_EVAL_SYSTEM_PROMPT } from "@/lib/evalSystemPrompt";
import type { SpendCategory } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_CATEGORIES: SpendCategory[] = [
  "Income", "Credit Card Payments", "Mortgage & Rent", "Auto & Transportation",
  "Utilities", "Insurance", "Groceries", "Dining & Coffee", "Healthcare",
  "Subscriptions", "Shopping", "Entertainment", "Travel", "Transfers", "Fees", "Other",
];

const client = new Anthropic();

export interface EvalResult {
  id: number;
  description: string;
  amount: number;
  expectedCategory: SpendCategory;
  predictedCategory: SpendCategory;
  confidence: number;
  reasoning: string;
  correct: boolean;
  notes: string;
}

export interface CalibrationBucket {
  label: string;
  minConf: number;
  maxConf: number;
  count: number;
  correctCount: number;
  accuracy: number;
  avgConfidence: number;
}

export interface EvalRunResult {
  results: EvalResult[];
  totalCount: number;
  correctCount: number;
  accuracy: number;
  avgConfidence: number;
  precisionByCategory: Record<string, number>;
  recallByCategory: Record<string, number>;
  calibrationBuckets: CalibrationBucket[];
  latencyMs: number;
  estimatedCostUsd: number;
  inputTokens: number;
  outputTokens: number;
  runAt: string;
}

export async function POST() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Server is missing ANTHROPIC_API_KEY." },
      { status: 500 }
    );
  }

  // Build the same user content format as /api/categorize
  const batch = EVAL_DATASET.map((t, i) => ({
    id: String(i),
    description: t.description,
    amount: t.amount,
  }));

  const userContent = `Categorize these ${batch.length} bank transactions.
Return a JSON array with one object per transaction: [{"id":"...","category":"...","confidence":0.0,"reasoning":"..."},...]

Transactions:
${batch.map(t =>
  `${t.id}: "${t.description}" | $${Math.abs(t.amount).toFixed(2)} (${t.amount < 0 ? "credit" : "debit"})`
).join("\n")}`;

  try {
    const startTime = Date.now();
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
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

    // Haiku 4.5 pricing: $1.00/MTok input, $5.00/MTok output
    const estimatedCostUsd =
      (input_tokens / 1_000_000) * 1.00 +
      (output_tokens / 1_000_000) * 5.0;

    const rawText = message.content
      .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Model did not return a JSON array");

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      id: string;
      category: string;
      confidence: number;
      reasoning: string;
    }>;

    // Build eval results
    const results: EvalResult[] = parsed.map((item) => {
      const idx = Number(item.id);
      const evalTx = EVAL_DATASET[idx];
      const predicted = VALID_CATEGORIES.includes(item.category as SpendCategory)
        ? (item.category as SpendCategory)
        : "Other";
      return {
        id: idx,
        description: evalTx.description,
        amount: evalTx.amount,
        expectedCategory: evalTx.expectedCategory,
        predictedCategory: predicted,
        confidence: Math.min(1, Math.max(0, Number(item.confidence) || 0)),
        reasoning: String(item.reasoning ?? "").slice(0, 80),
        correct: predicted === evalTx.expectedCategory,
        notes: evalTx.notes,
      };
    });

    const correctCount = results.filter((r) => r.correct).length;
    const totalCount = results.length;
    const accuracy = totalCount > 0 ? correctCount / totalCount : 0;
    const avgConfidence = results.reduce((s, r) => s + r.confidence, 0) / Math.max(totalCount, 1);

    // Per-category precision & recall
    const categories = [...new Set(results.map((r) => r.expectedCategory))];
    const precisionByCategory: Record<string, number> = {};
    const recallByCategory: Record<string, number> = {};

    for (const cat of categories) {
      const tp = results.filter((r) => r.predictedCategory === cat && r.expectedCategory === cat).length;
      const fp = results.filter((r) => r.predictedCategory === cat && r.expectedCategory !== cat).length;
      const fn = results.filter((r) => r.predictedCategory !== cat && r.expectedCategory === cat).length;
      precisionByCategory[cat] = tp + fp > 0 ? tp / (tp + fp) : 1;
      recallByCategory[cat] = tp + fn > 0 ? tp / (tp + fn) : 1;
    }

    // Confidence calibration buckets
    const BUCKETS = [
      { label: "Low (0–0.59)", minConf: 0, maxConf: 0.6 },
      { label: "Med-Low (0.60–0.74)", minConf: 0.6, maxConf: 0.75 },
      { label: "Medium (0.75–0.84)", minConf: 0.75, maxConf: 0.85 },
      { label: "High (0.85–1.0)", minConf: 0.85, maxConf: 1.01 },
    ];

    const calibrationBuckets: CalibrationBucket[] = BUCKETS.map((b) => {
      const inBucket = results.filter(
        (r) => r.confidence >= b.minConf && r.confidence < b.maxConf
      );
      const correctInBucket = inBucket.filter((r) => r.correct).length;
      return {
        ...b,
        count: inBucket.length,
        correctCount: correctInBucket,
        accuracy: inBucket.length > 0 ? correctInBucket / inBucket.length : 0,
        avgConfidence:
          inBucket.length > 0
            ? inBucket.reduce((s, r) => s + r.confidence, 0) / inBucket.length
            : 0,
      };
    });

    const evalResult: EvalRunResult = {
      results,
      totalCount,
      correctCount,
      accuracy,
      avgConfidence,
      precisionByCategory,
      recallByCategory,
      calibrationBuckets,
      latencyMs,
      estimatedCostUsd,
      inputTokens: input_tokens,
      outputTokens: output_tokens,
      runAt: new Date().toISOString(),
    };

    return NextResponse.json(evalResult);
  } catch (err) {
    console.error("[/api/evals]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Eval run failed." },
      { status: 500 }
    );
  }
}
