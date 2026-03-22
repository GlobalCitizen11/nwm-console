import type { ExportSemanticData } from "../../types/export";
import { SectionTitle } from "../primitives/SectionTitle";
import { SlideRisks } from "./SlideRisks";

export function PresentationSlideRisk({ data }: { data: ExportSemanticData }) {
  return (
    <div className="export-stack-lg presentation-slide-section">
      <SectionTitle label="Slide 7" title="Risk and monitoring" />
      <SlideRisks insights={data.risks.slice(0, 2)} />
    </div>
  );
}
