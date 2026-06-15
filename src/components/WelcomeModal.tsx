"use client";

import { useState, useEffect } from "react";
import { Sparkles, X } from "lucide-react";

const STORAGE_KEY = "spend-scanner-welcome-seen-v2";

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
            never shipped anything myself. I wanted to know what it actually feels like to
            go from an idea to something real that works.
          </p>
          <p className="text-slate-600 text-sm leading-relaxed">
            I picked a problem I had: I never really knew where my money was going each month.
            I could see my balance, but not the full picture — how much was rent vs. groceries
            vs. all those small charges that quietly add up.
          </p>
          <p className="text-slate-600 text-sm leading-relaxed">
            So I built this. No engineering team, no prior coding experience — just me and
            an AI helping me figure it out one step at a time.
          </p>
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Your data stays private.</span>{" "}
            Nothing you upload is stored or shared anywhere. It&apos;s just you and the app.
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
