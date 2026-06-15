"use client";

import { Sparkles } from "lucide-react";
import type { RawTransaction } from "@/lib/types";

export const SAMPLE_TRANSACTIONS: RawTransaction[] = [
  // Income
  { date: "2024-01-15", description: "DIRECT DEPOSIT PAYROLL ACME CORP", amount: -4200.00, type: "credit" },
  { date: "2024-01-31", description: "DIRECT DEPOSIT PAYROLL ACME CORP", amount: -4200.00, type: "credit" },
  { date: "2024-02-15", description: "DIRECT DEPOSIT PAYROLL ACME CORP", amount: -4200.00, type: "credit" },
  { date: "2024-02-29", description: "DIRECT DEPOSIT PAYROLL ACME CORP", amount: -4200.00, type: "credit" },
  { date: "2024-03-15", description: "DIRECT DEPOSIT PAYROLL ACME CORP", amount: -4200.00, type: "credit" },
  { date: "2024-03-31", description: "DIRECT DEPOSIT PAYROLL ACME CORP", amount: -4200.00, type: "credit" },
  { date: "2024-04-15", description: "DIRECT DEPOSIT PAYROLL ACME CORP", amount: -4200.00, type: "credit" },
  { date: "2024-04-30", description: "DIRECT DEPOSIT PAYROLL ACME CORP", amount: -4200.00, type: "credit" },

  // Mortgage
  { date: "2024-01-01", description: "ROCKET MORTGAGE PAYMENT", amount: 1850.00, type: "debit" },
  { date: "2024-02-01", description: "ROCKET MORTGAGE PAYMENT", amount: 1850.00, type: "debit" },
  { date: "2024-03-01", description: "ROCKET MORTGAGE PAYMENT", amount: 1850.00, type: "debit" },
  { date: "2024-04-01", description: "ROCKET MORTGAGE PAYMENT", amount: 1850.00, type: "debit" },

  // Credit card payments
  { date: "2024-01-08", description: "AUTOPAY CHASE CREDIT CARD", amount: 642.18, type: "debit" },
  { date: "2024-02-08", description: "AUTOPAY CHASE CREDIT CARD", amount: 814.55, type: "debit" },
  { date: "2024-03-08", description: "AUTOPAY CHASE CREDIT CARD", amount: 521.04, type: "debit" },
  { date: "2024-04-08", description: "AUTOPAY CHASE CREDIT CARD", amount: 706.30, type: "debit" },
  { date: "2024-01-22", description: "AMEX EPAYMENT", amount: 312.00, type: "debit" },
  { date: "2024-02-22", description: "AMEX EPAYMENT", amount: 412.50, type: "debit" },
  { date: "2024-03-22", description: "AMEX EPAYMENT", amount: 285.75, type: "debit" },

  // Auto & Transportation
  { date: "2024-01-05", description: "TOYOTA FINANCIAL SERVICES", amount: 489.00, type: "debit" },
  { date: "2024-02-05", description: "TOYOTA FINANCIAL SERVICES", amount: 489.00, type: "debit" },
  { date: "2024-03-05", description: "TOYOTA FINANCIAL SERVICES", amount: 489.00, type: "debit" },
  { date: "2024-04-05", description: "TOYOTA FINANCIAL SERVICES", amount: 489.00, type: "debit" },
  { date: "2024-01-11", description: "SHELL OIL", amount: 58.42, type: "debit" },
  { date: "2024-01-25", description: "CHEVRON GAS STATION", amount: 62.18, type: "debit" },
  { date: "2024-02-09", description: "SHELL OIL", amount: 54.30, type: "debit" },
  { date: "2024-02-23", description: "EXXON MOBIL", amount: 60.92, type: "debit" },
  { date: "2024-03-12", description: "SHELL OIL", amount: 56.74, type: "debit" },
  { date: "2024-03-28", description: "CHEVRON GAS STATION", amount: 65.10, type: "debit" },
  { date: "2024-01-18", description: "UBER TRIP", amount: 22.10, type: "debit" },
  { date: "2024-02-14", description: "UBER TRIP", amount: 18.55, type: "debit" },
  { date: "2024-03-20", description: "LYFT RIDE", amount: 15.42, type: "debit" },

  // Utilities
  { date: "2024-01-12", description: "PG&E ELECTRIC BILL", amount: 145.20, type: "debit" },
  { date: "2024-02-12", description: "PG&E ELECTRIC BILL", amount: 165.80, type: "debit" },
  { date: "2024-03-12", description: "PG&E ELECTRIC BILL", amount: 132.40, type: "debit" },
  { date: "2024-04-12", description: "PG&E ELECTRIC BILL", amount: 128.90, type: "debit" },
  { date: "2024-01-18", description: "COMCAST XFINITY INTERNET", amount: 89.99, type: "debit" },
  { date: "2024-02-18", description: "COMCAST XFINITY INTERNET", amount: 89.99, type: "debit" },
  { date: "2024-03-18", description: "COMCAST XFINITY INTERNET", amount: 89.99, type: "debit" },
  { date: "2024-04-18", description: "COMCAST XFINITY INTERNET", amount: 89.99, type: "debit" },
  { date: "2024-01-20", description: "VERIZON WIRELESS", amount: 110.00, type: "debit" },
  { date: "2024-02-20", description: "VERIZON WIRELESS", amount: 110.00, type: "debit" },
  { date: "2024-03-20", description: "VERIZON WIRELESS", amount: 110.00, type: "debit" },

  // Insurance
  { date: "2024-01-15", description: "GEICO AUTO INSURANCE", amount: 165.00, type: "debit" },
  { date: "2024-02-15", description: "GEICO AUTO INSURANCE", amount: 165.00, type: "debit" },
  { date: "2024-03-15", description: "GEICO AUTO INSURANCE", amount: 165.00, type: "debit" },

  // Groceries
  { date: "2024-01-06", description: "WHOLE FOODS MARKET", amount: 142.55, type: "debit" },
  { date: "2024-01-13", description: "TRADER JOE'S", amount: 88.20, type: "debit" },
  { date: "2024-01-20", description: "SAFEWAY", amount: 76.40, type: "debit" },
  { date: "2024-01-27", description: "WHOLE FOODS MARKET", amount: 124.18, type: "debit" },
  { date: "2024-02-03", description: "TRADER JOE'S", amount: 92.55, type: "debit" },
  { date: "2024-02-10", description: "WHOLE FOODS MARKET", amount: 156.30, type: "debit" },
  { date: "2024-02-17", description: "SAFEWAY", amount: 84.12, type: "debit" },
  { date: "2024-03-02", description: "WHOLE FOODS MARKET", amount: 138.74, type: "debit" },
  { date: "2024-03-09", description: "TRADER JOE'S", amount: 102.40, type: "debit" },
  { date: "2024-03-23", description: "COSTCO WHOLESALE", amount: 245.18, type: "debit" },

  // Dining & Coffee
  { date: "2024-01-04", description: "STARBUCKS COFFEE", amount: 6.45, type: "debit" },
  { date: "2024-01-09", description: "CHIPOTLE", amount: 14.20, type: "debit" },
  { date: "2024-01-16", description: "DOORDASH", amount: 32.55, type: "debit" },
  { date: "2024-01-23", description: "STARBUCKS COFFEE", amount: 5.85, type: "debit" },
  { date: "2024-02-06", description: "CHIPOTLE", amount: 13.75, type: "debit" },
  { date: "2024-02-13", description: "STARBUCKS COFFEE", amount: 6.45, type: "debit" },
  { date: "2024-02-20", description: "UBER EATS", amount: 28.40, type: "debit" },
  { date: "2024-03-05", description: "STARBUCKS COFFEE", amount: 6.45, type: "debit" },
  { date: "2024-03-15", description: "DOORDASH", amount: 41.20, type: "debit" },

  // Subscriptions
  { date: "2024-01-03", description: "NETFLIX.COM", amount: 15.49, type: "debit" },
  { date: "2024-02-03", description: "NETFLIX.COM", amount: 15.49, type: "debit" },
  { date: "2024-03-03", description: "NETFLIX.COM", amount: 15.49, type: "debit" },
  { date: "2024-04-03", description: "NETFLIX.COM", amount: 15.49, type: "debit" },
  { date: "2024-01-07", description: "SPOTIFY USA", amount: 9.99, type: "debit" },
  { date: "2024-02-07", description: "SPOTIFY USA", amount: 9.99, type: "debit" },
  { date: "2024-03-07", description: "SPOTIFY USA", amount: 9.99, type: "debit" },
  { date: "2024-01-22", description: "ADOBE CREATIVE CLOUD", amount: 54.99, type: "debit" },
  { date: "2024-02-22", description: "ADOBE CREATIVE CLOUD", amount: 54.99, type: "debit" },
  { date: "2024-03-22", description: "ADOBE CREATIVE CLOUD", amount: 54.99, type: "debit" },

  // Shopping
  { date: "2024-01-14", description: "AMAZON.COM AMZN", amount: 67.40, type: "debit" },
  { date: "2024-01-28", description: "TARGET", amount: 89.55, type: "debit" },
  { date: "2024-02-11", description: "AMAZON.COM AMZN", amount: 124.99, type: "debit" },
  { date: "2024-02-25", description: "BEST BUY", amount: 312.50, type: "debit" },
  { date: "2024-03-10", description: "AMAZON.COM AMZN", amount: 45.20, type: "debit" },

  // Healthcare
  { date: "2024-01-19", description: "CVS PHARMACY", amount: 32.40, type: "debit" },
  { date: "2024-02-19", description: "WALGREENS", amount: 18.75, type: "debit" },

  // Travel
  { date: "2024-03-25", description: "DELTA AIRLINES", amount: 425.00, type: "debit" },
  { date: "2024-03-26", description: "MARRIOTT HOTELS", amount: 320.00, type: "debit" },

  // Transfers
  { date: "2024-01-30", description: "ZELLE TO JOHN SMITH", amount: 200.00, type: "debit" },
  { date: "2024-02-28", description: "VENMO PAYMENT", amount: 75.00, type: "debit" },

  // Fees
  { date: "2024-02-15", description: "ATM FEE", amount: 3.50, type: "debit" },
];

interface SampleDataButtonProps {
  onLoad: (transactions: RawTransaction[]) => void;
}

export function SampleDataButton({ onLoad }: SampleDataButtonProps) {
  return (
    <button
      onClick={() => onLoad(SAMPLE_TRANSACTIONS)}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-200 bg-brand-50 hover:bg-brand-100 text-brand-700 text-sm font-semibold transition-colors"
    >
      <Sparkles className="w-4 h-4" />
      Try with sample data
    </button>
  );
}
