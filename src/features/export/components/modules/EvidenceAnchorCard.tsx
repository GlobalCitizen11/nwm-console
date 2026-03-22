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
      <p className="export-overline">{insight.signalTag ?? "Evidence Anchor"}</p>
      <h4>{safeCopy.headline}</h4>
      <p>{safeCopy.body}</p>
    </Panel>
  );
}
