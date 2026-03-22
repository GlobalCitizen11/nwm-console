import type { ExportSemanticData } from "../../types/export";
import { ClosingSynthesisBlock } from "../modules/ClosingSynthesisBlock";
import { SectionTitle } from "../primitives/SectionTitle";

export function PresentationSlideClosing({ data }: { data: ExportSemanticData }) {
  return (
    <div className="export-stack-lg">
      <SectionTitle label="Slide 9" title="Closing Synthesis" subtitle="The governing readout to carry into discussion." />
      <ClosingSynthesisBlock text={data.closingSynthesis} />
    </div>
  );
}
