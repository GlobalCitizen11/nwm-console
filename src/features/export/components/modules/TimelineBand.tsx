import type { ExportMode, ExportTimelineItem } from "../../types/export";
import { TimelineEventCard } from "./TimelineEventCard";

export function TimelineBand({ items, mode = "executive-brief" }: { items: ExportTimelineItem[]; mode?: ExportMode }) {
  return (
    <div className="timeline-band">
      {items.map((item) => (
        <TimelineEventCard key={item.id} item={item} mode={mode} />
      ))}
    </div>
  );
}
