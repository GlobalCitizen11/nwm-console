import type { ExportSemanticData } from "../../types/export";
import { SectionTitle } from "../primitives/SectionTitle";
import { composeExecutiveNarrative } from "../../utils/composeExecutiveNarrative";
import { ExecutiveSignalModule } from "./ExecutiveSignalModule";

export function ExecutiveBriefPageEvidence({ data }: { data: ExportSemanticData }) {
  const narrative = composeExecutiveNarrative(data.sourceState);
  const visibilityNeed =
    data.sourceState.visibilityNeeds[0] ?? "Visibility should stay focused on the narrow signals that can materially redirect the readout.";

  return (
    <section className="executive-brief-section">
      <SectionTitle title={narrative.positioning.title} subtitle={narrative.positioning.subtitle} />
      <div className="executive-page-grid">
        <div className="executive-page-main">
          <div className="executive-brief-prose">
            {narrative.positioning.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
        <div className="executive-page-rail">
          <ExecutiveSignalModule
            label="Watchpoint"
            value={visibilityNeed}
            support="Executive flexibility depends on seeing whether pressure is compounding or beginning to break."
          />
        </div>
      </div>
    </section>
  );
}
