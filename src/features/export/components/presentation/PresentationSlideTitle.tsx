import type { ExportSemanticData } from "../../types/export";
import { ExportHeader } from "../primitives/ExportHeader";

export function PresentationSlideTitle({ data }: { data: ExportSemanticData }) {
  return <ExportHeader title={data.title} subtitle={data.subtitle} metadata={data.metadata} modeLabel="Presentation Brief" />;
}
