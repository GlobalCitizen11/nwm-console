import type { ExportSemanticData } from "../../types/export";
import { SectionTitle } from "../primitives/SectionTitle";
import { composeExecutiveNarrative } from "../../utils/composeExecutiveNarrative";

export function ExecutiveBriefPageConclusion({ data }: { data: ExportSemanticData }) {
  const narrative = composeExecutiveNarrative(data.sourceState);

  return (
    <section className="executive-brief-section executive-brief-sources">
      <SectionTitle title="Evidence anchors" subtitle="Observable anchors that ground the current readout." />
      <div className="executive-brief-prose executive-brief-prose--evidence">
        <p>{narrative.evidence.intro}</p>
        <ul className="executive-evidence-list">
          {narrative.evidence.bullets.slice(0, 3).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
