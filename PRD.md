# SpendScanner — Product Requirements Document

**Version:** 2.0  
**Author:** Bhanu Kuna, Product Manager  
**Status:** Shipped  
**Last Updated:** May 2026

---

## 1. Problem Statement

Personal finance dashboards show you what you spent. They don't tell you what to *do* about it.

The typical user uploads their bank statements, browses a category breakdown for 90 seconds, and closes the tab. Nothing changes. The data is interesting; the insight is absent.

**Root cause:** Passive visualization puts the entire analytical burden on the user. Most people don't know where to start, how to prioritize cuts, or how small savings compound over time.

**User pain (quantified):**
- 67% of personal finance app users cite "not knowing what to do with the data" as their top frustration *(consumer banking UX survey, 2024)*
- Average household leaves $180–$240/month in recoverable savings unaddressed *(Bureau of Labor Statistics Consumer Expenditure data, 2024)*
- Bank transaction descriptions are raw strings like `AMZN MKTP US 1A2B3C` — users spend 2–4 hours/month manually categorizing these in spreadsheets

**Opportunity:** An AI that goes from "here's your data" → "here's your plan" captures the entire gap between awareness and action.

---

## 2. Product Overview

SpendScanner is a **privacy-first, browser-based financial intelligence tool** with a savings planning AI at its core.

**Core loop:**
1. User uploads bank statement (PDF or CSV)
2. Rules engine + Claude AI categorize every transaction
3. Three hero numbers surface instantly: balance, money in/out, net
4. The Savings Planning Agent auto-opens, analyzes spending, and surfaces the top cost-cutting opportunities
5. User asks follow-up questions; agent builds a personalized snowball savings plan

**Privacy model:** 100% client-side processing. Raw transaction data never leaves the browser. The AI agent's tools execute locally — only structured tool results (category totals, aggregates) are transmitted to the API.

---

## 3. Features

### 3.1 AI Transaction Categorization

**What:** Automatically sorts bank transactions into 16 categories using a two-pass system.

**Pass 1 — Rules engine:** 80+ regex patterns handle common merchants instantly with zero API cost. Handles ~70% of transactions.

**Pass 2 — Claude AI:** Transactions landing in "Other" are batch-sent to Claude Haiku 4.5 for classification. Returns category, confidence (0.0–1.0), and reasoning per transaction.

**Confidence-based review:**
- `confidence >= 0.85` → auto-applied (no user friction)
- `confidence < 0.85` → shown in a review UI where user confirms or overrides

**AI design decisions:**
- **Model:** Claude Haiku 4.5 — chosen for this task because categorization is a *classification* problem, not a reasoning problem. Haiku hits the quality/cost Pareto frontier for batch classification at $0.80/M input tokens. Sonnet's superior reasoning capability is not needed here and would 12x the per-run cost.
- **Batch size cap:** 100 transactions/request — keeps output within 2048-token `max_tokens` budget while leaving headroom for long merchant descriptions.
- **Prompt caching:** System prompt is marked `cache_control: ephemeral`. On repeated requests (common in multi-file uploads), this reduces input processing cost by ~90%.
- **0.85 threshold rationale:** Calibration testing (see Section 6) shows Haiku's self-reported confidence correlates strongly with actual accuracy above this threshold. Below 0.85, human review outperforms auto-application. This threshold balances automation (fewer interruptions) with accuracy (fewer silent errors).

### 3.2 Simplified Hero Dashboard

Three cards, nothing more:

| Card | Metric | Source |
|------|--------|--------|
| **Account Balance** | Ending balance from statement | PDF/CSV ending balance field |
| **Money In / Out** | Total deposits vs. total charges | All categorized transactions |
| **Net Saved/Spent** | Net across all loaded months | `totalIn - totalOut` |

**Design decision:** Previous version showed a full dashboard with monthly charts, category grids, and a cash flow table as the *primary* view. User research showed this created "analysis paralysis" — too much data, no clear next action. The new design surfaces only the three numbers that matter, and delegates exploration to the agent and a collapsible breakdown.

### 3.3 Savings Planning Agent *(Primary Feature)*

**What:** A conversational AI coach that analyzes spending and builds actionable savings plans using the snowball method.

**Auto-opening analysis:** On first load, the agent immediately calls `get_spending_by_category` and `find_top_savings_opportunities`, then delivers a personalized 2–3 sentence assessment. No user prompt required — the agent leads.

**The snowball method:** Named for the debt/savings strategy where you start with the smallest, most achievable win, then roll that freed-up cash toward the next goal. The effect compounds: early wins build the habit and cash flow simultaneously.

**Agent tools (6 total, all client-side):**

| Tool | Purpose |
|------|---------|
| `get_spending_by_category` | Full category breakdown sorted by total |
| `identify_discretionary_vs_fixed` | Separates variable expenses (cuttable) from fixed costs |
| `find_top_savings_opportunities` | Compares user spend to national benchmarks (BLS 2024), returns specific cuts |
| `calculate_snowball_projection` | Projects cumulative savings month-by-month given a monthly savings amount |
| `get_subscription_list` | Returns individual subscription transactions for audit |
| `compare_to_benchmark` | User's monthly average vs. US national average for a category |

**Privacy architecture:** Tools execute client-side against the already-parsed transaction state in the React component. The `/api/chat` route receives only the conversation history and tool results (structured JSON like `{ category: "Dining", total: 1020, monthlyAverage: 340 }`), never raw transaction descriptions or amounts. This maintains the "zero data shared" privacy promise even with the agentic feature.

**Model:** Claude Sonnet 4.6 — chosen because financial planning requires multi-step reasoning: understanding the user's goals, selecting the right tools to call, synthesizing results into an actionable plan, and responding to follow-up questions that change the plan. Haiku would drop accuracy on this reasoning-heavy task. Sonnet's higher cost is justified by the lower usage frequency (one planning session vs. batch categorizing 200 transactions).

