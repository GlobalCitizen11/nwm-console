import type { ExportSemanticData } from "../../types/export";
import { BoardEvidenceStrip } from "./BoardEvidenceStrip";
import { SectionTitle } from "../primitives/SectionTitle";

export function BoardOnePagerEvidenceRow({ data }: { data: ExportSemanticData }) {
  return (
    <section className="export-section board-evidence-row">
      <SectionTitle label="Signal basis" title="Evidence anchors" />
      <BoardEvidenceStrip
        items={data.evidenceAnchors.slice(0, 3).map((anchor, index) => ({
          id: anchor.id,
          shortTitle: anchor.headline,
          shortSubtitle: anchor.support || anchor.signalTag || `Anchor ${index + 1}`,
        }))}
      />
    </section>
  );
}
