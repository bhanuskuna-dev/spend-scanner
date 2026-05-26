/**
 * evalDataset.ts
 *
 * Golden dataset for evaluating the SpendScanner AI categorizer.
 * 30 transactions with known correct categories, including intentionally
 * tricky/ambiguous cases that represent common real-world failure modes.
 *
 * Design principles:
 * - Covers all 16 categories
 * - Includes ambiguous edge cases (the most valuable for evals)
 * - Notes explain WHY each label is correct
 */

import type { SpendCategory } from "@/lib/types";

export interface EvalTransaction {
  description: string;
  amount: number; // positive = debit (expense), negative = credit (income)
  expectedCategory: SpendCategory;
  notes: string;
}

export const EVAL_DATASET: EvalTransaction[] = [
  // ── Unambiguous positives (high-confidence expected) ──────────────────────
  {
    description: "DIRECT DEPOSIT EMPLOYER PAYROLL",
    amount: -4200.0,
    expectedCategory: "Income",
    notes: "Classic payroll deposit — negative amount + 'DIRECT DEPOSIT' = Income",
  },
  {
    description: "CHASE CREDIT CARD AUTOPAY",
    amount: 1850.0,
    expectedCategory: "Credit Card Payments",
    notes: "Clear credit card payment — 'CHASE' + 'AUTOPAY'",
  },
  {
    description: "CHEVRON #1234",
    amount: 68.5,
    expectedCategory: "Auto & Transportation",
    notes: "Gas station — Chevron is unambiguous fuel purchase",
  },
  {
    description: "NETFLIX.COM",
    amount: 15.99,
    expectedCategory: "Subscriptions",
    notes: "Netflix is the canonical streaming subscription",
  },
  {
    description: "DOORDASH WHOLEFDS",
    amount: 45.2,
    expectedCategory: "Dining & Coffee",
    notes: "DoorDash = food delivery = Dining even though 'Whole Foods' appears",
  },
  {
    description: "CVS PHARMACY #4421",
    amount: 23.0,
    expectedCategory: "Healthcare",
    notes: "CVS Pharmacy = healthcare even without Rx — pharmacy = Healthcare category",
  },
  {
    description: "STARBUCKS #00012",
    amount: 7.45,
    expectedCategory: "Dining & Coffee",
    notes: "Starbucks = coffee shop = Dining & Coffee",
  },
  {
    description: "DELTA AIR LINES",
    amount: 380.0,
    expectedCategory: "Travel",
    notes: "Airline = Travel",
  },
  {
    description: "AMC THEATRES",
    amount: 28.5,
    expectedCategory: "Entertainment",
    notes: "Movie theater = Entertainment",
  },

  // ── Tricky / ambiguous cases (the high-value eval cases) ─────────────────
  {
    description: "COSTCO WHOLESALE #521",
    amount: 187.0,
    expectedCategory: "Groceries",
    notes: "TRICKY: Costco is classified as Groceries (wholesale club for food), NOT Shopping — even though you can buy electronics there",
  },
  {
    description: "AMAZON.COM*1A2B3C4D",
    amount: 52.4,
    expectedCategory: "Shopping",
    notes: "TRICKY: Amazon default is Shopping unless amount/description indicates subscription pattern",
  },
  {
    description: "PAYPAL *ADOBE INC",
    amount: 54.99,
    expectedCategory: "Subscriptions",
    notes: "TRICKY: PayPal payment for Adobe = Subscriptions, NOT Transfers — the merchant matters more than the payment rail",
  },
  {
    description: "VENMO PAYMENT JOHN S",
    amount: 120.0,
    expectedCategory: "Transfers",
    notes: "TRICKY: Venmo to a person = Transfers, NOT Shopping or Other — person-to-person = Transfer",
  },
  {
    description: "USAA INSURANCE PAYMENT",
    amount: 234.0,
    expectedCategory: "Insurance",
    notes: "TRICKY: USAA is well-known as an insurance/financial company. Should be Insurance, not Transfers or Financial",
  },
  {
    description: "WHOLE FOODS MARKET #10",
    amount: 94.3,
    expectedCategory: "Groceries",
    notes: "Whole Foods = grocery store = Groceries (not Shopping even though it's a 'store')",
  },
  {
    description: "SPOTIFY AB",
    amount: 9.99,
    expectedCategory: "Subscriptions",
    notes: "Spotify = music streaming = Subscriptions",
  },
  {
    description: "UBER TRIP HELP.UBER.COM",
    amount: 24.75,
    expectedCategory: "Auto & Transportation",
    notes: "TRICKY: Uber = rideshare = Auto & Transportation, NOT Dining even if going to restaurant",
  },
  {
    description: "UBER EATS *CHIPOTLE",
    amount: 18.9,
    expectedCategory: "Dining & Coffee",
    notes: "TRICKY: Uber Eats = food delivery = Dining & Coffee — the food context takes priority over the Uber brand",
  },
  {
    description: "ATM WITHDRAWAL FEE BANK OF AMERICA",
    amount: 3.5,
    expectedCategory: "Fees",
    notes: "ATM fee = Fees category",
  },
  {
    description: "ZELLE TRANSFER TO MIKE",
    amount: 500.0,
    expectedCategory: "Transfers",
    notes: "Zelle person-to-person = Transfers",
  },
  {
    description: "PLANET FITNESS",
    amount: 24.99,
    expectedCategory: "Healthcare",
    notes: "TRICKY: Gym membership belongs in Healthcare (wellness), not Entertainment",
  },
  {
    description: "TARGET #2231",
    amount: 73.2,
    expectedCategory: "Shopping",
    notes: "Target general purchase = Shopping (not Groceries even though Target sells groceries)",
  },
  {
    description: "INTEREST EARNED SAVINGS",
    amount: -12.5,
    expectedCategory: "Income",
    notes: "TRICKY: Interest income = Income, even though small amount — negative amount + 'INTEREST EARNED' = Income",
  },
  {
    description: "COMCAST XFINITY",
    amount: 89.99,
    expectedCategory: "Utilities",
    notes: "Cable/internet provider = Utilities",
  },
  {
    description: "AIRBNB *HMWMZ1234",
    amount: 420.0,
    expectedCategory: "Travel",
    notes: "Airbnb = accommodation = Travel",
  },
  {
    description: "WALGREENS #5521",
    amount: 15.3,
    expectedCategory: "Healthcare",
    notes: "Walgreens pharmacy = Healthcare (same as CVS)",
  },
  {
    description: "MCDONALDS F5738",
    amount: 12.5,
    expectedCategory: "Dining & Coffee",
    notes: "Fast food = Dining & Coffee",
  },
  {
    description: "PROGRESSIVE INSURANCE",
    amount: 145.0,
    expectedCategory: "Insurance",
    notes: "Auto insurance payment = Insurance",
  },
  {
    description: "GITHUB INC",
    amount: 4.0,
    expectedCategory: "Subscriptions",
    notes: "GitHub subscription = Subscriptions (software/digital service)",
  },
  {
    description: "REFUND AMAZON RETURN",
    amount: -38.5,
    expectedCategory: "Shopping",
    notes: "TRICKY: Amazon refund is negative amount but should still be Shopping (a reversal), not Income",
  },
];
