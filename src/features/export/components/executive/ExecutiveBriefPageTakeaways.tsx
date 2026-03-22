import type { ExportSemanticData } from "../../types/export";
import { SectionTitle } from "../primitives/SectionTitle";
import { composeExecutiveNarrative } from "../../utils/composeExecutiveNarrative";
import { ExecutiveSignalModule } from "./ExecutiveSignalModule";

export function ExecutiveBriefPageTakeaways({ data }: { data: ExportSemanticData }) {
  const narrative = composeExecutiveNarrative(data.sourceState);
  const crossDomain = data.sourceState.crossDomainEffects[0] ?? "Signal transmission is now crossing institutional and narrative boundaries.";

  return (
    <section className="executive-brief-section">
      <SectionTitle title={narrative.development.title} subtitle={narrative.development.subtitle} />
      <div className="executive-page-grid">
        <div className="executive-page-main">
          <div className="executive-brief-prose">
            {narrative.development.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
        <div className="executive-page-rail">
          <ExecutiveSignalModule
            label="Cross-domain spread"
            value={crossDomain}
            support="The system has moved from isolated signal formation into broader uptake."
          />
        </div>
      </div>
    </section>
  );
}
