"use client";

import { useState, useEffect } from "react";
import { Sparkles, X } from "lucide-react";

const STORAGE_KEY = "spend-scanner-welcome-seen";

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
            I&apos;m a PM learning to build
          </h2>
          <p className="text-white/80 mt-1 text-sm">
            SpendScanner is my first app — built with Claude as my coding partner.
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-slate-600 text-sm leading-relaxed">
            I wanted to understand how money actually moves through my household — not
            just a balance, but a full breakdown: mortgage, groceries, subscriptions,
            everything. So I built it myself.
          </p>
          <p className="text-slate-600 text-sm leading-relaxed">
            Upload a bank statement (CSV) and see every dollar categorized in seconds.
            Your data never leaves your browser. Or skip the upload and explore with the
            sample data below.
          </p>

          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">100% private.</span> All
            processing runs in your browser. No accounts, no tracking, no server uploads.
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
