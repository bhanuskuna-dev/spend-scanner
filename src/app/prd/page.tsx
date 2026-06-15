import fs from "fs";
import path from "path";
import { PRDContent } from "./PRDContent";

export const metadata = {
  title: "Product Requirements Document — SpendScanner",
  description: "AI product spec for SpendScanner: design decisions, success metrics, failure modes, and eval strategy.",
};

export default function PRDPage() {
  const content = fs.readFileSync(path.join(process.cwd(), "PRD.md"), "utf-8");
  return <PRDContent content={content} />;
}
