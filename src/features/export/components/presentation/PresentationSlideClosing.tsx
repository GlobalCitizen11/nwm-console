import type { ExportSemanticData } from "../../types/export";
import { SectionTitle } from "../primitives/SectionTitle";
import { SlideConclusion } from "./SlideConclusion";

export function PresentationSlideClosing({ data }: { data: ExportSemanticData }) {
  return (
    <div className="export-stack-lg presentation-slide-section">
      <SectionTitle label="Slide 9" title="Closing Synthesis" subtitle="The governing readout to carry into discussion." />
      <SlideConclusion text={data.closingSynthesis} />
    </div>
  );
}
