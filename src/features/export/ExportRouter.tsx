import type { ExportContentByMode, ExportMode } from "./types/export";
import { BoardOnePagerDocument } from "./components/board/BoardOnePagerDocument";
import { ExecutiveBriefDocument } from "./components/executive/ExecutiveBriefDocument";
import { PresentationBriefDeck } from "./components/presentation/PresentationBriefDeck";

export function ExportRouter({ mode, contentByMode }: { mode: ExportMode; contentByMode: ExportContentByMode }) {
  switch (mode) {
    case "executive-brief":
      return <ExecutiveBriefDocument content={contentByMode["executive-brief"]} />;
    case "presentation-brief":
      return <PresentationBriefDeck content={contentByMode["presentation-brief"]} />;
    case "board-onepager":
      return <BoardOnePagerDocument content={contentByMode["board-onepager"]} />;
  }
}
