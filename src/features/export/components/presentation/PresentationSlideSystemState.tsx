import type { ExportSemanticData } from "../../types/export";
import { KPIStrip } from "../modules/KPIStrip";
import { SectionTitle } from "../primitives/SectionTitle";
import { SlideHero } from "./SlideHero";

export function PresentationSlideSystemState({ data }: { data: ExportSemanticData }) {
  return (
    <div className="export-stack-lg presentation-slide-section">
      <SectionTitle label="Slide 2" title="System state" />
      <KPIStrip stats={data.systemStats.slice(0, 4)} className="presentation-kpi-strip" />
      <SlideHero text={data.executiveLead} />
    </div>
  );
}
