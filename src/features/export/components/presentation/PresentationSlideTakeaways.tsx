import type { ExportSemanticData } from "../../types/export";
import { InsightCardGrid } from "../modules/InsightCardGrid";
import { SectionTitle } from "../primitives/SectionTitle";

export function PresentationSlideTakeaways({ data }: { data: ExportSemanticData }) {
  return (
    <div className="export-stack-lg">
      <SectionTitle label="Slide 3" title="Key Takeaways" />
      <InsightCardGrid insights={data.keyInsights.slice(0, 3)} columns={3} />
    </div>
  );
}
