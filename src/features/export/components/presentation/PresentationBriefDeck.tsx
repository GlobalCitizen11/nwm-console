import type { ExportSemanticData } from "../../types/export";
import { PresentationSlideClosing } from "./PresentationSlideClosing";
import { PresentationSlideFrame } from "./PresentationSlideFrame";
import { PresentationSlideImplications } from "./PresentationSlideImplications";
import { PresentationSlideRisk } from "./PresentationSlideRisk";
import { PresentationSlideScenarioPaths } from "./PresentationSlideScenarioPaths";
import { PresentationSlideSystemState } from "./PresentationSlideSystemState";
import { PresentationSlideTakeaways } from "./PresentationSlideTakeaways";
import { PresentationSlideTimeline } from "./PresentationSlideTimeline";
import { PresentationSlideTitle } from "./PresentationSlideTitle";

export function PresentationBriefDeck({ data }: { data: ExportSemanticData }) {
  const totalSlides = 8;
  return (
    <>
      <PresentationSlideFrame metadata={data.metadata} pageNumber={1} totalPages={totalSlides}>
        <PresentationSlideTitle data={data} />
      </PresentationSlideFrame>
      <PresentationSlideFrame metadata={data.metadata} pageNumber={2} totalPages={totalSlides}>
        <PresentationSlideSystemState data={data} />
      </PresentationSlideFrame>
      <PresentationSlideFrame metadata={data.metadata} pageNumber={3} totalPages={totalSlides}>
        <PresentationSlideTakeaways data={data} />
      </PresentationSlideFrame>
      <PresentationSlideFrame metadata={data.metadata} pageNumber={4} totalPages={totalSlides}>
        <PresentationSlideTimeline data={data} />
      </PresentationSlideFrame>
      <PresentationSlideFrame metadata={data.metadata} pageNumber={5} totalPages={totalSlides}>
        <PresentationSlideImplications data={data} />
      </PresentationSlideFrame>
      <PresentationSlideFrame metadata={data.metadata} pageNumber={6} totalPages={totalSlides}>
        <PresentationSlideScenarioPaths data={data} />
      </PresentationSlideFrame>
      <PresentationSlideFrame metadata={data.metadata} pageNumber={7} totalPages={totalSlides}>
        <PresentationSlideRisk data={data} />
      </PresentationSlideFrame>
      <PresentationSlideFrame metadata={data.metadata} pageNumber={8} totalPages={totalSlides}>
        <PresentationSlideClosing data={data} />
      </PresentationSlideFrame>
    </>
  );
}
