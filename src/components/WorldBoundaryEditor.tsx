import type { WorldDefinition } from "../types";
import { SectionAudioControl } from "./SectionAudioControl";

interface WorldBoundaryEditorProps {
  world: WorldDefinition;
  worldBoundaryContext: string;
  onChange: (world: WorldDefinition) => void;
}

export function WorldBoundaryEditor({ world, worldBoundaryContext, onChange }: WorldBoundaryEditorProps) {
  const update = <K extends keyof WorldDefinition>(key: K, value: WorldDefinition[K]) => {
    onChange({
      ...world,
      [key]: value,
    });
  };

  return (
    <section className="rounded-sm border border-edge bg-panel p-4 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted">World Boundary</p>
          <h3 className="mt-2 text-lg font-semibold text-ink">Define or inspect the bounded world</h3>
        </div>
        <SectionAudioControl
          sectionTitle="World Boundary"
          worldBoundaryContext={worldBoundaryContext}
          summary="The world boundary section defines what the model is about, where it applies, and what evidence classes are allowed."
          currentState={`It is currently representing the world named ${world.name}, in the domain ${world.domain}, across ${world.geography}, over a horizon of ${world.timeHorizonMonths} months, with governance mode ${world.governanceMode}. The declared source classes are ${(world.sourceClasses ?? []).join(", ") || "not specified"}.`}
          businessUse="A firm can use this section to confirm exactly what is in scope before acting on any signal."
          decisionGuidance="Better scoping generally leads to better decisions because the team is less likely to misuse the output outside its intended boundary."
          rawContext={[
            `World name: ${world.name}`,
            `Domain: ${world.domain}`,
            `Geography: ${world.geography}`,
            `Time horizon: ${world.timeHorizonMonths}`,
            `Governance mode: ${world.governanceMode}`,
            `Source classes: ${(world.sourceClasses ?? []).join(", ") || "not specified"}`,
            `Boundary description: ${world.boundedDescription}`,
          ]}
        />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted">World name</span>
          <input
            className="w-full rounded-sm border border-edge bg-shell px-3 py-2 text-sm text-ink placeholder:text-muted/70"
            value={world.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="Example: Capital Fragmentation Simulation"
          />
          <span className="mt-2 block text-xs text-muted">Name the bounded narrative environment you want to observe.</span>
        </label>
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted">Domain</span>
          <input
            className="w-full rounded-sm border border-edge bg-shell px-3 py-2 text-sm text-ink placeholder:text-muted/70"
            value={world.domain}
            onChange={(event) => update("domain", event.target.value)}
            placeholder="Example: Sovereign capital alignment and infrastructure governance"
          />
          <span className="mt-2 block text-xs text-muted">Describe the institutional domain or system under analysis.</span>
        </label>
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted">Geography</span>
          <input
            className="w-full rounded-sm border border-edge bg-shell px-3 py-2 text-sm text-ink placeholder:text-muted/70"
            value={world.geography}
            onChange={(event) => update("geography", event.target.value)}
            placeholder="Example: EU / Transatlantic / Bloc competition"
          />
          <span className="mt-2 block text-xs text-muted">Specify the geographic scope or jurisdictional boundary.</span>
        </label>
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted">Time horizon</span>
          <input
            className="w-full rounded-sm border border-edge bg-shell px-3 py-2 text-sm text-ink placeholder:text-muted/70"
            type="number"
            min={1}
            max={24}
            value={world.timeHorizonMonths}
            onChange={(event) => update("timeHorizonMonths", Number(event.target.value))}
            placeholder="Example: 18"
          />
          <span className="mt-2 block text-xs text-muted">Set how many months the bounded replay should cover.</span>
        </label>
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted">Governance mode</span>
          <select
            className="w-full rounded-sm border border-edge bg-shell px-3 py-2 text-sm text-ink"
            value={world.governanceMode}
            onChange={(event) => update("governanceMode", event.target.value as WorldDefinition["governanceMode"])}
          >
            <option value="Demo">Demo</option>
            <option value="Institutional">Institutional</option>
            <option value="Public-grade">Public-grade</option>
          </select>
          <span className="mt-2 block text-xs text-muted">Choose the deployment posture and oversight expectation.</span>
        </label>
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted">Source classes</span>
          <input
            className="w-full rounded-sm border border-edge bg-shell px-3 py-2 text-sm text-ink placeholder:text-muted/70"
            value={(world.sourceClasses ?? []).join(", ")}
            onChange={(event) =>
              update(
                "sourceClasses",
                event.target.value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
              )
            }
            placeholder="Example: policy, media, market, legal, infrastructure, sovereign"
          />
          <span className="mt-2 block text-xs text-muted">List the artifact classes admitted into this bounded world.</span>
        </label>
      </div>
      <label className="mt-3 block">
        <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted">Boundary description</span>
        <textarea
          className="min-h-24 w-full rounded-sm border border-edge bg-shell px-3 py-2 text-sm text-ink placeholder:text-muted/70"
          value={world.boundedDescription}
          onChange={(event) => update("boundedDescription", event.target.value)}
          placeholder="Example: A bounded Narrative World covering sovereign capital allocation, strategic autonomy policy, sanctions infrastructure, and AI industrial governance signals."
        />
        <span className="mt-2 block text-xs text-muted">State what is in scope, what is out of scope, and why this world is bounded.</span>
      </label>
    </section>
  );
}
