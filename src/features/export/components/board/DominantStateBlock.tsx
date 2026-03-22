import type { ExportInsight } from "../../types/export";
import { InsightCard } from "../modules/InsightCard";

export function DominantStateBlock({ insight }: { insight: ExportInsight }) {
  return <InsightCard insight={insight} className="insight-card--lead board-dominant-state" />;
}
