import type { ExportInsight } from "../../types/export";
import { Panel } from "../primitives/Panel";
import { SectionTitle } from "../primitives/SectionTitle";

export function StrategicImplicationBlock({ title, insights, label }: { title: string; insights: ExportInsight[]; label?: string }) {
  return (
    <Panel>
      <SectionTitle label={label} title={title} />
      <ul>
        {insights.map((insight) => (
          <li key={insight.id}>
            <strong>{insight.headline}</strong> {insight.support}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
