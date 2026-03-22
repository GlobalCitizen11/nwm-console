import type { ExportSemanticData } from "../../types/export";
import { SignalDriverGrid } from "../modules/SignalDriverGrid";
import { ClosingSynthesisBlock } from "../modules/ClosingSynthesisBlock";
import { SectionTitle } from "../primitives/SectionTitle";

export function ExecutiveBriefPageConclusion({ data }: { data: ExportSemanticData }) {
  return (
    <div className="export-stack-lg">
      <SectionTitle label="Page 6" title="System Effects + Conclusion" subtitle="Cross-domain interaction, containment dynamics, and final synthesis." />
      <div className="export-grid-2">
        <SignalDriverGrid insights={data.crossDomainEffects} />
        <SignalDriverGrid insights={data.containmentSignals} />
      </div>
      <ClosingSynthesisBlock text={data.closingSynthesis} />
    </div>
  );
}
