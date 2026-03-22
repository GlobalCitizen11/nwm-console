import type { ExportSemanticData } from "../../types/export";
import { InsightCardGrid } from "../modules/InsightCardGrid";
import { SectionTitle } from "../primitives/SectionTitle";

export function PresentationSlideInflections({ data }: { data: ExportSemanticData }) {
  return (
    <div className="export-stack-lg presentation-slide-section">
      <SectionTitle label="Slide 5" title="Inflection Points" />
      <InsightCardGrid insights={data.evidenceAnchors.slice(0, 3)} columns={3} mode="presentation-brief" fitMode="evidence" />
    </div>
  );
}
