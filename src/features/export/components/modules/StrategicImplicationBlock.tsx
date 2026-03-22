import type { ExportInsight, ExportMode } from "../../types/export";
import { renderSafeCopy } from "../../utils/renderSafeCopy";
import { Panel } from "../primitives/Panel";
import { SectionTitle } from "../primitives/SectionTitle";

export function StrategicImplicationBlock({
  title,
  insights,
  label,
  variant = "implication",
  mode = "executive-brief",
}: {
  title: string;
  insights: ExportInsight[];
  label?: string;
  variant?: "implication" | "risk";
  mode?: ExportMode;
}) {
  return (
    <Panel className={`strategic-block strategic-block--${variant} no-clip-typography`}>
      <SectionTitle label={label} title={title} />
      <ul className="strategic-list">
        {insights.map((insight) => {
          const safeCopy = renderSafeCopy({
            mode,
            fitMode: variant === "risk" ? "monitoring" : "implication",
            item: insight,
          });
          return (
            <li key={insight.id} className="strategic-list-item">
              <h4>{safeCopy.headline}</h4>
              <p>{safeCopy.body}</p>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
