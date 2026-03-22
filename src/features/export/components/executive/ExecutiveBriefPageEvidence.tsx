import type { ExportSemanticData } from "../../types/export";
import { SignalDriverGrid } from "../modules/SignalDriverGrid";
import { SectionTitle } from "../primitives/SectionTitle";
import { EvidenceCluster } from "./EvidenceCluster";

export function ExecutiveBriefPageEvidence({ data }: { data: ExportSemanticData }) {
  return (
    <div className="export-stack-lg">
      <SectionTitle label="Page 5" title="Evidence & Signal Basis" subtitle="Observable anchors, domain interactions, and readout drivers." />
      <EvidenceCluster items={data.evidenceAnchors.slice(0, 6)} />
      <div className="export-grid-2 executive-evidence-grid">
        <SignalDriverGrid insights={data.crossDomainEffects.slice(0, 4)} mode="executive-brief" />
        <SignalDriverGrid insights={data.containmentSignals.slice(0, 4)} mode="executive-brief" />
      </div>
    </div>
  );
}
