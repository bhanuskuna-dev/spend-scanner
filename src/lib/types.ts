export type SpendCategory =
  | "Income"
  | "Credit Card Payments"
  | "Mortgage & Rent"
  | "Auto & Transportation"
  | "Utilities"
  | "Insurance"
  | "Groceries"
  | "Dining & Coffee"
  | "Healthcare"
  | "Subscriptions"
  | "Shopping"
  | "Entertainment"
  | "Travel"
  | "Transfers"
  | "Fees"
  | "Other";

export interface RawTransaction {
  date: string;
  description: string;
  amount: number;
  /** positive = debit/expense, negative = credit/refund */
  type?: "debit" | "credit";
}

export interface CategorizedTransaction extends RawTransaction {
  category: SpendCategory;
}

export interface CategorySummary {
  category: SpendCategory;
  /** Sum of |amount| for all transactions in this category */
  total: number;
  count: number;
  transactions: CategorizedTransaction[];
  topMerchant: string;
  topMerchantAmount: number;
  /** Average per-month spend (or income) within this category */
  monthlyAverage: number;
}

export interface AnalysisTotals {
  totalIn: number;
  totalOut: number;
  net: number;
  monthCount: number;
}
