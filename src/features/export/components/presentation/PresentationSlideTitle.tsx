import type { ExportSemanticData } from "../../types/export";
import { ExportHeader } from "../primitives/ExportHeader";

export function PresentationSlideTitle({ data }: { data: ExportSemanticData }) {
  return (
    <div className="presentation-hero">
      <ExportHeader title={data.title} subtitle={data.subtitle} metadata={data.metadata} modeLabel="Presentation Brief" />
      <div className="presentation-hero-note">{data.executiveLead}</div>
    </div>
  );
}
