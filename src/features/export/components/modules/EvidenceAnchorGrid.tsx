import type { ExportInsight } from "../../types/export";
import { EvidenceAnchorCard } from "./EvidenceAnchorCard";

export function EvidenceAnchorGrid({ items }: { items: ExportInsight[] }) {
  return (
    <div className="evidence-anchor-grid">
      {items.map((item) => (
        <EvidenceAnchorCard key={item.id} insight={item} />
      ))}
    </div>
  );
}
