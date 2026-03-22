import type { ExportInsight, ExportMode } from "../../types/export";
import { renderSafeCopy } from "../../utils/renderSafeCopy";
import { SectionTitle } from "../primitives/SectionTitle";

export function ScenarioPathBlock({ title, insights, mode = "executive-brief" }: { title: string; insights: ExportInsight[]; mode?: ExportMode }) {
  return (
    <section className="export-section scenario-path-block">
      <SectionTitle label="Scenario paths" title={title} />
      <div className="pathway-panel-grid">
        {insights.slice(0, 2).map((insight, index) => {
          const safeCopy = renderSafeCopy({
            mode,
            fitMode: "scenario",
            item: insight,
          });

          return (
            <article key={insight.id} className={`pathway-panel ${index === 0 ? "is-primary" : "is-secondary"}`}>
              <span className="pathway-direction">{index === 0 ? "→" : "↺"}</span>
              <div className="pathway-copy">
                <p className="signal-module-label">{insight.signalTag ?? (index === 0 ? "Dominant path" : "Alternate path")}</p>
                <h4 className="signal-module-value">{safeCopy.headline}</h4>
                <p className="signal-module-support">{safeCopy.body}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
