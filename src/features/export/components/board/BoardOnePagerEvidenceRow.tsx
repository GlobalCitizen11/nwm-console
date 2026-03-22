import type { ExportSemanticData } from "../../types/export";
import { EvidenceAnchorGrid } from "../modules/EvidenceAnchorGrid";

export function BoardOnePagerEvidenceRow({ data }: { data: ExportSemanticData }) {
  return <EvidenceAnchorGrid items={data.evidenceAnchors.slice(0, 4)} />;
}
