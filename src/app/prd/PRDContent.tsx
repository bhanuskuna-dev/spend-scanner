"use client";

import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { ArrowLeft, Wallet2 } from "lucide-react";

export function PRDContent({ content }: { content: string }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <Wallet2 className="w-4 h-4 text-brand-600" />
            <span className="font-bold text-slate-900 tracking-tight">SpendScanner</span>
          </Link>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">PRD</span>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-8 py-10">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-bold text-slate-900 mt-10 mb-4 pb-2 border-b border-slate-100">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-base font-bold text-slate-800 mt-6 mb-2">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="space-y-1.5 mb-4 ml-4">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="space-y-1.5 mb-4 ml-4 list-decimal">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="text-sm text-slate-600 leading-relaxed flex gap-2">
                  <span className="text-slate-300 shrink-0 mt-0.5">•</span>
                  <span>{children}</span>
                </li>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-slate-800">{children}</strong>
              ),
              code: ({ children }) => (
                <code className="font-mono text-xs bg-slate-100 text-brand-700 px-1.5 py-0.5 rounded">{children}</code>
              ),
              pre: ({ children }) => (
                <pre className="bg-slate-50 border border-slate-100 rounded-xl p-4 overflow-x-auto text-xs font-mono text-slate-700 mb-4">{children}</pre>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-brand-200 pl-4 italic text-slate-500 my-4">{children}</blockquote>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-sm border-collapse">{children}</table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-slate-50">{children}</thead>
              ),
              th: ({ children }) => (
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200">{children}</th>
              ),
              td: ({ children }) => (
                <td className="px-4 py-2.5 text-xs text-slate-600 border-b border-slate-100">{children}</td>
              ),
              hr: () => <hr className="border-slate-100 my-8" />,
              a: ({ href, children }) => (
                <a href={href} className="text-brand-600 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </main>
    </div>
  );
}
