import type { ExportSemanticData } from "../../types/export";
import { SignalDriverGrid } from "../modules/SignalDriverGrid";
import { SectionTitle } from "../primitives/SectionTitle";
import { EvidenceCluster } from "./EvidenceCluster";

export function ExecutiveBriefPageEvidence({ data }: { data: ExportSemanticData }) {
  return (
    <div className="export-stack-lg">
      <SectionTitle label="Evidence and signal basis" title="Evidence and signal basis" subtitle="Observable anchors, cross-domain interaction, and the evidence that would change the read." />
      <EvidenceCluster items={data.evidenceAnchors.slice(0, 6)} />
      <div className="export-grid-2 executive-evidence-grid">
        <SignalDriverGrid insights={data.crossDomainEffects.slice(0, 4)} mode="executive-brief" />
        <SignalDriverGrid insights={data.containmentSignals.slice(0, 4)} mode="executive-brief" />
      </div>
    </div>
  );
}
