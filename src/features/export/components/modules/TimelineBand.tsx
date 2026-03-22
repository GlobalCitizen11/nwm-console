import type { ExportTimelineItem } from "../../types/export";
import { TimelineEventCard } from "./TimelineEventCard";

export function TimelineBand({ items }: { items: ExportTimelineItem[] }) {
  return (
    <div className="timeline-band">
      {items.map((item) => (
        <TimelineEventCard key={item.id} item={item} />
      ))}
    </div>
  );
}
