import type { ExportSemanticData } from "../../types/export";
import { EvidenceAnchorGrid } from "../modules/EvidenceAnchorGrid";
import { SectionTitle } from "../primitives/SectionTitle";

export function BoardOnePagerEvidenceRow({ data }: { data: ExportSemanticData }) {
  return (
    <section className="export-section board-evidence-row">
      <SectionTitle label="Signal basis" title="Evidence anchors in view" />
      <EvidenceAnchorGrid items={data.evidenceAnchors.slice(0, 3)} mode="board-onepager" />
    </section>
  );
}
