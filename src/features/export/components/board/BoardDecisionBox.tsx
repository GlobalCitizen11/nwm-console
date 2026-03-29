import { DecisionBox } from "../primitives/DecisionBox";

export function BoardDecisionBox({
  headline,
  summaryLines,
  bullets,
}: {
  headline: string;
  summaryLines: string[];
  bullets: string[];
}) {
  return (
    <section className="export-section board-decision-box">
      <div className="board-decision-summary">
        <p className="export-meta-label">Operating read</p>
        <div className="board-decision-summary-copy">
          {summaryLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
      <DecisionBox headline={headline} actions={bullets.slice(0, 3)} className="board-decision-box-shell" />
    </section>
  );
}
