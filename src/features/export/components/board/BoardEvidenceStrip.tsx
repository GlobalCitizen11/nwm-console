import type { CanonicalEvidenceAnchor } from "../../types/export";

const fallbackMonth = (index: number) => `M${index + 11}`;

const formatAnchor = (anchor: CanonicalEvidenceAnchor, index: number) => {
  const month = anchor.shortTitle.match(/M\d+/i)?.[0]?.toUpperCase() ?? fallbackMonth(index);
  const title = anchor.shortTitle.replace(/^M\d+\s*[—-]\s*/i, "").trim();
  return `${month} — ${title || "Evidence anchor"}\n${anchor.shortSubtitle}`;
};

export function BoardEvidenceStrip({ items }: { items: CanonicalEvidenceAnchor[] }) {
  return (
    <div className="board-evidence-strip">
      {items.slice(0, 3).map((item, index) => (
        <div key={item.id} className="board-evidence-chip">
          {formatAnchor(item, index)}
        </div>
      ))}
    </div>
  );
}
