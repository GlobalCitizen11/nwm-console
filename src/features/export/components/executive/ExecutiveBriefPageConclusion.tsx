import type { ExportSemanticData } from "../../types/export";
import { SectionTitle } from "../primitives/SectionTitle";

export function ExecutiveBriefPageConclusion({ data }: { data: ExportSemanticData }) {
  return (
    <section className="executive-brief-section executive-brief-sources">
      <SectionTitle title="Evidence anchors" subtitle="Observable anchors that currently ground the readout." />
      <div className="executive-brief-prose">
        <p>{data.evidenceAnchors.map((anchor) => anchor.support || anchor.headline).join(" ")}</p>
        <p>{data.crossDomainEffects.map((effect) => effect.support || effect.headline).join(" ")}</p>
      </div>
    </section>
  );
}
