import type { ExportInsight } from "../../types/export";
import { InsightCardGrid } from "../modules/InsightCardGrid";

export function SlideTimeline({ items }: { items: ExportInsight[] }) {
  return <InsightCardGrid insights={items} columns={3} className="presentation-progression-grid" mode="presentation-brief" fitMode="timeline" />;
}
