import type { ExportMode, ExportTimelineItem } from "../../types/export";
import { renderSafeCopy } from "../../utils/renderSafeCopy";

export function TimelineEventCard({ item, mode = "executive-brief" }: { item: ExportTimelineItem; mode?: ExportMode }) {
  const safeCopy = renderSafeCopy({
    mode,
    fitMode: "timeline",
    item,
  });
  return (
    <div className="timeline-event-card no-clip-typography">
      <div className="timeline-phase">{item.phase}</div>
      <div className="timeline-body">
        <h4 className="signal-module-value">{safeCopy.headline}</h4>
        <p className="signal-module-support">{safeCopy.body}</p>
      </div>
    </div>
  );
}
