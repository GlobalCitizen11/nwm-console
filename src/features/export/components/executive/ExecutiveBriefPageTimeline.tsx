import type { ExportSemanticData } from "../../types/export";
import { SectionTitle } from "../primitives/SectionTitle";
import { composeExecutiveNarrative } from "../../utils/composeExecutiveNarrative";
import { ExecutiveSignalModule } from "./ExecutiveSignalModule";

export function ExecutiveBriefPageTimeline({ data }: { data: ExportSemanticData }) {
  const narrative = composeExecutiveNarrative(data.sourceState);
  const containment =
    data.sourceState.stabilitySignals[0] ?? "Containment still exists at some edges, but it is no longer sufficient to reset the broader readout.";

  return (
    <section className="executive-brief-section">
      <SectionTitle title={narrative.interpretation.title} subtitle={narrative.interpretation.subtitle} />
      <div className="executive-page-grid">
        <div className="executive-page-main">
          <div className="executive-brief-prose">
            {narrative.interpretation.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
        <div className="executive-page-rail">
          <ExecutiveSignalModule
            label="Containment signal"
            value={containment}
            support="This shows what remains unresolved, constrained, or only partially absorbed."
          />
        </div>
      </div>
    </section>
  );
}
