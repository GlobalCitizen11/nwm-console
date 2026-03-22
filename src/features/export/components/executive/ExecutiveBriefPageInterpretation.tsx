import type { ExportSemanticData } from "../../types/export";
import { SectionTitle } from "../primitives/SectionTitle";
import { composeExecutiveNarrative } from "../../utils/composeExecutiveNarrative";
import { ExecutiveSignalModule } from "./ExecutiveSignalModule";

export function ExecutiveBriefPageInterpretation({ data }: { data: ExportSemanticData }) {
  const narrative = composeExecutiveNarrative(data.sourceState);
  const alternatePath =
    data.sourceState.alternatePaths[0] ?? "An alternate path would require structural interruption rather than rhetorical relief.";

  return (
    <section className="executive-brief-section">
      <SectionTitle title={narrative.forward.title} subtitle={narrative.forward.subtitle} />
      <div className="executive-page-grid">
        <div className="executive-page-main">
          <div className="executive-brief-prose">
            {narrative.forward.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
        <div className="executive-page-rail">
          <ExecutiveSignalModule
            label="Alternate path"
            value={alternatePath}
            support="A credible redirect would need to reopen reversibility and weaken present coordination logic."
          />
        </div>
      </div>
    </section>
  );
}
