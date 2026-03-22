import type { ExportSemanticData } from "../../types/export";
import { SectionTitle } from "../primitives/SectionTitle";
import { SlideTakeaways } from "./SlideTakeaways";

export function PresentationSlideTakeaways({ data }: { data: ExportSemanticData }) {
  return (
    <div className="export-stack-lg presentation-slide-section">
      <SectionTitle label="Slide 3" title="Key Takeaways" subtitle="The dominant read and the two signals that most directly support it." />
      <SlideTakeaways insights={data.keyInsights.slice(0, 3)} />
    </div>
  );
}
