import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLAID_MCP_URL = "https://api.dashboard.plaid.com/mcp";

type ContentBlock = { type: string; text?: string };
type MCPResponse = { content: ContentBlock[] };

export async function POST(request: Request) {
  const apiKey     = process.env.ANTHROPIC_API_KEY;
  const plaidToken = process.env.PLAID_BEARER_TOKEN;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing ANTHROPIC_API_KEY environment variable." },
      { status: 500 }
    );
  }
  if (!plaidToken) {
    return NextResponse.json(
      { error: "Server is missing PLAID_BEARER_TOKEN environment variable." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const days = Math.max(1, Math.min(365, Number(body.days) || 90));

  const today = new Date();
  const start = new Date(today.getTime() - days * 86_400_000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const client = new Anthropic({ apiKey });

  const prompt = `Use the plaid-dashboard MCP server's list_transactions tool to fetch ALL transactions between ${fmt(start)} and ${fmt(today)}.

Return ONLY a single JSON array — no markdown, no commentary, no code fences. Each entry must be:
{
  "date": "YYYY-MM-DD",
  "description": "<merchant or transaction name>",
  "amount": <number>
}

Sign convention:
- Positive amount = money OUT (debit, charge, withdrawal)
- Negative amount = money IN (credit, deposit, refund)

If Plaid returns a different sign convention (their default is positive=debit, negative=credit, which matches), preserve as-is.

Do not summarize. Do not skip transactions. Output the full array.`;

  try {
    // mcp_servers is a beta field not yet in the SDK's TypeScript types.
    // We cast the params to bypass strict checking, then cast the response
    // to our own shape so we never reference SDK beta namespace types.
    const create = client.beta.messages.create.bind(client.beta.messages);
    const response = await (create as (
      params: Record<string, unknown>,
      options: { headers: Record<string, string> }
    ) => Promise<MCPResponse>)(
      {
        model: "claude-opus-4-7",
        max_tokens: 32_000,
        messages: [{ role: "user", content: prompt }],
        mcp_servers: [
          {
            type: "url",
            url: PLAID_MCP_URL,
            name: "plaid-dashboard",
            authorization_token: plaidToken,
          },
        ],
      },
      {
        headers: { "anthropic-beta": "mcp-client-2025-11-20" },
      }
    );

    const text = response.content
      .filter((b) => b.type === "text" && typeof b.text === "string")
      .map((b) => b.text as string)
      .join("");

    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      return NextResponse.json(
        {
          error: "Plaid returned data but no JSON array could be parsed.",
          raw: text.slice(0, 1000),
        },
        { status: 502 }
      );
    }

    let transactions: Array<{ date: string; description: string; amount: number }>;
    try {
      transactions = JSON.parse(match[0]);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse JSON returned by Plaid MCP server." },
        { status: 502 }
      );
    }

    const cleaned = transactions
      .filter((t) => t.date && t.description && typeof t.amount === "number")
      .map((t) => ({
        date: t.date,
        description: String(t.description).trim(),
        amount: t.amount,
        type: (t.amount >= 0 ? "debit" : "credit") as "debit" | "credit",
      }));

    return NextResponse.json({
      transactions: cleaned,
      count: cleaned.length,
      dateRange: { start: fmt(start), end: fmt(today) },
      errors: [],
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Plaid MCP request failed: ${err.message}`
            : "Plaid MCP request failed.",
      },
      { status: 500 }
    );
  }
}
