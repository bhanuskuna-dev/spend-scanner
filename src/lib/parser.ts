"use client";

import Papa from "papaparse";
import type { RawTransaction } from "./types";

// ── CSV Parsing ───────────────────────────────────────────────────────────────

/** Attempt to detect which columns hold date, description, and amount */
function detectColumns(headers: string[]): {
  dateCol: number;
  descCol: number;
  amountCol: number;
  creditCol?: number;
} {
  const h = headers.map((v) => v.toLowerCase().trim());

  const dateCol = h.findIndex((v) =>
    /date|posted|transaction.?date/.test(v)
  );
  const descCol = h.findIndex((v) =>
    /desc|description|merchant|payee|name|memo|detail/.test(v)
  );
  const amountCol = h.findIndex((v) =>
    /^amount$|^amt$|debit|withdrawal|charge/.test(v)
  );
  const creditCol = h.findIndex((v) =>
    /^credit$|deposit|payment/.test(v)
  );

  return {
    dateCol: dateCol === -1 ? 0 : dateCol,
    descCol: descCol === -1 ? 1 : descCol,
    amountCol: amountCol === -1 ? 2 : amountCol,
    creditCol: creditCol === -1 ? undefined : creditCol,
  };
}

function parseAmount(raw: string): number {
  if (!raw) return 0;
  // Remove currency symbols, commas, parentheses (used for negatives)
  const negative = raw.includes("(") || raw.trim().startsWith("-");
  const cleaned = raw.replace(/[$,()€£¥\s]/g, "").replace(/^-/, "");
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : negative ? -val : val;
}

// ── Balance extraction ────────────────────────────────────────────────────────

const BALANCE_PATTERNS = [
  // With $ sign: allow any text between label and amount (handles "Ending balance on April 10, 2026 $12,639.99")
  /ending\s+balance\b.*?\$([\d,]+\.\d{2})/i,
  /closing\s+balance\b.*?\$([\d,]+\.\d{2})/i,
  /end\s+balance\b.*?\$([\d,]+\.\d{2})/i,
  /statement\s+ending\s+balance\b.*?\$([\d,]+\.\d{2})/i,
  /new\s+balance\b.*?\$([\d,]+\.\d{2})/i,
  /balance\s+forward\b.*?\$([\d,]+\.\d{2})/i,
  // Without $ sign: require the amount immediately after the label
  /ending\s+balance\s*[:\-]?\s*([\d,]+\.\d{2})/i,
  /closing\s+balance\s*[:\-]?\s*([\d,]+\.\d{2})/i,
  /end\s+balance\s*[:\-]?\s*([\d,]+\.\d{2})/i,
];

function extractEndingBalance(lines: string[]): number | undefined {
  // Search from the bottom of the document up — the ending balance is usually
  // near the end of the statement.
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    for (const pat of BALANCE_PATTERNS) {
      const m = pat.exec(line);
      if (m) {
        const val = parseFloat(m[1].replace(/,/g, ""));
        if (!isNaN(val)) return val;
      }
    }
  }
  return undefined;
}

// ── CSV: also check for a running balance column ──────────────────────────────

function detectBalanceColumn(headers: string[]): number | undefined {
  const h = headers.map((v) => v.toLowerCase().trim());
  const idx = h.findIndex((v) => /\bbalance\b/.test(v));
  return idx === -1 ? undefined : idx;
}

export async function parseCSV(file: File): Promise<{
  transactions: RawTransaction[];
  endingBalance?: number;
  errors: string[];
}> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = [];
        const rows = results.data as string[][];
        if (rows.length < 2) {
          resolve({ transactions: [], errors: ["CSV appears to be empty."] });
          return;
        }

        const headers = rows[0];
        const { dateCol, descCol, amountCol, creditCol } =
          detectColumns(headers);
        const balanceCol = detectBalanceColumn(headers);

        const transactions: RawTransaction[] = [];
        let lastBalance: number | undefined;

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length < 3) continue;

          const dateRaw = row[dateCol]?.trim() ?? "";
          const desc = row[descCol]?.trim() ?? "";
          const amountRaw = row[amountCol]?.trim() ?? "";

          if (!dateRaw || !desc) continue;

          let amount = parseAmount(amountRaw);

          // Some banks put credits in a separate column
          if (creditCol !== undefined && row[creditCol]?.trim()) {
            const credit = parseAmount(row[creditCol]);
            if (credit > 0) amount = -credit;
          }

          // Track the running balance column if present
          if (balanceCol !== undefined && row[balanceCol]?.trim()) {
            const bal = parseAmount(row[balanceCol]);
            if (!isNaN(bal) && bal !== 0) lastBalance = bal;
          }

          const date = new Date(dateRaw);
          if (isNaN(date.getTime())) {
            errors.push(`Row ${i + 1}: could not parse date "${dateRaw}"`);
            continue;
          }

          transactions.push({
            date: date.toISOString().split("T")[0],
            description: desc,
            amount,
            type: amount >= 0 ? "debit" : "credit",
          });
        }

        // Sort transactions by date ascending so lastBalance is the final one
        transactions.sort((a, b) => a.date.localeCompare(b.date));
        resolve({ transactions, endingBalance: lastBalance, errors });
      },
      error: (err) => {
        resolve({ transactions: [], errors: [err.message] });
      },
    });
  });
}

// ── PDF Parsing ───────────────────────────────────────────────────────────────

