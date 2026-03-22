import type { ExportInsight } from "../../types/export";
import { Panel } from "../primitives/Panel";

export function EvidenceAnchorCard({ insight }: { insight: ExportInsight }) {
  return (
    <Panel className="evidence-anchor-card">
      <p className="export-meta-label">{insight.signalTag ?? "Evidence"}</p>
      <h4>{insight.headline}</h4>
      <p>{insight.support}</p>
    </Panel>
  );
}
