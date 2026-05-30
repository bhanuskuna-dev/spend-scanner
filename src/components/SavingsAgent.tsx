"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Send, TrendingUp, ChevronRight } from "lucide-react";
import type Anthropic from "@anthropic-ai/sdk";
import type { CategorySummary, RawTransaction, AnalysisTotals } from "@/lib/types";
import { dispatchTool } from "@/lib/chatTools";
import type { SpendData } from "@/lib/chatTools";
import type { ChatResponse } from "@/app/api/chat/route";
import { addTrace } from "@/lib/traceLog";

interface SavingsAgentProps {
  summaries: CategorySummary[];
  transactions: RawTransaction[];
  totals: AnalysisTotals;
}

interface DisplayMessage {
  role: "user" | "assistant" | "tool-thinking";
  content: string;
}

const SUGGESTED_FOLLOWUPS = [
  "Build me a full savings plan",
  "Show me a 12-month snowball projection",
  "Which subscriptions should I cancel?",
  "What if I also cut grocery spending?",
  "Give me a stricter savings plan",
];

export function SavingsAgent({ summaries, transactions, totals }: SavingsAgentProps) {
  const spendData: SpendData = { summaries, transactions, totals };

  // Anthropic-format message history — sent to /api/chat on each turn
  const [history, setHistory] = useState<Anthropic.Messages.MessageParam[]>([]);

  // Display messages for the chat UI
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([]);

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages]);

  // ─── Agent loop ─────────────────────────────────────────────────────────────
  const runAgentLoop = useCallback(
    async (messages: Anthropic.Messages.MessageParam[]) => {
      setIsLoading(true);

      let currentMessages = messages;

      // Loop until Claude stops calling tools
      while (true) { // eslint-disable-line no-constant-condition
        let data: ChatResponse;
        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: currentMessages }),
          });
          data = await res.json();
          if (!res.ok) throw new Error((data as { error?: string }).error ?? "Chat failed");

          if (data.usage) {
            addTrace({
              operation: "savings-agent",
              model: "claude-sonnet-4-6",
              inputTokens: data.usage.input_tokens,
              outputTokens: data.usage.output_tokens,
              latencyMs: data.latencyMs ?? 0,
            });
          }
        } catch {
          setDisplayMessages((prev) => [
            ...prev.filter((m) => m.role !== "tool-thinking"),
            {
              role: "assistant",
              content: "Sorry, I ran into an error. Please try again.",
            },
          ]);
          setIsLoading(false);
          return;
        }

        if (data.stopReason === "tool_use") {
          // Show "thinking" indicator
          setDisplayMessages((prev) => {
            const withoutOldThinking = prev.filter((m) => m.role !== "tool-thinking");
            return [
              ...withoutOldThinking,
              { role: "tool-thinking", content: "📊 Analyzing your spending data…" },
            ];
          });

          // Execute tool calls client-side (financial data stays in browser)
          const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
          for (const block of data.content) {
            if (block.type === "tool_use") {
              const result = dispatchTool(block.name, block.input as Record<string, unknown>, spendData);
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: JSON.stringify(result),
              });
            }
          }

          // Append assistant turn + tool results to history and loop
          currentMessages = [
            ...currentMessages,
            { role: "assistant", content: data.content },
            { role: "user", content: toolResults },
          ];
        } else {
          // Final response — extract text and update UI
          const text = data.content
            .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
            .map((b) => b.text)
            .join("");

          setDisplayMessages((prev) => [
            ...prev.filter((m) => m.role !== "tool-thinking"),
            { role: "assistant", content: text },
          ]);

          // Persist full history for next turn
          setHistory([
            ...currentMessages,
            { role: "assistant", content: data.content },
          ]);

          setIsLoading(false);
          setShowSuggestions(true);
          break;
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [summaries, transactions, totals]
  );

  // ─── Auto-open with spending analysis when component mounts ─────────────────
  useEffect(() => {
    if (hasOpened) return;
    setHasOpened(true);

    const openingMessages: Anthropic.Messages.MessageParam[] = [
      {
        role: "user",
        content:
          "Please analyze my spending and give me a brief, personalized overview of where my biggest savings opportunities are. Be specific with dollar amounts. End by asking what my main financial goal is.",
      },
    ];

    setHistory(openingMessages);
    runAgentLoop(openingMessages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Send user message ───────────────────────────────────────────────────────
  const handleSend = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setInputValue("");
      setShowSuggestions(false);

      // Add user message to display
      setDisplayMessages((prev) => [...prev, { role: "user", content: trimmed }]);

      // Append to Anthropic history and run
      const newMessages: Anthropic.Messages.MessageParam[] = [
        ...history,
        { role: "user", content: trimmed },
      ];
      setHistory(newMessages);
      runAgentLoop(newMessages);
    },
    [history, isLoading, runAgentLoop]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputValue);
    }
  };

  function boldify(text: string) {
    return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  }

  // Wrap table rows in a <table> if consecutive
  function renderFormattedContent(text: string) {
    const lines = text.split("\n");
    const result: React.ReactNode[] = [];
    let tableBuffer: string[] = [];

    const flushTable = () => {
      if (tableBuffer.length === 0) return;
      result.push(
        <table key={`table-${result.length}`} className="w-full my-2 border-collapse">
          <tbody>
            {tableBuffer.map((row, i) => {
              const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
              const isSeparator = cells.every((c) => /^-+$/.test(c));
              if (isSeparator) return null;
              return (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  {cells.map((cell, j) => (
                    <td
                      key={j}
                      className="py-1 pr-4 text-sm text-slate-700"
                      dangerouslySetInnerHTML={{ __html: boldify(cell) }}
                    />
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      );
      tableBuffer = [];
    };

    let listBuffer: string[] = [];
    const flushList = () => {
      if (listBuffer.length === 0) return;
      result.push(
        <ul key={`list-${result.length}`} className="space-y-1 my-1 list-none">
          {listBuffer.map((item, i) => (
            <li
              key={i}
              className="text-sm text-slate-700 flex gap-2"
              dangerouslySetInnerHTML={{ __html: "• " + boldify(item.replace(/^[-•]\s*/, "")) }}
            />
          ))}
        </ul>
      );
      listBuffer = [];
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        flushList();
        tableBuffer.push(line);
      } else if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
        flushTable();
        listBuffer.push(line);
      } else {
        flushTable();
        flushList();
        if (!line.trim()) {
          result.push(<div key={`gap-${i}`} className="h-1" />);
        } else if (line.startsWith("## ")) {
          result.push(<p key={i} className="font-bold text-slate-900 mt-2 text-sm">{line.replace(/^##\s*/, "")}</p>);
        } else if (line.startsWith("# ")) {
          result.push(<p key={i} className="font-extrabold text-slate-900 mt-2">{line.replace(/^#\s*/, "")}</p>);
        } else {
          result.push(
            <p key={i} className="text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: boldify(line) }} />
          );
        }
      }
    }

    flushTable();
    flushList();
    return result;
  }

  return (
    <div className="rounded-2xl border border-brand-100 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-brand-50 to-white">
        <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="font-bold text-slate-900 text-sm">SpendScanner AI</p>
          <p className="text-xs text-slate-400">Savings coach · Snowball planner</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-400">Live</span>
        </div>
      </div>

      {/* Message list */}
      <div className="px-5 py-4 space-y-4 max-h-[480px] overflow-y-auto">
        {displayMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 space-y-2 text-center">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-brand-500" />
            </div>
            <p className="text-sm text-slate-500 font-medium">Analyzing your spending…</p>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-brand-300 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {displayMessages.map((msg, i) => {
          if (msg.role === "tool-thinking") {
            return (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 w-fit">
                <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-pulse shrink-0" />
                <span className="text-xs text-slate-500 font-medium">{msg.content}</span>
              </div>
            );
          }

          if (msg.role === "user") {
            return (
              <div key={i} className="flex justify-end">
                <div className="max-w-[75%] bg-brand-500 text-white rounded-2xl rounded-tr-sm px-4 py-2.5">
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            );
          }

          // Assistant message
          return (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-xl bg-brand-100 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              </div>
              <div className="flex-1 bg-slate-50 rounded-2xl rounded-tl-sm px-4 py-3 space-y-0.5">
                {renderFormattedContent(msg.content)}
              </div>
            </div>
          );
        })}

        {/* Loading dots when waiting for first word */}
        {isLoading && displayMessages.every((m) => m.role !== "tool-thinking") && (
          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-brand-600 animate-pulse" />
            </div>
            <div className="bg-slate-50 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested follow-ups */}
      {showSuggestions && !isLoading && (
        <div className="px-5 pb-3 flex flex-wrap gap-2">
          {SUGGESTED_FOLLOWUPS.slice(0, 3).map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSend(suggestion)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-brand-200 bg-brand-50 text-brand-700 text-xs font-medium hover:bg-brand-100 transition-colors"
            >
              {suggestion}
              <ChevronRight className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="px-4 py-3 border-t border-slate-100 flex gap-2 items-center">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your spending or savings plan…"
          disabled={isLoading}
          className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent placeholder-slate-400 disabled:opacity-50 transition"
        />
        <button
          onClick={() => handleSend(inputValue)}
          disabled={isLoading || !inputValue.trim()}
          className="w-10 h-10 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
          aria-label="Send"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