export async function parsePDF(file: File): Promise<{
  transactions: RawTransaction[];
  endingBalance?: number;
  errors: string[];
}> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // Dynamically import pdfjs to avoid SSR issues.
    // Use new URL() so webpack 5 bundles the worker locally — no CDN fetch.
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const allLines: string[] = [];

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();

      // Group text items by their Y coordinate so we reconstruct visual rows.
      // PDF items arrive in arbitrary order; same Y = same line on screen.
      type TextItem = { str: string; transform: number[] };
      const yBuckets = new Map<number, { x: number; str: string }[]>();
      for (const raw of content.items) {
        const item = raw as TextItem;
        if (!item.str?.trim()) continue;
        // Round to nearest 2pt to merge items on the same visual row
        const y = Math.round(item.transform[5] / 2) * 2;
        const x = item.transform[4];
        const bucket = yBuckets.get(y) ?? [];
        bucket.push({ x, str: item.str });
        yBuckets.set(y, bucket);
      }

      // Sort rows top-to-bottom (higher Y = higher on page in PDF coords)
      const sortedRows = [...yBuckets.entries()].sort((a, b) => b[0] - a[0]);
      for (const [, items] of sortedRows) {
        // Sort tokens left-to-right within each row
        items.sort((a, b) => a.x - b.x);
        const line = items.map((i) => i.str).join(" ").trim();
        if (line) allLines.push(line);
      }
    }

    const endingBalance = extractEndingBalance(allLines);
    const result = extractTransactionsFromLines(allLines);
    return { ...result, endingBalance };
  } catch (err) {
    return {
      transactions: [],
      errors: [
        `PDF parsing failed: ${err instanceof Error ? err.message : String(err)}`,
      ],
    };
  }
}

/**
 * Parse reconstructed PDF lines into transactions.
 * Tries multiple date+amount patterns to handle different bank layouts.
 */
function extractTransactionsFromLines(lines: string[]): {
  transactions: RawTransaction[];
  errors: string[];
} {
  const transactions: RawTransaction[] = [];

  // Amount at end of string (handles negative, parentheses, dollar sign)
  const AMT = /\(?\$?\s*-?\d{1,3}(?:,\d{3})*\.\d{2}\)?$/;

  // Date patterns (captured group 1 = the date token)
  const DATE_PATTERNS = [
    // MM/DD/YYYY or M/D/YYYY
    /^(\d{1,2}\/\d{1,2}\/\d{2,4})\s+/,
    // MM-DD-YYYY
    /^(\d{1,2}-\d{1,2}-\d{2,4})\s+/,
    // YYYY-MM-DD (ISO)
    /^(\d{4}-\d{2}-\d{2})\s+/,
    // MM/DD with no year (Chase, BofA style)
    /^(\d{1,2}\/\d{1,2})\s+/,
    // "Jan 15" or "Jan 15 2024"
    /^([A-Za-z]{3,9}\.?\s+\d{1,2}(?:,?\s+\d{4})?)\s+/,
    // "15 Jan 2024"
    /^(\d{1,2}\s+[A-Za-z]{3,9}\.?\s+\d{4})\s+/,
  ];

  // Reference year for MM/DD-only dates: use the most recently seen full year
  let inferredYear = new Date().getFullYear();

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 8) continue;

    // Must end with an amount
    const amtMatch = AMT.exec(trimmed);
    if (!amtMatch) continue;

    const amtStr = amtMatch[0].trim();
    const withoutAmt = trimmed.slice(0, trimmed.length - amtMatch[0].length).trim();

    // Try each date pattern
    let dateStr = "";
    let description = "";
    for (const pat of DATE_PATTERNS) {
      const m = pat.exec(withoutAmt);
      if (m) {
        dateStr = m[1];
        description = withoutAmt.slice(m[0].length).trim();
        break;
      }
    }
    if (!dateStr || !description) continue;

    // Parse the date, injecting inferred year for MM/DD-only formats
    const parsed = flexParseDate(dateStr, inferredYear);
    if (!parsed) continue;

    // Update inferred year whenever we see a full 4-digit year
    if (/\d{4}/.test(dateStr)) {
      inferredYear = parsed.getFullYear();
    }

    const amount = parseAmount(amtStr);
    if (amount === 0 && !amtStr.includes("0.00")) continue; // skip zero-parse failures

    transactions.push({
      date: parsed.toISOString().split("T")[0],
      description,
      amount,
      type: amount >= 0 ? "debit" : "credit",
    });
  }

  if (transactions.length === 0) {
    return {
      transactions: [],
      errors: [
        "Could not extract transactions from this PDF. " +
          "Bank PDFs vary widely — for best results export your statement as CSV from your bank's website.",
      ],
    };
  }

  return { transactions, errors: [] };
}

function flexParseDate(raw: string, fallbackYear: number): Date | null {
  // Try native parse first
  let d = new Date(raw);
  if (!isNaN(d.getTime())) return d;

  // MM/DD with no year
  const mmdd = /^(\d{1,2})\/(\d{1,2})$/.exec(raw);
  if (mmdd) {
    d = new Date(`${fallbackYear}-${mmdd[1].padStart(2, "0")}-${mmdd[2].padStart(2, "0")}`);
    if (!isNaN(d.getTime())) return d;
  }

  // Normalize "Jan 15" → "Jan 15 <year>"
  const monDay = /^([A-Za-z]{3,9}\.?)\s+(\d{1,2})$/.exec(raw);
  if (monDay) {
    d = new Date(`${monDay[1]} ${monDay[2]} ${fallbackYear}`);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

export async function parseFile(file: File): Promise<{
  transactions: RawTransaction[];
  endingBalance?: number;
  errors: string[];
}> {
  if (file.name.toLowerCase().endsWith(".pdf")) {
    return parsePDF(file);
  }
  return parseCSV(file);
}
