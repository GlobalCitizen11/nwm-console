interface AutoDemoPanelProps {
  open: boolean;
  active: boolean;
  paused: boolean;
  minimized: boolean;
  stepIndex: number;
  totalSteps: number;
  stepTitles: string[];
  stepTitle: string | null;
  stepDescription: string | null;
  scriptId: string;
  speed: string;
  onClose: () => void;
  onExpand: () => void;
  onMinimize: () => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onStepJump: (stepIndex: number) => void;
  onScriptChange: (scriptId: string) => void;
  onSpeedChange: (speed: string) => void;
}

export function AutoDemoPanel({
  open,
  active,
  paused,
  minimized,
  stepIndex,
  totalSteps,
  stepTitles,
  stepTitle,
  stepDescription,
  scriptId,
  speed,
  onClose,
  onExpand,
  onMinimize,
  onStart,
  onPause,
  onResume,
  onStop,
  onStepBack,
  onStepForward,
  onStepJump,
  onScriptChange,
  onSpeedChange,
}: AutoDemoPanelProps) {
  if (!open) {
    return null;
  }

  if (minimized) {
    return (
      <section className="surface-panel fixed bottom-5 right-5 z-40 w-[320px]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="section-kicker">Guided Walkthrough</p>
            <p className="truncate text-sm font-medium text-ink">
              {stepTitle ?? "Walkthrough running"}
            </p>
            <p className="mt-1 text-xs text-muted">
              {active ? (paused ? "Paused" : "Running") : "Idle"} · Step {Math.min(stepIndex + 1, totalSteps)} of {totalSteps}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="action-button" onClick={onExpand}>
              Expand
            </button>
            <button className="action-button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="surface-panel fixed bottom-5 right-5 z-40 max-w-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="section-kicker">Guided Walkthrough</p>
          <h3 className="section-title">{stepTitle ?? "Walkthrough controls"}</h3>
          <p className="mt-2 text-sm text-muted">
            {stepDescription ?? "Move through the scripted walkthrough at your own pace, or let the active sequence advance automatically."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="action-button" onClick={onMinimize}>
            Minimize
          </button>
          <button className="action-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted">
        <span>Status: <span className="text-ink">{active ? (paused ? "Paused" : "Running") : "Idle"}</span></span>
        <span>
          Step <span className="text-ink">{Math.min(stepIndex + 1, totalSteps)}</span> of{" "}
          <span className="text-ink">{totalSteps}</span>
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="control-stack">
          <span className="control-label">Walkthrough script</span>
          <select className="control-input" value={scriptId} onChange={(event) => onScriptChange(event.target.value)}>
            <option value="executive">Executive walkthrough</option>
            <option value="full">Full walkthrough</option>
            <option value="commercial">External overview</option>
          </select>
        </label>
        <label className="control-stack">
          <span className="control-label">Pace</span>
          <select className="control-input" value={speed} onChange={(event) => onSpeedChange(event.target.value)}>
            <option value="slow">Slow</option>
            <option value="standard">Standard</option>
            <option value="fast">Fast</option>
          </select>
        </label>
      </div>

      <div className="mt-4 h-2 rounded-full bg-edge/80">
        <div
          className="h-full rounded-full bg-phaseYellow transition-all"
          style={{ width: `${((stepIndex + (active ? 1 : 0)) / Math.max(1, totalSteps)) * 100}%` }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!active ? <button className="action-button" onClick={onStart}>Start Walkthrough</button> : null}
        {active && !paused ? <button className="action-button" onClick={onPause}>Pause</button> : null}
        {active && paused ? <button className="action-button" onClick={onResume}>Resume</button> : null}
        <button className="action-button" onClick={onStepBack} disabled={stepIndex <= 0}>
          Step Back
        </button>
        <button className="action-button" onClick={onStepForward} disabled={stepIndex >= totalSteps - 1}>
          Step Forward
        </button>
        {active ? <button className="action-button" onClick={onStop}>Stop</button> : null}
      </div>

      <div className="mt-5 border-t border-edge/70 pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Jump to step</p>
          <span className="text-xs text-muted">Direct section navigation</span>
        </div>
        <div className="mt-3 grid max-h-48 gap-2 overflow-y-auto pr-1">
          {stepTitles.map((title, index) => (
            <button
              key={`${title}-${index}`}
              className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                index === stepIndex
                  ? "border-phaseYellow bg-shell text-ink"
                  : "border-edge/70 text-muted hover:border-edge hover:text-ink"
              }`}
              onClick={() => onStepJump(index)}
            >
              <span className="text-xs uppercase tracking-[0.14em] text-muted">Step {index + 1}</span>
              <span className="mt-1 block text-sm text-inherit">{title}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
