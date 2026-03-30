import { buildScenarioComparison } from "../../../../lib/buildScenarioComparison";
import type { BoardOnePagerContent } from "../../types/export";
import { DecisionBox } from "../primitives/DecisionBox";
import { SignalCard } from "../primitives/SignalCard";

function deltaStrength(state: "same" | "changed" | "added" | "removed") {
  switch (state) {
    case "same":
      return "Stable";
    case "changed":
      return "Shift";
    case "added":
      return "+";
    case "removed":
      return "-";
  }
}

function deltaTag(state: "same" | "changed" | "added" | "removed") {
  switch (state) {
    case "same":
      return "confirmation" as const;
    case "changed":
      return "shift" as const;
    case "added":
      return "risk" as const;
    case "removed":
      return "shift" as const;
  }
}

export function ScenarioComparisonRenderer({
  left,
  right,
}: {
  left: BoardOnePagerContent;
  right: BoardOnePagerContent;
}) {
  const comparison = buildScenarioComparison(left, right);

  return (
    <section className="scenario-comparison-shell">
      <header className="scenario-comparison-header">
        <div>
          <p className="export-meta-label">Scenario comparison</p>
          <h2 className="scenario-comparison-title">Side-by-side decision delta</h2>
        </div>
        <p className="scenario-comparison-subtitle">
          Compare dominant path, pressure, risk concentration, and required decisions.
        </p>
      </header>

      <div className="scenario-comparison-grid">
        <section className="scenario-comparison-column">
          <div className="scenario-comparison-column-header">
            <p className="export-meta-label">Scenario A</p>
            <h3>{comparison.left.title}</h3>
          </div>
          <SignalCard
            title="Dominant path"
            strength="Base case"
            insight={comparison.left.dominantPath}
            tag="confirmation"
            className="scenario-comparison-card"
          />
          <SignalCard
            title="Pressure"
            strength="Active"
            insight={comparison.left.primaryPressure}
            tag="risk"
            className="scenario-comparison-card"
          />
          <section className="scenario-comparison-list">
            <p className="export-meta-label">Risk concentration</p>
            <ul>
              {comparison.left.risks.map((risk) => (
                <li key={risk}>{risk}</li>
              ))}
            </ul>
          </section>
          <DecisionBox headline="Actions in scenario A" actions={comparison.left.decisions} className="scenario-comparison-decision" />
        </section>

        <section className="scenario-comparison-delta-column">
          <SignalCard
            title="Dominant path delta"
            strength={deltaStrength(comparison.deltas.dominantPath.state)}
            insight={comparison.deltas.dominantPath.detail}
            tag={deltaTag(comparison.deltas.dominantPath.state)}
            className="scenario-comparison-delta-card"
          />
          <SignalCard
            title="Pressure delta"
            strength={deltaStrength(comparison.deltas.primaryPressure.state)}
            insight={comparison.deltas.primaryPressure.detail}
            tag={deltaTag(comparison.deltas.primaryPressure.state)}
            className="scenario-comparison-delta-card"
          />
          <section className="scenario-comparison-list scenario-comparison-list--delta">
            <p className="export-meta-label">Risk deltas</p>
            <ul>
              {comparison.deltas.risks.map((delta, index) => (
                <li key={`${delta.state}-${delta.detail}-${index}`} className={`scenario-delta-item scenario-delta-item--${delta.state}`}>
                  <span className="scenario-delta-marker">{deltaStrength(delta.state)}</span>
                  <span>{delta.detail}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="scenario-comparison-list scenario-comparison-list--delta">
            <p className="export-meta-label">Decision deltas</p>
            <ul>
              {comparison.deltas.decisions.map((delta, index) => (
                <li key={`${delta.state}-${delta.detail}-${index}`} className={`scenario-delta-item scenario-delta-item--${delta.state}`}>
                  <span className="scenario-delta-marker">{deltaStrength(delta.state)}</span>
                  <span>{delta.detail}</span>
                </li>
              ))}
            </ul>
          </section>
        </section>

        <section className="scenario-comparison-column">
          <div className="scenario-comparison-column-header">
            <p className="export-meta-label">Scenario B</p>
            <h3>{comparison.right.title}</h3>
          </div>
          <SignalCard
            title="Dominant path"
            strength="Base case"
            insight={comparison.right.dominantPath}
            tag="confirmation"
            className="scenario-comparison-card"
          />
          <SignalCard
            title="Pressure"
            strength="Active"
            insight={comparison.right.primaryPressure}
            tag="risk"
            className="scenario-comparison-card"
          />
          <section className="scenario-comparison-list">
            <p className="export-meta-label">Risk concentration</p>
            <ul>
              {comparison.right.risks.map((risk) => (
                <li key={risk}>{risk}</li>
              ))}
            </ul>
          </section>
          <DecisionBox headline="Actions in scenario B" actions={comparison.right.decisions} className="scenario-comparison-decision" />
        </section>
      </div>
    </section>
  );
}
