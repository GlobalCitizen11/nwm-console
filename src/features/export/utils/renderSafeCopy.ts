import type { CopyVariant, ExportInsight, ExportMode, ExportTimelineItem, ModuleFitMode } from "../types/export";
import { selectBestFittingVariant } from "./selectBestFittingVariant";

type CopyVariants = {
  headlineVariants: Record<CopyVariant, string>;
  bodyVariants: Record<CopyVariant, string>;
};

const fallbackVariants = (headline: string, body: string): CopyVariants => ({
  headlineVariants: {
    full: headline,
    medium: headline,
    compact: headline,
  },
  bodyVariants: {
    full: body,
    medium: body,
    compact: body,
  },
});

export const renderSafeCopy = ({
  mode,
  fitMode,
  item,
}: {
  mode: ExportMode;
  fitMode: ModuleFitMode;
  item: Pick<ExportInsight, "headline" | "support" | "headlineVariants" | "bodyVariants"> | Pick<ExportTimelineItem, "summary" | "significance" | "summaryVariants" | "significanceVariants">;
}) => {
  const isTimeline = "summary" in item;
  const variants = isTimeline
    ? {
        headlineVariants: item.summaryVariants ?? fallbackVariants(item.summary, item.significance).headlineVariants,
        bodyVariants: item.significanceVariants ?? fallbackVariants(item.summary, item.significance).bodyVariants,
      }
    : {
        headlineVariants: item.headlineVariants ?? fallbackVariants(item.headline, item.support).headlineVariants,
        bodyVariants: item.bodyVariants ?? fallbackVariants(item.headline, item.support).bodyVariants,
      };

  return selectBestFittingVariant({
    mode,
    fitMode,
    headlineVariants: variants.headlineVariants,
    bodyVariants: variants.bodyVariants,
  });
};
