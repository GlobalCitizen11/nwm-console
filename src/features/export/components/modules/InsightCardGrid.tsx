import type { ExportInsight, ExportMode, ModuleFitMode } from "../../types/export";
import { InsightCard } from "./InsightCard";

export function InsightCardGrid({
  insights,
  compact = false,
  columns = 2,
  className = "",
  leadFirst = false,
  mode = "executive-brief",
  fitMode,
}: {
  insights: ExportInsight[];
  compact?: boolean;
  columns?: 2 | 3 | 4;
  className?: string;
  leadFirst?: boolean;
  mode?: ExportMode;
  fitMode?: ModuleFitMode;
}) {
  return (
    <div className={`insight-card-grid insight-card-grid--${columns} ${className}`.trim()}>
      {insights.map((insight, index) => (
        <InsightCard
          key={insight.id}
          insight={insight}
          compact={compact}
          className={leadFirst && index === 0 ? "insight-card--lead" : ""}
          mode={mode}
          fitMode={fitMode ?? (leadFirst && index === 0 ? "hero" : "support")}
        />
      ))}
    </div>
  );
}
