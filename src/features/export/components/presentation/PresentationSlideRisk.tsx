import type { ExportSemanticData } from "../../types/export";
import { SectionTitle } from "../primitives/SectionTitle";
import { SlideRisks } from "./SlideRisks";

export function PresentationSlideRisk({ data }: { data: ExportSemanticData }) {
  return (
    <div className="export-stack-lg presentation-slide-section">
      <SectionTitle label="Slide 8" title="Risk & Monitoring" subtitle="What merits closer visibility if the environment continues to tighten." />
      <SlideRisks insights={data.risks.slice(0, 3)} />
    </div>
  );
}
