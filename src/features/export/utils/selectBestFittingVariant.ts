import type { CopyVariant, ExportMode, ModuleFitMode } from "../types/export";
import { measureTextBlock } from "./measureTextBlock";

const ORDER: CopyVariant[] = ["full", "medium", "compact"];

export const selectBestFittingVariant = ({
  mode,
  fitMode,
  headlineVariants,
  bodyVariants,
}: {
  mode: ExportMode;
  fitMode: ModuleFitMode;
  headlineVariants: Record<CopyVariant, string>;
  bodyVariants: Record<CopyVariant, string>;
}) => {
  for (const variant of ORDER) {
    const result = measureTextBlock({
      mode,
      fitMode,
      variant,
      headline: headlineVariants[variant],
      body: bodyVariants[variant],
    });
    if (result.fits) {
      return {
        variant,
        headline: headlineVariants[variant],
        body: bodyVariants[variant],
      };
    }
  }

  return {
    variant: "compact" as const,
    headline: headlineVariants.compact,
    body: bodyVariants.compact,
  };
};
