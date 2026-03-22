import type { ExportInsight } from "../../types/export";
import { InsightCardGrid } from "../modules/InsightCardGrid";

export function SlideTakeaways({ insights }: { insights: ExportInsight[] }) {
  return <InsightCardGrid insights={insights} columns={3} className="presentation-takeaways-grid" leadFirst mode="presentation-brief" fitMode="support" />;
}
