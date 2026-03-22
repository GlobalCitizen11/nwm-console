import type { ExportInsight, ExportMode } from "../../types/export";
import { renderSafeCopy } from "../../utils/renderSafeCopy";
import { Panel } from "../primitives/Panel";

export function EvidenceAnchorCard({ insight, mode = "executive-brief" }: { insight: ExportInsight; mode?: ExportMode }) {
  const safeCopy = renderSafeCopy({
    mode,
    fitMode: "evidence",
    item: insight,
  });

  return (
    <Panel className="evidence-anchor-card no-clip-typography">
      <p className="signal-module-label">{insight.signalTag ?? "Evidence anchor"}</p>
      <h4 className="signal-module-value">{safeCopy.headline}</h4>
      <p className="signal-module-support">{safeCopy.body}</p>
    </Panel>
  );
}
