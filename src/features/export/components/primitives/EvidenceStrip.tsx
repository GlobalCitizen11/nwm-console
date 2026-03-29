import { EvidenceTag } from "./EvidenceTag";

export function EvidenceStrip({
  items,
  className = "",
}: {
  items: Array<{ id: string; code: string; text: string }>;
  className?: string;
}) {
  return (
    <div className={`evidence-strip ${className}`.trim()}>
      {items.map((item) => (
        <div key={item.id} className="evidence-strip-item">
          <EvidenceTag code={item.code} className="evidence-strip-tag" />
          <span className="evidence-strip-text">{item.text}</span>
        </div>
      ))}
    </div>
  );
}
