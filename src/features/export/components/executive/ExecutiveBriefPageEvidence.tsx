import type { ExportSemanticData } from "../../types/export";
import { EvidenceAnchorGrid } from "../modules/EvidenceAnchorGrid";
import { SignalDriverGrid } from "../modules/SignalDriverGrid";
import { SectionTitle } from "../primitives/SectionTitle";

export function ExecutiveBriefPageEvidence({ data }: { data: ExportSemanticData }) {
  return (
    <div className="export-stack-lg">
      <SectionTitle label="Page 5" title="Evidence & Signal Basis" subtitle="Observable anchors, domain interactions, and readout drivers." />
      <EvidenceAnchorGrid items={data.evidenceAnchors.slice(0, 6)} />
      <div className="export-grid-2 executive-evidence-grid">
        <SignalDriverGrid insights={data.crossDomainEffects.slice(0, 4)} />
        <SignalDriverGrid insights={data.containmentSignals.slice(0, 4)} />
      </div>
    </div>
  );
}
