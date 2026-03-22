import type { ExportInsight } from "../../types/export";
import { InsightCardGrid } from "../modules/InsightCardGrid";

export function InsightGrid({ insights, className = "", leadFirst = false }: { insights: ExportInsight[]; className?: string; leadFirst?: boolean }) {
  return <InsightCardGrid insights={insights} columns={2} className={className} leadFirst={leadFirst} mode="executive-brief" />;
}
