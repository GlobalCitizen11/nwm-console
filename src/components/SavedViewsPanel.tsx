import type { ViewSnapshot } from "../types";

interface SavedViewsPanelProps {
  currentView: Omit<ViewSnapshot, "id" | "name">;
  savedViews: ViewSnapshot[];
  onSave: () => void;
  onLoad: (view: ViewSnapshot) => void;
  onDelete: (viewId: string) => void;
}

export function SavedViewsPanel({
  currentView,
  savedViews,
  onSave,
  onLoad,
  onDelete,
}: SavedViewsPanelProps) {
  return (
    <section className="surface-panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="section-kicker">Saved Views</p>
          <p className="mt-2 text-sm text-muted">
            Save a scenario, role, month, comparison target, and selected object for later recall.
          </p>
        </div>
        <button className="action-button" onClick={onSave}>
          Save Current View
        </button>
      </div>

      <div className="surface-panel-subtle mt-4 p-4 text-sm text-muted">
        <p>Current scenario: <span className="text-ink">{currentView.scenarioId}</span></p>
        <p className="mt-2">Current role: <span className="text-ink">{currentView.role}</span></p>
        <p className="mt-2">Current month: <span className="text-ink">{currentView.month}</span></p>
      </div>

      <div className="mt-4 space-y-2">
        {savedViews.length > 0 ? (
          savedViews.map((view) => (
            <div key={view.id} className="surface-panel-subtle flex items-center justify-between gap-3 p-3">
              <div className="text-sm">
                <p className="text-ink">{view.name}</p>
                <p className="mt-1 text-muted">{view.scenarioId} | {view.role} | M{view.month}</p>
              </div>
              <div className="flex gap-2">
                <button className="action-button" onClick={() => onLoad(view)}>
                  Load
                </button>
                <button className="action-button" onClick={() => onDelete(view.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted">No saved views yet.</p>
        )}
      </div>
    </section>
  );
}
