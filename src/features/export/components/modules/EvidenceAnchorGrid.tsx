import type { ExportInsight, ExportMode } from "../../types/export";
import { EvidenceAnchorCard } from "./EvidenceAnchorCard";

export function EvidenceAnchorGrid({ items, mode = "executive-brief" }: { items: ExportInsight[]; mode?: ExportMode }) {
  return (
    <div className="evidence-anchor-grid">
      {items.map((item) => (
        <EvidenceAnchorCard key={item.id} insight={item} mode={mode} />
      ))}
    </div>
  );
}
