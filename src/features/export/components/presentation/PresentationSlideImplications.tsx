import type { ExportSemanticData } from "../../types/export";
import { SectionTitle } from "../primitives/SectionTitle";
import { SlideImplications } from "./SlideImplications";

export function PresentationSlideImplications({ data }: { data: ExportSemanticData }) {
  return (
    <div className="export-stack-lg presentation-slide-section">
      <SectionTitle label="Slide 5" title="Strategic implications" />
      <SlideImplications left={data.implications.slice(0, 2)} right={data.crossDomainEffects.slice(0, 2)} />
    </div>
  );
}
