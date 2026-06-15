"use client";

import { useState, useEffect } from "react";
import { Sparkles, X, BookOpen } from "lucide-react";

const STORAGE_KEY = "spend-scanner-welcome-seen-v3";

interface WelcomeModalProps {
  onLoadSample: () => void;
}

export function WelcomeModal({ onLoadSample }: WelcomeModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  const loadSample = () => {
    onLoadSample();
    dismiss();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-brand-500 to-brand-700 px-6 pt-8 pb-6 text-white">
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold leading-tight">
            A PM who decided to actually build something
          </h2>
          <p className="text-white/80 mt-1 text-sm">
            This is what I learned along the way.
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-slate-600 text-sm leading-relaxed">
            I spend my days writing specs and telling engineers what to build — but I&apos;d
            never shipped anything myself. I built this to understand what it actually feels
            like to go from idea to something real, using Claude Code as my engineering partner.
          </p>

          {/* Key decisions */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">A few decisions I&apos;m proud of</p>
            <ul className="space-y-2.5">
              <li className="flex gap-3 text-sm text-slate-600">
                <span className="text-brand-500 font-bold shrink-0 mt-0.5">→</span>
                <span><span className="font-semibold text-slate-800">Two-pass categorization.</span> A rules engine handles ~70% of transactions instantly (zero AI cost). Claude Haiku covers the rest — chosen because categorization is a classification problem, not a reasoning problem.</span>
              </li>
              <li className="flex gap-3 text-sm text-slate-600">
                <span className="text-brand-500 font-bold shrink-0 mt-0.5">→</span>
                <span><span className="font-semibold text-slate-800">Different models for different jobs.</span> Haiku for bulk categorization; Sonnet for the savings planning agent. The agent needs multi-step reasoning — Haiku would drop accuracy on that task.</span>
              </li>
              <li className="flex gap-3 text-sm text-slate-600">
                <span className="text-brand-500 font-bold shrink-0 mt-0.5">→</span>
                <span><span className="font-semibold text-slate-800">0.85 confidence threshold.</span> Calibration testing showed Haiku&apos;s self-reported confidence correlates with actual accuracy above this line. Below it, a human review step outperforms auto-apply.</span>
              </li>
              <li className="flex gap-3 text-sm text-slate-600">
                <span className="text-brand-500 font-bold shrink-0 mt-0.5">→</span>
                <span><span className="font-semibold text-slate-800">Raw data never leaves the browser.</span> The agent&apos;s tools run client-side. Only aggregates (totals, averages) travel to the API — never your transaction descriptions.</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-500 flex items-center justify-between gap-3">
            <span>
              <span className="font-semibold text-slate-700">Full spec in the PRD.</span>{" "}
              All the decisions, failure modes, and eval strategy are documented.
            </span>
            <a
              href="/prd"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-brand-600 font-semibold hover:underline shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Read it
            </a>
          </div>
        </div>

        {/* CTAs */}
        <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={loadSample}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Try with sample data
          </button>
          <button
            onClick={dismiss}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors"
          >
            Upload my own statement
          </button>
        </div>
      </div>
    </div>
  );
}
