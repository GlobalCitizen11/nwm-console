import type { ExportInsight } from "../../types/export";

const fallbackMonth = (index: number) => `M${index + 1}`;

const formatAnchor = (insight: ExportInsight, index: number) => {
  const source = `${insight.headline} ${insight.support}`.trim();
  const month = source.match(/M\d+/i)?.[0]?.toUpperCase() ?? fallbackMonth(index);
  const title = insight.headline.replace(/^M\d+\s*[—-]\s*/i, "").trim();
  const support = insight.support.replace(/^M\d+\s*[—-]\s*/i, "").trim();
  const value = title || support || "Evidence anchor";
  const qualifier = support && support !== value ? support : insight.signalTag ?? "Observed";
  return `${month} — ${value}${qualifier ? ` (${qualifier})` : ""}`;
};

export function BoardEvidenceStrip({ items }: { items: ExportInsight[] }) {
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
