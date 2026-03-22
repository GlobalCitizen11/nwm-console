import type { ExportSemanticData } from "../../types/export";
import { SignalDriverGrid } from "../modules/SignalDriverGrid";
import { SectionTitle } from "../primitives/SectionTitle";
import { ConclusionBlock } from "./ConclusionBlock";

export function ExecutiveBriefPageConclusion({ data }: { data: ExportSemanticData }) {
  return (
    <div className="export-stack-lg">
      <SectionTitle label="Page 6" title="System Effects + Conclusion" subtitle="Cross-domain interaction, containment dynamics, and final synthesis." />
      <div className="export-grid-2 executive-conclusion-grid">
        <SignalDriverGrid insights={data.crossDomainEffects.slice(0, 4)} />
        <SignalDriverGrid insights={data.containmentSignals.slice(0, 4)} />
      </div>
      <ConclusionBlock text={data.closingSynthesis} />
    </div>
  );
}
