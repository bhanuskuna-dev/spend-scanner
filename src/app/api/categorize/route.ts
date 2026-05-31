import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { SpendCategory } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_CATEGORIES: SpendCategory[] = [
  "Income", "Credit Card Payments", "Mortgage & Rent", "Auto & Transportation",
  "Utilities", "Insurance", "Groceries", "Dining & Coffee", "Healthcare",
  "Subscriptions", "Shopping", "Entertainment", "Travel", "Transfers", "Fees", "Other",
];

export interface AICategorizationRequest {
  transactions: Array<{ id: string; description: string; amount: number }>;
}

export interface AICategorizationItem {
  id: string;
  category: SpendCategory;
  confidence: number;
  reasoning: string;
}

export interface AICategorizationResponse {
  results: AICategorizationItem[];
  error?: string;
  usage?: { input_tokens: number; output_tokens: number };
}

// Stable system prompt — cached on every request after the first
const SYSTEM_PROMPT = `You are a bank transaction categorizer. Given a list of transactions, assign each to exactly one category with a confidence score.

Valid categories:
- Income: Payroll, salary, wages, direct deposits, interest earned, dividends (credits/negative amounts)
- Credit Card Payments: Payments to credit card companies (Amex, Chase, Citi, Discover, etc.)
- Mortgage & Rent: Home loan payments, rent, landlord, property management
- Auto & Transportation: Gas stations, car loans/leases, Uber, Lyft, tolls, parking, auto repair
- Utilities: Internet, phone (Verizon, AT&T, Comcast), electric, water, gas utility bills
- Insurance: Health, auto, home, life, renters insurance premiums
- Groceries: Supermarkets, grocery stores, wholesale clubs (Costco, Sam's) for food purchases
- Dining & Coffee: Restaurants, fast food, cafes, food delivery (DoorDash, Uber Eats, Grubhub)
- Healthcare: Pharmacies (CVS, Walgreens), doctors, dentists, hospitals, medical services
- Subscriptions: Streaming (Netflix, Spotify, Hulu), software (Adobe, GitHub), recurring digital services
- Shopping: Retail (Amazon, Target, Walmart), clothing, electronics, online purchases
- Entertainment: Cinemas, concerts, sporting events, ticketing platforms
- Travel: Airlines, hotels, Airbnb, booking platforms, vacation-related purchases
- Transfers: Zelle, Venmo, CashApp, PayPal, internal bank transfers, savings transfers
- Fees: ATM fees, overdraft fees, service charges, bank maintenance fees
- Other: Cannot be reliably classified into any of the above categories

Rules:
- Negative amounts = credits/money coming IN (usually Income or refunds)
- Positive amounts = debits/money going OUT (expenses)
- confidence is 0.0–1.0 (1.0 = completely certain, 0.0 = pure guess)
- reasoning must be ≤8 words explaining your choice
- Respond with ONLY a valid JSON array, no other text`;

// Module-level singleton so the prompt cache is shared across requests
const client = new Anthropic();

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { results: [], error: "Server is missing ANTHROPIC_API_KEY environment variable." } as AICategorizationResponse,
      { status: 500 }
    );
  }

  let body: AICategorizationRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { results: [], error: "Invalid JSON request body." } as AICategorizationResponse,
      { status: 400 }
    );
  }

  const { transactions } = body;
  if (!transactions?.length) {
    return NextResponse.json({ results: [] } as AICategorizationResponse);
  }

  // Cap at 100 transactions per request to avoid token overflows
  const batch = transactions.slice(0, 100);

  const userContent = `Categorize these ${batch.length} bank transactions.
Return a JSON array with one object per transaction: [{"id":"...","category":"...","confidence":0.0,"reasoning":"..."},...]

Transactions:
${batch.map(t =>
  `${t.id}: "${t.description}" | $${Math.abs(t.amount).toFixed(2)} (${t.amount < 0 ? "credit" : "debit"})`
).join("\n")}`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          // Cache the stable system prompt — avoids re-processing on every request.
          // Haiku 4.5 requires ≥2048 tokens for cache activation; this prompt is
          // borderline, so cache hits are best-effort.
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userContent }],
    });

    const rawText = message.content
      .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    // Extract the JSON array from the model's response
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("[/api/categorize] No JSON array in response:", rawText.slice(0, 500));
      throw new Error("Model did not return a JSON array");
    }

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      id: string;
      category: string;
      confidence: number;
      reasoning: string;
    }>;

    const results: AICategorizationItem[] = parsed.map((item) => ({
      id: String(item.id),
      category: VALID_CATEGORIES.includes(item.category as SpendCategory)
        ? (item.category as SpendCategory)
        : "Other",
      confidence: Math.min(1, Math.max(0, Number(item.confidence) || 0)),
      reasoning: String(item.reasoning ?? "").slice(0, 80),
    }));

    return NextResponse.json({
      results,
      usage: { input_tokens: message.usage.input_tokens, output_tokens: message.usage.output_tokens },
    } as AICategorizationResponse);
  } catch (err) {
    console.error("[/api/categorize]", err);
    return NextResponse.json(
      {
        results: [],
        error: err instanceof Error ? err.message : "AI categorization failed.",
      } as AICategorizationResponse,
      { status: 500 }
    );
  }
}
