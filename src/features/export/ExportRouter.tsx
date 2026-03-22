import type { ExportMode, ExportSemanticData } from "./types/export";
import { BoardOnePagerDocument } from "./components/board/BoardOnePagerDocument";
import { ExecutiveBriefDocument } from "./components/executive/ExecutiveBriefDocument";
import { PresentationBriefDeck } from "./components/presentation/PresentationBriefDeck";

export function ExportRouter({ mode, data }: { mode: ExportMode; data: ExportSemanticData }) {
  switch (mode) {
    case "executive-brief":
      return <ExecutiveBriefDocument data={data} />;
    case "presentation-brief":
      return <PresentationBriefDeck data={data} />;
    case "board-onepager":
      return <BoardOnePagerDocument data={data} />;
  }
}
