import type { ExportSemanticData } from "../../types/export";
import { ExportPage } from "../primitives/ExportPage";
import { ExecutiveBriefPageConclusion } from "./ExecutiveBriefPageConclusion";
import { ExecutiveBriefPageCover } from "./ExecutiveBriefPageCover";
import { ExecutiveBriefPageEvidence } from "./ExecutiveBriefPageEvidence";
import { ExecutiveBriefPageInterpretation } from "./ExecutiveBriefPageInterpretation";
import { ExecutiveBriefPageTakeaways } from "./ExecutiveBriefPageTakeaways";
import { ExecutiveBriefPageTimeline } from "./ExecutiveBriefPageTimeline";

export function ExecutiveBriefDocument({ data }: { data: ExportSemanticData }) {
  const totalPages = 6;
  return (
    <>
      <ExportPage metadata={data.metadata} pageNumber={1} totalPages={totalPages}>
        <ExecutiveBriefPageCover data={data} />
      </ExportPage>
      <ExportPage metadata={data.metadata} pageNumber={2} totalPages={totalPages}>
        <ExecutiveBriefPageTakeaways data={data} />
      </ExportPage>
      <ExportPage metadata={data.metadata} pageNumber={3} totalPages={totalPages}>
        <ExecutiveBriefPageTimeline data={data} />
      </ExportPage>
      <ExportPage metadata={data.metadata} pageNumber={4} totalPages={totalPages}>
        <ExecutiveBriefPageInterpretation data={data} />
      </ExportPage>
      <ExportPage metadata={data.metadata} pageNumber={5} totalPages={totalPages}>
        <ExecutiveBriefPageEvidence data={data} />
      </ExportPage>
      <ExportPage metadata={data.metadata} pageNumber={6} totalPages={totalPages}>
        <ExecutiveBriefPageConclusion data={data} />
      </ExportPage>
    </>
  );
}
