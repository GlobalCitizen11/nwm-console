import type { ExportSemanticData } from "../../types/export";
import { StrategicImplicationBlock } from "../modules/StrategicImplicationBlock";
import { SectionTitle } from "../primitives/SectionTitle";

export function PresentationSlideImplications({ data }: { data: ExportSemanticData }) {
  return (
    <div className="export-stack-lg">
      <SectionTitle label="Slide 6" title="Strategic Implications" />
      <div className="export-grid-2">
        <StrategicImplicationBlock title="Implications" insights={data.implications.slice(0, 3)} />
        <StrategicImplicationBlock title="Cross-domain drivers" insights={data.crossDomainEffects.slice(0, 3)} />
      </div>
    </div>
  );
}
