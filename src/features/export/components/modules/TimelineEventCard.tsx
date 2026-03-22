import type { ExportTimelineItem } from "../../types/export";

export function TimelineEventCard({ item }: { item: ExportTimelineItem }) {
  return (
    <div className="timeline-event-card">
      <div className="timeline-phase">{item.phase}</div>
      <div className="timeline-body">
        <h4>{item.summary}</h4>
        <p>{item.significance}</p>
      </div>
    </div>
  );
}
