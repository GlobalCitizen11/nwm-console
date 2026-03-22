import type { BriefingState } from "../../../types";

type NarrativeSection = {
  title: string;
  subtitle?: string;
  paragraphs: string[];
};

export type ExecutiveNarrative = {
  overview: NarrativeSection;
  development: NarrativeSection;
  interpretation: NarrativeSection;
  forward: NarrativeSection;
  positioning: NarrativeSection;
  evidence: {
    intro: string;
    bullets: string[];
  };
};

const sentence = (text: string) => text.replace(/\s+/g, " ").trim().replace(/[.]+$/, "");

const joinList = (items: string[]) => {
  if (items.length === 0) return "";
  if (items.length === 1) return sentence(items[0]);
  if (items.length === 2) return `${sentence(items[0])} and ${sentence(items[1])}`;
  return `${items.slice(0, -1).map(sentence).join(", ")}, and ${sentence(items[items.length - 1] ?? "")}`;
};

const firstTwo = (items: string[]) => items.filter(Boolean).slice(0, 2);
const firstThree = (items: string[]) => items.filter(Boolean).slice(0, 3);
const clause = (text: string) => sentence(text).replace(/[.]+$/, "");

export const composeExecutiveNarrative = (state: BriefingState): ExecutiveNarrative => {
  const earlySignals = firstTwo(state.earlySignals);
  const systemicUptake = firstTwo(state.systemicUptake);
  const latestDevelopments = firstTwo(state.latestDevelopments);
  const pressures = firstTwo(state.pressurePoints);
  const crossDomain = firstTwo(state.crossDomainEffects);
  const stability = firstTwo(state.stabilitySignals);
  const sensitivities = firstTwo(state.sensitivities);
  const visibilityNeeds = firstTwo(state.visibilityNeeds);
  const priorities = firstTwo(state.priorities);
  const alternates = firstTwo(state.alternatePaths);
  const anchors = firstThree(state.signalAnchors);
  const boundedPressure = joinList(pressures) || "the infrastructure and coordination channels now carrying the most weight";
  const boundedCrossDomain = joinList(crossDomain) || "adjacent domains are now reinforcing the same operating logic";
  const boundedStability = joinList(stability) || "some edges of the system still resist full propagation";
  const strainedAssumptions = joinList(sensitivities) || "older assumptions about easy normalization and loose coordination";
  const watchpoints = joinList(visibilityNeeds) || "whether the same pressure channels continue to compound without interruption";

  return {
    overview: {
      title: "System state overview",
      subtitle: "What condition now governs the bounded world.",
      paragraphs: [
        `${sentence(state.currentCondition)} This now functions as a ${state.phase.toLowerCase()} environment in which narrative density is ${state.narrativeDensity}, structural momentum is ${state.structuralMomentum}, and the system is absorbing new developments into a more durable operating condition rather than treating them as isolated shocks.`,
        `${sentence(state.structuralShift)} Pressure is concentrating through ${boundedPressure}, which changes how the environment processes new information and leaves ${strainedAssumptions} under strain. Assumptions that depended on rapid normalization, loose coordination, or easy reversal no longer hold because the system is now transmitting pressure as routine behavior rather than episodic disturbance.`,
      ],
    },
    development: {
      title: "Narrative development",
      subtitle: "How signal accumulation turned into system reconfiguration.",
      paragraphs: [
        `${joinList(earlySignals) || "The earliest meaningful signals appeared at the edge of the bounded world"} mattered because they showed that the prior regime was losing explanatory power. Those signals were important not for volume alone, but because they revealed where the system would start repricing coordination, authority, and infrastructure access.`,
        `${joinList(systemicUptake) || "Those early signals then spread across institutions and adjacent domains"} and widened the number of actors forced to respond. As uptake broadened, pressure stopped behaving like commentary and started changing allocation, posture, and coordination decisions across the boundary.`,
        `${joinList(latestDevelopments) || "The latest developments pushed the environment into its current form"} and mark the difference between an emerging pattern and an operating condition. This moment is different because the system is no longer debating whether the pressure is credible; it is reorganizing around the expectation that the pressure will persist.`,
      ],
    },
    interpretation: {
      title: "Structural interpretation",
      subtitle: "What the sequence means at the system level.",
      paragraphs: [
        `The sequence points to a transition from contested interpretation into governed structural behavior. The key fact is not only that pressure has intensified, but that it is now moving through persistence, coordination, and declining reversibility, which is what gives the present state its staying power and shifts the world from reaction into reclassification.`,
        `${boundedCrossDomain}, while ${boundedStability} show where the read has not fully propagated. The environment is therefore neither chaotic nor resolved: it is narrowing around a smaller set of governing assumptions, with containment still visible at some edges but no longer strong enough to reset the whole system.`,
      ],
    },
    forward: {
      title: "Forward orientation",
      subtitle: "What the current trajectory favors and what could redirect it.",
      paragraphs: [
        `${sentence(state.primaryPath)} The next condition would deepen the current regime by making today’s governing logic harder to contest and more expensive to reverse. Under that path, the system would begin to treat present pressures as baseline operating conditions rather than as exceptional developments.`,
        `${joinList(alternates) || "An alternate path would require a visible interruption in the current sequence"} and that interruption would need to be structural rather than rhetorical. It would require evidence that the current coordination logic is weakening, that reversibility has reopened, and that pressure has stopped compounding through the same channels that now sustain the readout.`,
      ],
    },
    positioning: {
      title: "Strategic positioning",
      subtitle: "How the situation should be approached.",
      paragraphs: [
        `What matters most now is ${joinList(priorities) || "holding position against the system’s most active structural pressures"}. Risk is concentrated where the current state intersects with ${joinList(sensitivities) || "the most exposed dependencies"}, because those are the points at which the environment can impose cost, force re-timing, or narrow decision room most quickly.`,
        `${watchpoints} because flexibility now depends on seeing whether pressure is still compounding or whether a credible interruption is finally emerging. The appropriate posture is disciplined rather than reactive: preserve room to move, maintain visibility into the narrow signals that can change the read, and do not assume the system will self-correct without a material shift in structure.`,
      ],
    },
    evidence: {
      intro: `The current readout rests on a narrow evidence base that shows the system moving through observable institutional, narrative, and coordination anchors rather than through isolated commentary alone.`,
      bullets: anchors.length
        ? anchors.map((item) => `${clause(item)}.`)
        : [
            `${clause(state.currentCondition)}.`,
            `${clause(state.structuralShift)}.`,
            `${clause(state.primaryPath)}.`,
          ],
    },
  };
};
