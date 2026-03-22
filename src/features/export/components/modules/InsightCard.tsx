import type { ExportInsight, ExportMode, ModuleFitMode } from "../../types/export";
import { renderSafeCopy } from "../../utils/renderSafeCopy";
import { Panel } from "../primitives/Panel";

export function InsightCard({
  insight,
  compact = false,
  className = "",
  mode = "executive-brief",
  fitMode,
}: {
  insight: ExportInsight;
  compact?: boolean;
  className?: string;
  mode?: ExportMode;
  fitMode?: ModuleFitMode;
}) {
  const safeCopy = renderSafeCopy({
    mode,
    fitMode: fitMode ?? insight.fitMode ?? (compact ? "support" : "hero"),
    item: insight,
  });

  return (
    <Panel className={`insight-card no-clip-typography ${compact ? "insight-card--compact" : ""} ${className}`.trim()}>
      {insight.signalTag ? <p className="signal-module-label">{insight.signalTag}</p> : null}
      <h4 className="signal-module-value">{safeCopy.headline}</h4>
      <p className="signal-module-support">{safeCopy.body}</p>
    </Panel>
  );
}
