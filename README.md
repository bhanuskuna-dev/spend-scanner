# SpendScanner

**See exactly where your money goes — built by a PM, not a developer.**

SpendScanner parses your bank statement and breaks down every dollar of cash in vs. cash out by category: mortgage, credit cards, auto, groceries, subscriptions, travel, and more. Upload one statement or twelve — it merges them, deduplicates overlapping periods, and gives you a clean month-over-month view.

Everything runs in your browser. No server. No data leaves your device.

---

## Try it

[Live demo →](#) <!-- replace with deployed URL -->

Or clone and run locally:

```bash
npm install
npm run dev
```

---

## What it does

- **PDF and CSV parsing** — drop in a statement from Bank of America, Chase, Wells Fargo, Citi, Capital One, or most other banks
- **Multi-statement support** — upload multiple months at once; transactions are merged and deduplicated automatically
- **16 spending categories** — mortgage, rent, credit card payments, auto, utilities, insurance, groceries, dining, healthcare, subscriptions, shopping, entertainment, travel, transfers, fees, and income
- **Ending balance extraction** — pulls your statement closing balance directly from the PDF so you always know what's left
- **Month-over-month breakdown** — cash in, cash out, net, and ending balance per month in a single table
- **Transaction drill-down** — click any category to see every transaction, grouped by month
- **100% private** — all processing is client-side; your financial data never touches a server

---

## The build story

I'm a product manager. I've spent years writing PRDs, running prioritization frameworks, managing stakeholder tradeoffs, and tracking metrics. What I couldn't show in a deck was whether I could actually build something.

I built this in a single session using Claude as a collaborator to find out.

**The pivot.** It started as a subscription scanner — detect recurring charges, surface cancel buttons. Halfway through I changed direction. Subscription detection is a narrow problem. Seeing your total spend vs. total income, broken down by category, is the thing people actually need. I made that call the same way I make product calls at work: cut the clever feature, solve the real problem.

**The technical friction was real.** PDF parsing is genuinely hard. Text items arrive out of order. Dates appear in six different formats across banks. Ending balances sit in summary tables where the label ("Ending balance on April 10, 2026") and the amount ("$12,639.99") are columns apart — which means a naive regex fails because the date's digits interrupt the character class match. These aren't PM-level abstractions. I had to understand what was actually happening to fix them.

**The pace was different.** Features that would have taken a sprint to spec, design, and build happened in minutes. Multi-file upload with deduplication, a slide-over transaction drawer, month-by-month balance reconstruction — none of these were in the original plan. They came from using the product and deciding it needed them.

The constraint that PMs can't build is gone. The question now is whether you're using that.

---

## How the hard parts work

### PDF text reconstruction

PDFs don't store text as lines — they store individual text items at arbitrary (x, y) coordinates. A naive extraction produces garbage. This parser groups items by Y coordinate (rounded to 2pt to handle sub-pixel offsets), sorts within each row by X, then joins them into readable lines:

```typescript
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

// Sort rows top-to-bottom, tokens left-to-right
const sortedRows = [...yBuckets.entries()].sort((a, b) => b[0] - a[0]);
for (const [, items] of sortedRows) {
  items.sort((a, b) => a.x - b.x);
  const line = items.map((i) => i.str).join(" ").trim();
  if (line) allLines.push(line);
}
```

### Ending balance extraction

Bank of America statements write the ending balance as `"Ending balance on April 10, 2026 $12,639.99"` — a date sits between the label and the amount. The first regex attempt used `[^$\d]*` to skip the middle, but that stops at the digits in "April 10". The fix uses non-greedy `.*?` with a required literal `$`:

```typescript
const BALANCE_PATTERNS = [
  // Handles "Ending balance on April 10, 2026 $12,639.99"
  /ending\s+balance\b.*?\$([\d,]+\.\d{2})/i,
  /closing\s+balance\b.*?\$([\d,]+\.\d{2})/i,
  // Fallback for statements without a $ symbol
  /ending\s+balance\s*[:\-]?\s*([\d,]+\.\d{2})/i,
];
```

### Transaction categorization

Each transaction description is matched against ordered regex rules — more specific patterns first so "Chase Credit Card Autopay" hits `Credit Card Payments` before it could accidentally match `Transfers`:

```typescript
export const CATEGORY_RULES: CategoryRule[] = [
  {
    category: "Credit Card Payments",
    keywords: [
      /\b(credit\s+card\s+payment|cc\s+payment)\b/i,
      /\bautopay.*(?:chase|amex|american\s+express|discover|capital\s+one|citi)\b/i,
      /\b(amex\s+epayment|chase\s+credit|citi\s+card)\b/i,
    ],
  },
  {
    category: "Auto & Transportation",
    keywords: [
      /\b(chevron|shell|exxon|mobil|bp|sunoco|valero)\b/i,
      /\b(ford\s+credit|toyota\s+fin|gm\s+financial|tesla\s+motors)\b/i,
      /\b(uber|lyft|toll|parking|metro|mta\b|bart|amtrak)\b/i,
    ],
  },
  // ... 14 more categories
];

// Cash direction overrides keywords — a negative amount is always Income
// regardless of what the description says
category: t.amount < 0 ? "Income" : categorizeDescription(t.description)
```

### Multi-statement deduplication

When statements from overlapping periods are uploaded, transactions that appear in both are deduplicated by a composite key before analysis runs:

```typescript
function deduplicateTransactions(txs: RawTransaction[]): RawTransaction[] {
  const seen = new Set<string>();
  return txs.filter((t) => {
    const key = `${t.date}|${t.description}|${t.amount}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
```

When multiple statements each have an ending balance, the one from the most recently dated statement wins:

```typescript
const endingBalance = useMemo(() => {
  const withBalance = parsedFiles.filter((f) => f.endingBalance !== undefined);
  if (withBalance.length === 0) return undefined;
  withBalance.sort((a, b) => b.latestDate.localeCompare(a.latestDate));
  return withBalance[0].endingBalance;
}, [parsedFiles]);
```

---

## Tech stack

- [Next.js 15](https://nextjs.org/) — App Router, client components
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [PapaParse](https://www.papaparse.com/) — CSV parsing
- [pdfjs-dist](https://mozilla.github.io/pdf.js/) — PDF text extraction
- [Lucide React](https://lucide.dev/) — icons
- Built with [Claude](https://claude.ai/code)

---

## About

Built by Bhanu Kuna — product manager transitioning into AI-native product roles.

[LinkedIn →](#) · [Portfolio →](#)