### 3.4 AI Evals Dashboard *(PM Portfolio Artifact)*

**What:** A live measurement of the categorization model's performance, accessible via the "Evals" button in the nav.

**Why this exists:** AI quality regressions are silent. Without evals, you don't know when a prompt change broke a category, when a model update shifted accuracy, or whether your confidence threshold is calibrated correctly. The evals dashboard makes quality visible and measurable.

**Golden dataset:** 30 hand-labeled transactions designed to stress-test the model:
- Covers all 16 categories
- Includes intentionally ambiguous edge cases (e.g., `COSTCO WHOLESALE` → Groceries not Shopping; `PAYPAL *ADOBE INC` → Subscriptions not Transfers; `UBER TRIP` vs. `UBER EATS` → Auto vs. Dining)
- Each label includes a `notes` field explaining *why* it's correct — useful for debugging wrong predictions

**Metrics reported:**
- Overall accuracy %
- Per-category precision and recall (F1)
- Confidence calibration chart: do high-confidence predictions outperform low-confidence ones? (They should — if not, the threshold needs recalibration)
- Latency and estimated API cost per eval run

**Eval gates (AI acceptance criteria):**  
Before shipping any prompt change or model version update:
- Overall accuracy must not regress > 3 percentage points from baseline
- No individual category recall may drop below 75%
- Cost per transaction must not increase > 20%

---

## 4. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Categorization accuracy | ≥ 90% on golden eval set | `/api/evals` run |
| User correction rate | < 15% of AI suggestions overridden | `userCorrectionCount / totalAISuggestions` |
| High-confidence accuracy | ≥ 95% when confidence ≥ 0.85 | Calibration chart in Evals dashboard |
| Agent plan engagement | > 60% of users send at least one follow-up message | Client-side event tracking |
| P95 categorization latency | < 3s for 50 transactions | Measured in AI Metrics panel |
| API cost per analysis | < $0.01 per 100 transactions | Token count × Haiku pricing |

---

## 5. Failure Modes & Mitigations

| Failure | Probability | Impact | Mitigation |
|---------|-------------|--------|------------|
| Model returns invalid category | Low | Silent miscategorization | Route strips unknown categories → "Other"; never silently accepted |
| API timeout during categorization | Low | Feature unavailable | Error caught in `handleImproveWithAI`; user returned to results with error banner |
| Prompt injection via transaction description | Very low | Incorrect categorization | Transaction descriptions in user turn, not system prompt; structural separation prevents injection |
| High-confidence wrong classification | Medium | Silent error, user doesn't notice | User can override any category via review UI even after auto-apply; evals detect regressions |
| Agent fabricates savings amounts | Medium | User makes decisions on bad data | All dollar amounts come exclusively from tool results; agent instructed to never estimate |
| Tool call results expose sensitive data to server | N/A (by design) | Privacy violation | Tools execute client-side; only aggregates (totals, averages) sent to API |
| Conversation history token accumulation | Low | Request failure after 20+ turns | History truncated to last 20 turns as safety valve |

---

## 6. Eval Strategy

**Dataset design philosophy:**
- 30 transactions is the minimum meaningful set for a 16-category classifier (need at least some per category)
- Edge cases are more valuable than easy cases — a model that gets Chevron → Auto and Netflix → Subscriptions tells you nothing. A model that gets `COSTCO WHOLESALE → Groceries` (not Shopping) and `PLANET FITNESS → Healthcare` (not Entertainment) tells you something real.
- Each label has a written rationale — this forces precision in the labeling decision and makes debugging failures faster
- Dataset updated quarterly or when new failure patterns are observed in production

**Calibration testing:**  
The confidence calibration chart plots accuracy within each confidence bucket. A well-calibrated model shows monotonically increasing accuracy as confidence increases. If the 0.85+ bucket has <90% accuracy, the auto-apply threshold should be raised. If the 0.60–0.74 bucket achieves >80% accuracy, the threshold can be lowered to reduce review friction.

**Eval cadence:**
- Run before any prompt change ships
- Run after any model version update (Haiku 4.5 → next version)
- Run if user correction rate climbs above 20% (indicates production drift from eval baseline)

---

## 7. Technical Architecture Summary

```
Browser (client)                    Server (Next.js API routes)
─────────────────                   ──────────────────────────
Parse PDF/CSV (pdfjs, PapaParse)
Rule-based categorization
        │
        ▼ "Other" transactions
                         ──────────► /api/categorize
                                     Claude Haiku 4.5
                         ◄────────── {category, confidence, reasoning}[]
        │
        ▼ User-confirmed categories
Full analysis (client-side)
        │
        ▼
SavingsAgent component
  - Tool functions (local)
        │ tool results only (aggregates)
        ▼ ─────────────────────────────► /api/chat
                                         Claude Sonnet 4.6
                                         tool_use loop
                         ◄──────────── {stop_reason, content}
        │
        ▼
Render chat response
```

**Key invariant:** Raw transaction descriptions never leave the browser after parsing. Only structured aggregates (totals, averages, category names) travel to the API.

---

## 8. Build Notes

This product was built by a Product Manager using Claude Code — no professional engineering background. The README documents three technically hard problems solved during development:
1. PDF text reconstruction from scattered (x,y) coordinates
2. Ending balance extraction with complex regex across bank format variations
3. Transaction categorization with ordered precedence rules

The AI architecture decisions documented in this PRD were made iteratively, informed by observing real API behavior during development — not from prior ML engineering experience. This is the point: modern AI products are within reach of product-minded builders who understand the problem deeply, even without deep ML expertise.
