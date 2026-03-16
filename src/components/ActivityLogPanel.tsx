import type { ActivityLogEntry } from "../types";

interface ActivityLogPanelProps {
  entries: ActivityLogEntry[];
  onClear: () => void;
}

export function ActivityLogPanel({ entries, onClear }: ActivityLogPanelProps) {
  return (
    <section className="surface-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="section-kicker">Activity Log</p>
          <p className="mt-2 text-sm text-muted">
            Local audit trail for imports, exports, proof review changes, and view transitions.
          </p>
        </div>
        <button className="action-button" onClick={onClear}>
          Clear Log
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {entries.length > 0 ? (
          entries.map((entry) => (
            <div key={entry.id} className="surface-panel-subtle p-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink">{entry.subject}</span>
                <span className="text-muted">{entry.timestamp}</span>
              </div>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted">{entry.action}</p>
              <p className="mt-2 text-sm text-muted">{entry.detail}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted">No activity recorded yet.</p>
        )}
      </div>
    </section>
  );
}
