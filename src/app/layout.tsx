import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpendScanner — See Where Your Money Actually Goes",
  description:
    "Upload your bank statement and instantly see total cash in vs. cash out, broken down by category — mortgage, credit cards, auto, groceries, and more. 100% private — all processing happens in your browser.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
