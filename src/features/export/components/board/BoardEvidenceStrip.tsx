import type { CanonicalEvidenceAnchor } from "../../types/export";
import { EvidenceStrip } from "../primitives/EvidenceStrip";

const fallbackMonth = (index: number) => `M${index + 11}`;

const formatAnchor = (anchor: CanonicalEvidenceAnchor, index: number) => {
  const month = anchor.shortTitle.match(/M\d+/i)?.[0]?.toUpperCase() ?? fallbackMonth(index);
  const title = anchor.shortTitle.replace(/^M\d+\s*[—-]\s*/i, "").trim();
  return {
    month,
    title: title || "Evidence anchor",
    subtitle: anchor.shortSubtitle,
  };
};

export function BoardEvidenceStrip({ items }: { items: CanonicalEvidenceAnchor[] }) {
  const dedupedItems = items
    .map((item, index) => {
      const formatted = formatAnchor(item, index);
      const implication = [formatted.title, formatted.subtitle].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
      return {
        id: item.id,
        tag: formatted.month,
        implication,
      };
    })
    .filter((item, index, collection) => {
      return collection.findIndex((candidate) => candidate.implication.toLowerCase() === item.implication.toLowerCase()) === index;
    })
    .slice(0, 6);

  return (
    <EvidenceStrip
      className="board-evidence-strip"
      items={dedupedItems.map((item) => ({
        id: item.id,
        code: `[${item.tag}]`,
        text: item.implication,
      }))}
    />
  );
}
