"use client";

import { useCallback, useState } from "react";
import { UploadCloud, FileText, AlertCircle, Lock } from "lucide-react";
import clsx from "clsx";

interface FileUploadProps {
  onFilesAccepted: (files: File[]) => void;
  isLoading: boolean;
}

export function FileUpload({ onFilesAccepted, isLoading }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      setError(null);
      const files = Array.from(fileList);
      const valid: File[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop()?.toLowerCase();
        const allowed = ["text/csv", "application/pdf", "text/plain"];
        if (!allowed.includes(file.type) && ext !== "csv" && ext !== "pdf") {
          setError(`"${file.name}" is not a supported format (CSV or PDF only).`);
          return;
        }
        if (file.size > 20 * 1024 * 1024) {
          setError(`"${file.name}" is over 20 MB.`);
          return;
        }
        valid.push(file);
      }
      if (valid.length > 0) onFilesAccepted(valid);
    },
    [onFilesAccepted]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) handleFiles(e.target.files);
      e.target.value = "";
    },
    [handleFiles]
  );

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <label
        className={clsx(
          "relative flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200",
          "min-h-[260px] px-8 py-10",
          isDragging
            ? "border-brand-500 bg-brand-50 scale-[1.01]"
            : "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/40",
          isLoading && "pointer-events-none opacity-60"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        aria-label="Upload bank statements"
      >
        <input
          type="file"
          accept=".csv,.pdf"
          multiple
          className="sr-only"
          onChange={onInputChange}
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-brand-100" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-500 animate-spin" />
            </div>
            <p className="text-sm font-medium text-slate-600">Analyzing your statements…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center pointer-events-none">
            <div className={clsx(
              "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-200",
              isDragging ? "bg-brand-100" : "bg-slate-100"
            )}>
              <UploadCloud className={clsx("w-8 h-8 transition-colors", isDragging ? "text-brand-600" : "text-slate-400")} />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800">Drop your bank statements here</p>
              <p className="text-sm text-slate-500 mt-1">
                or <span className="text-brand-600 font-medium underline underline-offset-2">click to browse</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">You can select multiple statements at once</p>
            </div>
            <div className="flex gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> CSV</span>
              <span className="text-slate-200">|</span>
              <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> PDF</span>
            </div>
          </div>
        )}
      </label>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-success-50 border border-success-200">
        <Lock className="w-4 h-4 text-success-600 mt-0.5 shrink-0" />
        <p className="text-xs text-success-700 leading-relaxed">
          <span className="font-semibold">100% private.</span> Your statements are processed entirely in your browser. No data leaves your device — ever.
        </p>
      </div>

      <p className="text-xs text-center text-slate-400">
        Accepted formats exported from Chase, Bank of America, Wells Fargo, Citi, Capital One and most other banks.
      </p>
    </div>
  );
}
