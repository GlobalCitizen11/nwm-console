interface DeploymentBannerProps {
  scenarioLabel: string;
  compareLabel?: string | null;
}

export function DeploymentBanner({ scenarioLabel, compareLabel }: DeploymentBannerProps) {
  return (
    <section className="surface-panel border-phaseOrange/40 bg-panel">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="section-kicker text-phaseOrange">Deployment Posture</p>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted">
            Institutional console running against local seeded scenarios. This environment is optimized for auditability,
            operator briefing, and bounded scenario review rather than external deployment.
          </p>
        </div>
        <div className="grid gap-2 text-sm lg:min-w-[320px]">
          <div className="surface-panel-subtle border-phaseOrange/30 bg-shell/70">
            <span className="text-muted">Active scenario</span>
            <span className="ml-2 text-ink">{scenarioLabel}</span>
          </div>
          {compareLabel ? (
            <div className="surface-panel-subtle border-edge/80 bg-shell/70">
              <span className="text-muted">Comparison target</span>
              <span className="ml-2 text-ink">{compareLabel}</span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
