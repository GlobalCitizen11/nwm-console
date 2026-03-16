import type { CounterfactualScenario, NarrativeEvent, SimulationResult, WorldDefinition } from "../types";
import { runWorldSimulation } from "./stateEngine";

const scaleEvent = (event: NarrativeEvent, multiplier: number): NarrativeEvent => ({
  ...event,
  metrics: {
    velocity: Number((event.metrics.velocity * multiplier).toFixed(1)),
    density: Number((event.metrics.density * multiplier).toFixed(1)),
    coherence: Number((event.metrics.coherence * (0.8 + multiplier * 0.2)).toFixed(1)),
    reversibility: Number(
      Math.min(100, event.metrics.reversibility + (1 - multiplier) * 18).toFixed(1),
    ),
  },
});

export const applyCounterfactual = (
  events: NarrativeEvent[],
  scenario: CounterfactualScenario,
): NarrativeEvent[] => {
  // Demo sandbox mutation point. A future intervention engine can plug in here with bounded policy controls.
  if (scenario.length === 0) {
    return events;
  }

  return scenario.reduce((currentEvents, operation) => {
    return currentEvents
      .map((event) => {
        if (event.id !== operation.eventId) {
          return event;
        }
        if (operation.mode === "remove") {
          return null;
        }
        if (operation.mode === "delay") {
          return {
            ...event,
            month: event.month + operation.delayMonths,
            label: `${event.label}*`,
            title: `${event.title} (Delayed ${operation.delayMonths}m)`,
          };
        }
        return scaleEvent(event, operation.strengthMultiplier);
      })
      .filter((event): event is NarrativeEvent => Boolean(event))
      .sort((left, right) => left.month - right.month);
  }, events);
};

export const runCounterfactualSimulation = (
  world: WorldDefinition,
  events: NarrativeEvent[],
  scenario: CounterfactualScenario,
): SimulationResult => {
  const mutatedEvents = applyCounterfactual(events, scenario);
  return runWorldSimulation(world, mutatedEvents);
};
