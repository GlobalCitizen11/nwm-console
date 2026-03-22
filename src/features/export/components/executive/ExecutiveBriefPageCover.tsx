import type { ExportSemanticData } from "../../types/export";
import { ExportHeader } from "../primitives/ExportHeader";
import { SectionTitle } from "../primitives/SectionTitle";
import { composeExecutiveNarrative } from "../../utils/composeExecutiveNarrative";
import { CompactSignalStrip } from "./CompactSignalStrip";
import { ExecutiveSignalModule } from "./ExecutiveSignalModule";

export function ExecutiveBriefPageCover({ data }: { data: ExportSemanticData }) {
  const narrative = composeExecutiveNarrative(data.sourceState);
  const primaryPressure = data.sourceState.pressurePoints[0] ?? "Pressure remains concentrated inside the active boundary.";

  return (
    <>
      <ExportHeader title={data.title} subtitle={data.subtitle} metadata={data.metadata} modeLabel="Executive Brief" />
      <section className="executive-brief-section executive-brief-cover">
        <p className="executive-bounded-world-line">
          <span>Bounded world</span>
          <strong>{data.metadata.boundedWorld}</strong>
        </p>
        <CompactSignalStrip data={data} />
        <div className="executive-brief-context">
          <p>{data.boundary}</p>
        </div>
        <SectionTitle title={narrative.overview.title} subtitle={narrative.overview.subtitle} />
        <div className="executive-page-grid">
          <div className="executive-page-main">
            <div className="executive-brief-prose executive-brief-prose--hero">
              {narrative.overview.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
          <div className="executive-page-rail">
            <ExecutiveSignalModule
              label="Primary pressure"
              value={primaryPressure}
              support="This channel is now shaping coordination, timing, and decision room."
            />
          </div>
        </div>
      </section>
    </>
  );
}
