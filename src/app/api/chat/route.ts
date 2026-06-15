import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { TOOL_DEFINITIONS } from "@/lib/chatTools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const client = new Anthropic();

// Cached system prompt — describes the agent's role and behaviour.
// Prompt caching reduces latency and cost on every follow-up turn.
const SYSTEM_PROMPT = `You are a personal finance coach powered by SpendScanner. You have access to the user's real spending data through your tools.

Your job is to:
1. Analyze their spending patterns honestly and specifically (always cite dollar amounts)
2. Identify the highest-impact cost-cutting opportunities
3. Build personalized savings plans using the snowball method
4. Be warm, encouraging, and actionable — not generic

The snowball method for savings:
- Start with the easiest/biggest wins first
- Show how small monthly savings compound over time
- Give specific month 1, 3, 6, 12 milestones to make it feel achievable
- Celebrate progress: "By month 3, you'd have enough for an emergency starter fund"

Important rules:
- Always use the tools to pull real data — never estimate or guess dollar amounts
- When suggesting cuts, give specific amounts (e.g., "Cut dining from $340 → $150/mo")
- Format savings plans as clear tables with | columns | when helpful
- Keep responses concise: 3–5 bullet points or a short table, then offer to go deeper
- Don't lecture. Be like a knowledgeable friend, not a financial advisor disclaimer machine.

When the user first arrives, you'll receive a trigger message. Use get_spending_by_category and find_top_savings_opportunities to open with a specific, personalized 2–3 sentence analysis and one clear question about their goals.`;

export interface ChatRequest {
  messages: Anthropic.Messages.MessageParam[];
}

export interface ChatResponse {
  stopReason: string;
  content: Anthropic.Messages.ContentBlock[];
  usage?: { input_tokens: number; output_tokens: number };
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Server is missing ANTHROPIC_API_KEY environment variable." },
      { status: 500 }
    );
  }

  let body: ChatRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const { messages } = body;
  if (!messages?.length) {
    return NextResponse.json({ error: "No messages provided." }, { status: 400 });
  }

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" }, // cached after first request — cheaper follow-ups
        },
      ],
      tools: TOOL_DEFINITIONS,
      tool_choice: { type: "auto" },
      messages,
    });

    const response: ChatResponse = {
      stopReason: message.stop_reason ?? "end_turn",
      content: message.content,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
      },
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/chat]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chat request failed." },
      { status: 500 }
    );
  }
}
