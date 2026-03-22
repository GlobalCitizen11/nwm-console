import type { ExportSemanticData } from "../../types/export";
import { ExportHeader } from "../primitives/ExportHeader";
import { SectionTitle } from "../primitives/SectionTitle";
import { composeExecutiveNarrative } from "../../utils/composeExecutiveNarrative";

export function ExecutiveBriefPageCover({ data }: { data: ExportSemanticData }) {
  const narrative = composeExecutiveNarrative(data.sourceState);

  return (
    <>
      <ExportHeader title={data.title} subtitle={data.subtitle} metadata={data.metadata} modeLabel="Executive Brief" />
      <section className="executive-brief-section executive-brief-cover">
        <div className="executive-brief-context">
          <p><strong>Bounded world.</strong> {data.boundary}</p>
          <p><strong>System markers.</strong> {data.systemStats.map((stat) => `${stat.label}: ${stat.value}`).join(" | ")}</p>
        </div>
        <SectionTitle title={narrative.overview.title} subtitle={narrative.overview.subtitle} />
        <div className="executive-brief-prose">
          {narrative.overview.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>
    </>
  );
}
