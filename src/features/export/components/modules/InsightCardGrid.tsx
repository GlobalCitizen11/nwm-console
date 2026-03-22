import type { ExportInsight } from "../../types/export";
import { InsightCard } from "./InsightCard";

export function InsightCardGrid({ insights, compact = false, columns = 2 }: { insights: ExportInsight[]; compact?: boolean; columns?: 2 | 3 | 4 }) {
  return (
    <div className={`insight-card-grid insight-card-grid--${columns}`}>
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} compact={compact} />
      ))}
    </div>
  );
}
