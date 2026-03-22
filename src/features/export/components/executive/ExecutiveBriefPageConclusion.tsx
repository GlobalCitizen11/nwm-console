import type { ExportSemanticData } from "../../types/export";
import { SignalDriverGrid } from "../modules/SignalDriverGrid";
import { SectionTitle } from "../primitives/SectionTitle";
import { ConclusionBlock } from "./ConclusionBlock";

export function ExecutiveBriefPageConclusion({ data }: { data: ExportSemanticData }) {
  return (
    <div className="export-stack-lg">
      <SectionTitle label="System effects and conclusion" title="System effects and conclusion" subtitle="Where the effects are propagating, where containment still holds, and the concluding executive read." />
      <div className="export-grid-2 executive-conclusion-grid">
        <SignalDriverGrid insights={data.crossDomainEffects.slice(0, 4)} mode="executive-brief" />
        <SignalDriverGrid insights={data.containmentSignals.slice(0, 4)} mode="executive-brief" />
      </div>
      <ConclusionBlock text={data.closingSynthesis} />
    </div>
  );
}
