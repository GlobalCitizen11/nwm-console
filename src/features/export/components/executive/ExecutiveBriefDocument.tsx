import type { ExportSemanticData } from "../../types/export";
import { ExportPage } from "../primitives/ExportPage";
import { ExecutiveBriefPageConclusion } from "./ExecutiveBriefPageConclusion";
import { ExecutiveBriefPageCover } from "./ExecutiveBriefPageCover";
import { ExecutiveBriefPageEvidence } from "./ExecutiveBriefPageEvidence";
import { ExecutiveBriefPageInterpretation } from "./ExecutiveBriefPageInterpretation";
import { ExecutiveBriefPageTakeaways } from "./ExecutiveBriefPageTakeaways";
import { ExecutiveBriefPageTimeline } from "./ExecutiveBriefPageTimeline";

const hasItems = (items: unknown[] | undefined) => Boolean(items && items.length > 0);

export function ExecutiveBriefDocument({ data }: { data: ExportSemanticData }) {
  const pages = [
    {
      id: "cover",
      isVisible: true,
      render: () => <ExecutiveBriefPageCover data={data} />,
    },
    {
      id: "takeaways",
      isVisible: hasItems(data.scenarioPaths) || hasItems(data.keyInsights) || hasItems(data.implications),
      render: () => <ExecutiveBriefPageTakeaways data={data} />,
    },
    {
      id: "timeline",
      isVisible: hasItems(data.timeline),
      render: () => <ExecutiveBriefPageTimeline data={data} />,
    },
    {
      id: "interpretation",
      isVisible: hasItems(data.implications) || hasItems(data.monitoringPriorities) || hasItems(data.risks),
      render: () => <ExecutiveBriefPageInterpretation data={data} />,
    },
    {
      id: "evidence",
      isVisible: hasItems(data.evidenceAnchors) || hasItems(data.crossDomainEffects) || hasItems(data.containmentSignals),
      render: () => <ExecutiveBriefPageEvidence data={data} />,
    },
    {
      id: "conclusion",
      isVisible: Boolean(data.closingSynthesis) || hasItems(data.crossDomainEffects) || hasItems(data.containmentSignals),
      render: () => <ExecutiveBriefPageConclusion data={data} />,
    },
  ].filter((page) => page.isVisible);

  const totalPages = pages.length;

  return (
    <>
      {pages.map((page, index) => (
        <ExportPage key={page.id} metadata={data.metadata} pageNumber={index + 1} totalPages={totalPages}>
          {page.render()}
        </ExportPage>
      ))}
    </>
  );
}
