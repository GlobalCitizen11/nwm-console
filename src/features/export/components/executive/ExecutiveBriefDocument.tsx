import type { ExportSemanticData } from "../../types/export";
import { ExportPage } from "../primitives/ExportPage";
import { ExecutiveBriefPageConclusion } from "./ExecutiveBriefPageConclusion";
import { ExecutiveBriefPageCover } from "./ExecutiveBriefPageCover";
import { ExecutiveBriefPageEvidence } from "./ExecutiveBriefPageEvidence";
import { ExecutiveBriefPageInterpretation } from "./ExecutiveBriefPageInterpretation";
import { ExecutiveBriefPageTakeaways } from "./ExecutiveBriefPageTakeaways";
import { ExecutiveBriefPageTimeline } from "./ExecutiveBriefPageTimeline";

export function ExecutiveBriefDocument({ data }: { data: ExportSemanticData }) {
  const pages = [
    { id: "cover", render: () => <ExecutiveBriefPageCover data={data} /> },
    { id: "development", render: () => <ExecutiveBriefPageTakeaways data={data} /> },
    { id: "interpretation", render: () => <ExecutiveBriefPageTimeline data={data} /> },
    { id: "forward", render: () => <ExecutiveBriefPageInterpretation data={data} /> },
    { id: "positioning", render: () => <ExecutiveBriefPageEvidence data={data} /> },
    { id: "evidence", render: () => <ExecutiveBriefPageConclusion data={data} /> },
  ];

  const totalPages = 6;

  return (
    <>
      {pages.map((page, index) => (
        <ExportPage key={page.id} metadata={data.metadata} pageNumber={index + 1} totalPages={totalPages} className="executive-brief-page">
          {page.render()}
        </ExportPage>
      ))}
    </>
  );
}
