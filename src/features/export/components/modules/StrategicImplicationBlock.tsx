import type { ExportInsight } from "../../types/export";
import { Panel } from "../primitives/Panel";
import { SectionTitle } from "../primitives/SectionTitle";

export function StrategicImplicationBlock({
  title,
  insights,
  label,
  variant = "implication",
}: {
  title: string;
  insights: ExportInsight[];
  label?: string;
  variant?: "implication" | "risk";
}) {
  return (
    <Panel className={`strategic-block strategic-block--${variant}`}>
      <SectionTitle label={label} title={title} />
      <ul className="strategic-list">
        {insights.map((insight) => (
          <li key={insight.id} className="strategic-list-item">
            <h4>{insight.headline}</h4>
            <p>{insight.support}</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
