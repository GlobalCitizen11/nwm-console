import type { ExportInsight } from "../../types/export";
import { EvidenceAnchorGrid } from "../modules/EvidenceAnchorGrid";

export function EvidenceCluster({ items }: { items: ExportInsight[] }) {
  return <EvidenceAnchorGrid items={items} mode="executive-brief" />;
}
