import type { ExportSemanticData } from "../../types/export";
import { ClosingSynthesisBlock } from "../modules/ClosingSynthesisBlock";

export function PresentationSlideClosing({ data }: { data: ExportSemanticData }) {
  return <ClosingSynthesisBlock text={data.closingSynthesis} />;
}
