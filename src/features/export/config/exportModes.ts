import type { ExportMode } from "../types/export";

export const exportModes: { id: ExportMode; label: string; description: string }[] = [
  {
    id: "executive-brief",
    label: "Executive Brief",
    description: "Multi-page strategic report for executive and sovereign stakeholders.",
  },
  {
    id: "presentation-brief",
    label: "Presentation Brief",
    description: "Slide-based narrative deck for meetings, walkthroughs, and presentations.",
  },
  {
    id: "board-onepager",
    label: "Board One-Pager",
    description: "Single-page decision-ready strategic intelligence snapshot.",
  },
];
