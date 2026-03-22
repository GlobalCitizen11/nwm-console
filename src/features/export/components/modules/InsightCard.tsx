import type { ExportInsight } from "../../types/export";
import { DataBadge } from "../primitives/DataBadge";
import { Panel } from "../primitives/Panel";

export function InsightCard({ insight, compact = false }: { insight: ExportInsight; compact?: boolean }) {
  return (
    <Panel className={`insight-card ${compact ? "insight-card--compact" : ""}`}>
      <div className="insight-card-top">
        {insight.signalTag ? <DataBadge tone={insight.emphasis ?? "neutral"}>{insight.signalTag}</DataBadge> : null}
      </div>
      <h4>{insight.headline}</h4>
      <p>{insight.support}</p>
    </Panel>
  );
}
