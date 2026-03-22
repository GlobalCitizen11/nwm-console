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
};

const sentence = (text: string) => text.replace(/\s+/g, " ").trim().replace(/[.]+$/, "");

const joinList = (items: string[]) => {
  if (items.length === 0) return "";
  if (items.length === 1) return sentence(items[0]);
  if (items.length === 2) return `${sentence(items[0])} and ${sentence(items[1])}`;
  return `${items.slice(0, -1).map(sentence).join(", ")}, and ${sentence(items[items.length - 1] ?? "")}`;
};

const firstTwo = (items: string[]) => items.filter(Boolean).slice(0, 2);

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

  return {
    overview: {
      title: "System state overview",
      subtitle: "What condition now governs the bounded world.",
      paragraphs: [
        `${sentence(state.currentCondition)} The environment now behaves as a ${state.phase.toLowerCase()} system in which narrative density is ${state.narrativeDensity} and structural momentum is ${state.structuralMomentum}. Reversibility has moved to a ${state.reversibility} condition, which means the world is no longer reacting to isolated artifacts and is instead absorbing them into a more persistent operating logic.`,
        `${sentence(state.structuralShift)} Pressure is concentrating through ${joinList(pressures) || "the most active structural drivers"}, which changes how the system responds to new information and weakens assumptions that depended on rapid normalization, loose coordination, or easy reversal. The earlier expectation that stress could remain compartmentalized no longer holds because pressure is now moving through the boundary as a system behavior rather than as a temporary disturbance.`,
      ],
    },
    development: {
      title: "Narrative development",
      subtitle: "How signal accumulation turned into system reconfiguration.",
      paragraphs: [
        `${joinList(earlySignals) || "The earliest meaningful signals appeared at the edge of the bounded world"} mattered because they established the first credible evidence that the environment was no longer behaving as a stable extension of the prior regime. Those signals introduced a new logic into the system and gave later developments a structure to attach to, which is why they carried more weight than isolated noise.`,
        `${joinList(systemicUptake) || "Those initial signals then spread across institutions and adjacent domains"} and changed how actors oriented themselves inside the world. As uptake broadened, the system stopped treating those developments as exceptions and began reorganizing around them, which is how pressure moved from observation to coordination, and from coordination to structural consequence.`,
        `${joinList(latestDevelopments) || "The most recent developments pushed the system into its current state"} and made this moment qualitatively different from the earlier intervals. The environment is no longer defined by whether the pressure is real; it is defined by how deeply that pressure now shapes expectations, coordination, and the available paths forward.`,
      ],
    },
    interpretation: {
      title: "Structural interpretation",
      subtitle: "What the sequence means at the system level.",
      paragraphs: [
        `This sequence indicates a transition in which the world is moving from contested interpretation to governed structural behavior. ${sentence(state.primaryPath)} The important fact is not only that pressure has risen, but that it is now behaving through coordination, persistence, and declining reversibility, which is what gives the current state its staying power.`,
        `${joinList(crossDomain) || "Cross-domain effects are now visible across the bounded world"}, while ${joinList(stability) || "some stabilizing edges still remain"} show where the read has not fully propagated. That combination means the system is neither chaotic nor resolved; it is reclassifying around a narrower set of assumptions, with containment still possible in some edges but no longer strong enough to reset the whole environment.`,
      ],
    },
    forward: {
      title: "Forward orientation",
      subtitle: "What the current trajectory favors and what could redirect it.",
      paragraphs: [
        `${sentence(state.primaryPath)} If the current trajectory continues, the next condition will not merely extend the present state; it will deepen it by making today’s structural logic harder to contest and more expensive to reverse. The system would then treat current pressures as baseline operating conditions rather than as exceptional events.`,
        `${joinList(alternates) || "An alternate path would require a visible interruption in the current sequence"} and that interruption would need to come from more than rhetoric or short-term relief. It would require evidence that the present coordination logic has weakened, that reversibility has reopened, and that pressure has stopped compounding through the same structural channels.`,
      ],
    },
    positioning: {
      title: "Strategic positioning",
      subtitle: "How the situation should be approached.",
      paragraphs: [
        `What matters most now is ${joinList(priorities) || "maintaining position against the system’s most active structural pressures"}. Risk is concentrated where the current state intersects with ${joinList(sensitivities) || "the most exposed dependencies"}, because those are the points at which the environment can impose cost, force re-timing, or narrow decision room most quickly.`,
        `${joinList(visibilityNeeds) || "The most important visibility need is sharper signal tracking at the boundary"} because flexibility now depends on recognizing whether pressure is still compounding or whether a credible interruption is finally emerging. The right posture is therefore disciplined rather than reactive: preserve room to move, keep attention on the narrow signals that can genuinely change the read, and do not assume the system will self-correct on its own.`,
      ],
    },
  };
};
