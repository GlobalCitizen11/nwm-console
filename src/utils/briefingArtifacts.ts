import type {
  BoardOnePager,
  BriefingRawState,
  BriefingState,
  NarrativeEvent,
  PresentationBrief,
  PresentationBriefSlide,
  TransitionRecord,
} from "../types";

const sourceLabel: Record<NarrativeEvent["sourceType"], string> = {
  policy: "policy",
  media: "media",
  market: "market",
  legal: "legal",
  infrastructure: "infrastructure",
  sovereign: "sovereign",
};

const densityBand = (value: number): BriefingState["narrativeDensity"] => {
  if (value < 35) {
    return "low";
  }
  if (value < 55) {
    return "building";
  }
  if (value < 75) {
    return "high";
  }
  return "saturated";
};

const reversibilityBand = (value: number): BriefingState["reversibility"] => {
  if (value >= 65) {
    return "high";
  }
  if (value >= 40) {
    return "conditional";
  }
  if (value >= 20) {
    return "low";
  }
  return "locked-in";
};

const unique = (items: string[]) => Array.from(new Set(items.filter(Boolean)));

const take = (items: string[], count: number) => items.slice(0, count);

const joinList = (items: string[]) => {
  if (items.length <= 1) {
    return items[0] ?? "";
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
};

const formatAnchor = (event: NarrativeEvent) =>
  `M${event.month} ${event.title} (${sourceLabel[event.sourceType]}, ${event.structuralEffect})`;

const pickTopDomains = (events: NarrativeEvent[]) => {
  const counts = new Map<string, number>();
  for (const event of events) {
    for (const tag of event.domainTags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3)
    .map(([tag]) => tag);
};

const selectSignalAnchors = (events: NarrativeEvent[], transitions: TransitionRecord[], month: number) => {
  const anchors: string[] = [];
  for (const transition of transitions.filter((transition) => transition.month <= month).slice(-2)) {
    const trigger = transition.triggeringArtifacts[0];
    if (trigger) {
      anchors.push(
        `M${transition.month} transition to ${transition.toPhase} anchored by ${trigger.title} and ${transition.triggeringArtifacts.length - 1} supporting artifact${transition.triggeringArtifacts.length === 2 ? "" : "s"}.`,
      );
    }
  }

  for (const event of events.slice(-4)) {
    anchors.push(formatAnchor(event));
  }

  return take(unique(anchors), 6);
};

const describeCrossDomainEffects = (events: NarrativeEvent[], topDomains: string[]) => {
  const visibleSources = new Set(events.map((event) => event.sourceType));
  const effects: string[] = [];

  if (visibleSources.has("legal") && visibleSources.has("media")) {
    effects.push(`Legal and media signals are reinforcing one another around ${joinList(topDomains.slice(0, 2)) || "the active boundary"}.`);
  }
  if (visibleSources.has("policy") && visibleSources.has("market")) {
    effects.push(`Policy framing is being absorbed into market treatment, tightening how ${joinList(topDomains.slice(0, 2)) || "the scenario"} is classified.`);
  }
  if (visibleSources.has("sovereign") && visibleSources.has("infrastructure")) {
    effects.push(`Sovereign actions are interacting directly with infrastructure conditions, narrowing assumptions of neutral access.`);
  }

  if (effects.length === 0) {
    effects.push(`Cross-domain interaction remains concentrated inside ${joinList(topDomains) || "the currently visible signals"}, rather than spreading evenly across every source class.`);
  }

  return take(effects, 3);
};

const describeStabilitySignals = (
  visibleEvents: NarrativeEvent[],
  recentEvents: NarrativeEvent[],
  reversibility: BriefingState["reversibility"],
) => {
  const reinforceEvents = visibleEvents.filter((event) => event.structuralEffect === "reinforce");
  const stabilizers = recentEvents.filter((event) => event.structuralEffect === "reinforce");
  const sourceCoverage = new Set(recentEvents.map((event) => event.sourceType)).size;
  const signals: string[] = [];

  if (stabilizers.length > 0) {
    signals.push(`Recent reinforcing signals remain present through ${joinList(stabilizers.map((event) => event.title).slice(0, 2))}, indicating that not every pressure line is still widening.`);
  }
  if (reversibility !== "locked-in") {
    signals.push(`Reversibility remains ${reversibility}, which means the current pattern is constrained by at least some remaining capacity for interruption or containment.`);
  }
  if (sourceCoverage < 4) {
    signals.push(`The current pattern is not yet spreading through every source class; recent pressure is still concentrated rather than universal.`);
  }
  if (reinforceEvents.length === 0) {
    signals.push(`No durable reinforcing signal has yet broadened across the full world boundary.`);
  }

  return take(unique(signals), 3);
};

const buildPressurePoints = (events: NarrativeEvent[], topDomains: string[]) => {
  const destabilizers = events.filter((event) => event.structuralEffect !== "reinforce");
  const points = [
    `${joinList(topDomains) || "Current domains"} are carrying the densest accumulation of visible pressure.`,
    destabilizers.length > 0
      ? `${joinList(unique(destabilizers.map((event) => sourceLabel[event.sourceType])).slice(0, 3))} channels are transmitting most of the active pressure.`
      : "Pressure remains limited because visible destabilizing or reclassifying signals are still sparse.",
  ];

  return take(unique(points), 3);
};

const buildStructuralMomentum = (
  phase: string,
  currentMetrics: BriefingRawState["point"]["metrics"],
  previousMetrics: BriefingRawState["point"]["metrics"] | null,
  recentEvents: NarrativeEvent[],
): BriefingState["structuralMomentum"] => {
  const velocityDelta = previousMetrics ? currentMetrics.velocity - previousMetrics.velocity : currentMetrics.velocity;
  const densityDelta = previousMetrics ? currentMetrics.density - previousMetrics.density : currentMetrics.density;
  const reinforceCount = recentEvents.filter((event) => event.structuralEffect === "reinforce").length;
  const destabilizeCount = recentEvents.filter((event) => event.structuralEffect !== "reinforce").length;

  if (densityDelta >= 6 || velocityDelta >= 6) {
    return "cascading";
  }
  if (phase === "Fragmented Regime" || (currentMetrics.reversibility < 30 && destabilizeCount >= reinforceCount)) {
    return "fragmenting";
  }
  return "consolidating";
};

const buildCyclePosition = (
  phase: string,
  reversibility: BriefingState["reversibility"],
  recentEvents: NarrativeEvent[],
): BriefingState["cyclePosition"] => {
  if (phase === "Escalating") {
    return "emergence";
  }
  if (phase === "Escalation Edge") {
    return "expansion";
  }
  if (phase === "Fragmented Regime" && (reversibility === "conditional" || recentEvents.some((event) => event.structuralEffect === "reinforce"))) {
    return "resolution-pressure";
  }
  return "entrenchment";
};

const buildCurrentCondition = (
  phase: string,
  density: BriefingState["narrativeDensity"],
  momentum: BriefingState["structuralMomentum"],
  reversibility: BriefingState["reversibility"],
) =>
  `The world is currently in ${phase} with ${density} narrative density, ${momentum} structural momentum, and ${reversibility} reversibility.`;

const buildStructuralShift = (
  phase: string,
  previousPhase: string | null,
  densityDelta: number,
  reversibilityDelta: number,
  latestDevelopments: string[],
) => {
  if (previousPhase && previousPhase !== phase) {
    return `The latest interval moved from ${previousPhase} into ${phase}, with ${joinList(latestDevelopments.slice(0, 2)) || "recent developments"} carrying that shift.`;
  }
  if (densityDelta > 0 && reversibilityDelta < 0) {
    return `The latest interval increased density while reducing reversibility, which indicates that accumulation is still outpacing relief.`;
  }
  if (densityDelta <= 0 && reversibilityDelta >= 0) {
    return `The latest interval did not widen in a straight line; density growth eased while reversibility stopped deteriorating.`;
  }
  return `The latest interval preserved the current phase but continued to rework how pressure is distributed inside the boundary.`;
};

const buildPrimaryPath = (
  phase: string,
  momentum: BriefingState["structuralMomentum"],
  density: BriefingState["narrativeDensity"],
) =>
  `If the currently visible pattern continues, the dominant path remains one of ${momentum} development inside ${phase.toLowerCase()}, with ${density} density keeping the world oriented toward further structural consolidation rather than simple dissipation.`;

const buildAlternatePaths = (
  reversibility: BriefingState["reversibility"],
  stabilitySignals: string[],
  crossDomainEffects: string[],
) => {
  const alternatives = [
    reversibility === "high" || reversibility === "conditional"
      ? `An alternate path would come from the containment already visible in ${joinList(stabilitySignals.slice(0, 1)) || "the current state"}, which could interrupt straight-line escalation without reversing the world definition itself.`
      : `An alternate path would require a new stabilizing signal strong enough to interrupt the current low-reversibility pattern, because the present structure is not self-correcting.`,
    `A second alternate path would involve cross-domain effects broadening through ${joinList(crossDomainEffects.slice(0, 1)) || "additional source classes"}, which would harden the current condition further rather than release it.`,
  ];

  return take(alternatives, 2);
};

const buildPriorities = (topDomains: string[], anchors: string[]) =>
  take(
    unique([
      `Priority visibility sits around ${joinList(topDomains) || "the most active domains"} because that is where the current world is densest.`,
      `Priority review attaches to ${anchors[0] ?? "the latest visible anchor"} because it is shaping the present readout.`,
      `Priority attention remains on whether the current phase is being carried by a narrow cluster or a broader uptake pattern.`,
    ]),
    3,
  );

const buildSensitivities = (
  momentum: BriefingState["structuralMomentum"],
  reversibility: BriefingState["reversibility"],
  recentEvents: NarrativeEvent[],
) =>
  take(
    unique([
      `The current posture is sensitive to whether ${joinList(pickTopDomains(recentEvents).slice(0, 2)) || "the active domains"} continue to accumulate in the same direction.`,
      `The system remains sensitive to reversibility staying ${reversibility}, because that determines whether new pressure locks in or remains interruptible.`,
      `Momentum is presently ${momentum}, so the state is sensitive to whether fresh signals reinforce that pace or begin to break it.`,
    ]),
    3,
  );

const buildVisibilityNeeds = (recentEvents: NarrativeEvent[], transitions: TransitionRecord[], month: number) =>
  take(
    unique([
      `Visibility is needed on whether recent developments such as ${joinList(recentEvents.map((event) => event.title).slice(0, 2)) || "the current signal set"} are being operationalized beyond their initial announcement cycle.`,
      transitions.filter((transition) => transition.month <= month).length > 0
        ? `Visibility is needed on whether the latest adjudicated transition is gaining reinforcing support or merely holding at the threshold.`
        : `Visibility is needed on whether the current signal mix is approaching a formal transition or still forming below threshold.`,
      `Visibility is needed on which source classes remain inactive, because non-spread is as important as spread in this world definition.`,
    ]),
    3,
  );

export function extractBriefingState(rawState: BriefingRawState): BriefingState {
  const { scenarioName, result, point } = rawState;
  const visibleEvents = [...point.visibleEvents].sort((left, right) => left.month - right.month || left.title.localeCompare(right.title));
  const previousPoint = result.timeline[Math.max(0, point.month - 1)] ?? null;
  const previousPhase = previousPoint ? previousPoint.phase : null;
  const recentEvents = visibleEvents.filter((event) => event.month >= Math.max(0, point.month - 3));
  const earlyEvents = visibleEvents.filter((event) => event.id !== "T0").slice(0, 3);
  const systemicEvents = visibleEvents.filter((event) => event.structuralEffect === "reclassify" || event.sourceType === "sovereign" || event.sourceType === "legal").slice(2, 6);
  const latestEvents = visibleEvents.slice(-3);
  const topDomains = pickTopDomains(recentEvents.length > 0 ? recentEvents : visibleEvents);
  const density = densityBand(point.metrics.density);
  const reversibility = reversibilityBand(point.metrics.reversibility);
  const momentum = buildStructuralMomentum(point.phase, point.metrics, previousPoint?.metrics ?? null, recentEvents);
  const cyclePosition = buildCyclePosition(point.phase, reversibility, recentEvents);
  const latestDevelopments = latestEvents.map((event) => formatAnchor(event));
  const earlySignals = earlyEvents.map((event) => formatAnchor(event));
  const systemicUptake = systemicEvents.length > 0 ? systemicEvents.map((event) => formatAnchor(event)) : latestDevelopments;
  const densityDelta = previousPoint ? point.metrics.density - previousPoint.metrics.density : point.metrics.density;
  const reversibilityDelta = previousPoint ? point.metrics.reversibility - previousPoint.metrics.reversibility : 0;
  const signalAnchors = selectSignalAnchors(visibleEvents, result.transitions, point.month);
  const crossDomainEffects = describeCrossDomainEffects(recentEvents.length > 0 ? recentEvents : visibleEvents, topDomains);
  const stabilitySignals = describeStabilitySignals(visibleEvents, recentEvents, reversibility);

  return {
    scenarioName,
    boundedWorld: result.world.name,
    boundaryDefinition: `Inside the world: ${result.world.domain} across ${result.world.geography}. Excluded unless activated: activity outside this boundary that does not materially alter structural pressure inside it.`,
    asOf: `Replay month M${point.month} of ${result.world.timeHorizonMonths}`,
    phase: point.phase,
    narrativeDensity: density,
    structuralMomentum: momentum,
    reversibility,
    cyclePosition,
    currentCondition: buildCurrentCondition(point.phase, density, momentum, reversibility),
    structuralShift: buildStructuralShift(point.phase, previousPhase, densityDelta, reversibilityDelta, latestDevelopments),
    earlySignals,
    systemicUptake,
    latestDevelopments,
    pressurePoints: buildPressurePoints(recentEvents.length > 0 ? recentEvents : visibleEvents, topDomains),
    crossDomainEffects,
    stabilitySignals,
    signalAnchors,
    primaryPath: buildPrimaryPath(point.phase, momentum, density),
    alternatePaths: buildAlternatePaths(reversibility, stabilitySignals, crossDomainEffects),
    priorities: buildPriorities(topDomains, signalAnchors),
    sensitivities: buildSensitivities(momentum, reversibility, recentEvents),
    visibilityNeeds: buildVisibilityNeeds(recentEvents, result.transitions, point.month),
  };
}

const formatSystemStateBlock = (state: BriefingState) =>
  [
    `Phase: ${state.phase}`,
    `Narrative Density: ${state.narrativeDensity}`,
    `Structural Momentum: ${state.structuralMomentum}`,
    `Reversibility: ${state.reversibility}`,
    `Cycle Position: ${state.cyclePosition}`,
  ];

export function composeExecutiveBrief(state: BriefingState) {
  // Build the first paragraph around the current condition and the latest structural shift.
  const overviewParagraphOne = `${state.currentCondition} ${state.structuralShift}`;
  // Build the second paragraph around operational meaning rather than restating the model fields.
  const overviewParagraphTwo = `Operationally, the visible pattern is carrying pressure through ${joinList(state.pressurePoints.slice(0, 2))}, which means the world readout is being shaped by structural uptake rather than isolated noise.`;

  const developmentParagraphs = [
    `Early signals formed through ${joinList(state.earlySignals) || "a still-forming signal set"}, establishing the first observable break from baseline conditions.`,
    `Systemic uptake followed through ${joinList(state.systemicUptake.slice(0, 3)) || "a limited set of institutional and legal developments"}, which moved the world from early formation into broader structural recognition.`,
    `The current condition is now being carried by ${joinList(state.latestDevelopments.slice(0, 3)) || "the latest visible developments"}, which are the most immediate anchors for the present phase readout.`,
  ];

  const structuralInterpretation = [
    `The structural meaning is not only that pressure is present, but that it is now being transmitted across the boundary in a way that aligns multiple source classes rather than remaining trapped in a single narrative lane.`,
    `Cross-domain interaction is currently visible through ${joinList(state.crossDomainEffects.slice(0, 2))}, which is why the present phase carries more institutional weight than an early-stage signal cluster would.`,
  ];

  const strategicPositioning = [
    `Current positioning centers on ${joinList(state.priorities)}.`,
    `The state is most sensitive to ${joinList(state.sensitivities)}, while visibility needs remain concentrated on ${joinList(state.visibilityNeeds)}.`,
  ];

  return [
    "EXECUTIVE BRIEF",
    `Scenario Name: ${state.scenarioName}`,
    `Bounded World: ${state.boundedWorld}`,
    `Boundary Definition: ${state.boundaryDefinition}`,
    `As of: ${state.asOf}`,
    `Phase: ${state.phase}`,
    "",
    "SYSTEM STATE",
    ...formatSystemStateBlock(state),
    "",
    "1. System State Overview",
    overviewParagraphOne,
    "",
    overviewParagraphTwo,
    "",
    "2. Narrative Development",
    ...developmentParagraphs.flatMap((paragraph) => [paragraph, ""]),
    "3. Structural Interpretation",
    ...structuralInterpretation.flatMap((paragraph) => [paragraph, ""]),
    "4. Forward Orientation",
    state.primaryPath,
    "",
    ...state.alternatePaths.flatMap((paragraph) => [paragraph, ""]),
    "5. Strategic Positioning",
    ...strategicPositioning.flatMap((paragraph) => [paragraph, ""]),
    "6. Signal Basis",
    ...state.signalAnchors.map((anchor) => `- ${anchor}`),
    "",
    "7. Cross-Domain Effects",
    ...state.crossDomainEffects.map((effect) => `- ${effect}`),
    "",
    "8. Stability / Containment Signals",
    ...state.stabilitySignals.map((signal) => `- ${signal}`),
  ].join("\n");
}

const buildPresentationSlide = (title: string, bullets: string[], speakerNotes: string): PresentationBriefSlide => ({
  title,
  bullets: take(bullets, 4),
  speakerNotes,
});

export function composePresentationBrief(state: BriefingState): PresentationBrief {
  return {
    slides: [
      buildPresentationSlide(
        "Situation Frame",
        [
          state.boundaryDefinition,
          `As of ${state.asOf}, the world is in ${state.phase}.`,
          `Pressure is concentrated around ${joinList(state.pressurePoints.slice(0, 2))}.`,
        ],
        `Open by framing the bounded world and the current phase without explaining the model. The emphasis is on scope, current condition, and where the visible pressure sits.`,
      ),
      buildPresentationSlide(
        "Executive Takeaway",
        [
          state.currentCondition,
          state.structuralShift,
          state.primaryPath,
        ],
        `This slide is the compressed takeaway: what the state is, what shifted most recently, and what continuation currently looks like inside the boundary.`,
      ),
      buildPresentationSlide(
        "System State",
        formatSystemStateBlock(state),
        `Walk through the system state block as a compact orientation layer. Keep it factual and avoid turning the labels into predictions.`,
      ),
      buildPresentationSlide(
        "How It Emerged",
        [
          ...take(state.earlySignals, 2),
          ...take(state.systemicUptake, 2),
        ],
        `Use this slide to sequence the move from early formation into broader uptake. The goal is to show accumulation, not chronology for its own sake.`,
      ),
      buildPresentationSlide(
        "What Changed",
        [
          ...take(state.latestDevelopments, 2),
          ...take(state.signalAnchors, 2),
        ],
        `Anchor the current change in the newest visible developments and the most recent proof-bearing anchors.`,
      ),
      buildPresentationSlide(
        "Structural Reading",
        [
          ...take(state.crossDomainEffects, 2),
          ...take(state.stabilitySignals, 2),
        ],
        `Explain what is spreading and what is not. This is where the cross-domain interaction and the containment signals need to sit next to one another.`,
      ),
      buildPresentationSlide(
        "Near-Range Paths",
        [
          state.primaryPath,
          ...take(state.alternatePaths, 2),
        ],
        `Describe the continuation path and the interruption path as bounded structural orientations, not forecasts.`,
      ),
      buildPresentationSlide(
        "Leadership Attention",
        [
          ...take(state.priorities, 2),
          ...take(state.visibilityNeeds, 2),
        ],
        `Close with what deserves leadership attention now: the visible priorities, the main sensitivities, and the visibility gaps that matter most.`,
      ),
    ],
  };
}

export function composeBoardOnePager(state: BriefingState): BoardOnePager {
  return {
    situationInBrief: `${state.currentCondition} ${state.structuralShift}`,
    whyThisMattersNow: `What matters now is that ${joinList(state.crossDomainEffects.slice(0, 2))} while ${joinList(state.stabilitySignals.slice(0, 1)) || "containment remains limited"}.`,
    whatHasShifted: take(unique([...state.latestDevelopments, ...state.pressurePoints]), 4),
    structuralReading: `The current reading is one of ${state.structuralMomentum} development in a ${state.narrativeDensity} environment, with ${state.reversibility} reversibility and ${state.cyclePosition} cycle position shaping how durable the state appears inside the boundary.`,
    oversightPriorities: take(unique([...state.priorities, ...state.sensitivities, ...state.visibilityNeeds]), 4),
    signalBasis: take(state.signalAnchors, 6),
    stabilitySignals: take(state.stabilitySignals, 3),
  };
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const sharedConsoleStyles = `
      body { font-family: "Avenir Next", "Segoe UI", Arial, sans-serif; background: #0c1117; color: #d7e0ea; margin: 0; padding: 24px; }
      .sheet { max-width: 1100px; margin: 0 auto; border: 1px solid #223041; background:
        linear-gradient(180deg, rgba(18,25,34,0.98) 0%, rgba(11,17,24,0.98) 100%);
        box-shadow: 0 18px 44px rgba(0,0,0,0.32); }
      .header { padding: 28px 30px 18px; border-bottom: 1px solid #223041; }
      .kicker { font-size: 11px; letter-spacing: 0.24em; text-transform: uppercase; color: #7f90a4; }
      h1 { margin: 12px 0 10px; font-size: 32px; line-height: 1.15; }
      .sub { color: #97a8ba; line-height: 1.65; margin: 0; }
      .meta-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 18px; }
      .meta-card { border: 1px solid #223041; background: rgba(11,17,24,0.72); padding: 14px; min-height: 74px; }
      .meta-card p { margin: 8px 0 0; color: #eef3f7; font-size: 15px; line-height: 1.45; }
      .body { padding: 22px 30px 30px; }
      .section-grid { display: grid; gap: 14px; }
      .section-grid-two { display: grid; grid-template-columns: 1.35fr 1fr; gap: 14px; }
      .section { border: 1px solid #223041; background: rgba(11,17,24,0.72); padding: 18px; }
      .section-title { margin: 0 0 12px; font-size: 18px; color: #eef3f7; }
      .section p { margin: 0 0 12px; color: #d7e0ea; line-height: 1.72; font-size: 14px; }
      .section p:last-child { margin-bottom: 0; }
      .system-strip { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
      .system-chip { border: 1px solid #2c3b4d; background: rgba(15,22,30,0.92); padding: 12px; }
      .system-chip .label { display: block; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: #7f90a4; }
      .system-chip .value { display: block; margin-top: 8px; color: #eef3f7; font-size: 15px; line-height: 1.3; }
      .bullet-list { margin: 0; padding-left: 18px; color: #d7e0ea; }
      .bullet-list li { margin: 0 0 8px; line-height: 1.6; }
      .accent { color: #d5b349; }
      .footer { margin-top: 18px; color: #7f90a4; font-size: 12px; }
      .stack { display: grid; gap: 12px; }
      .note-band { border: 1px solid #2c3b4d; background: rgba(20,29,40,0.74); padding: 14px 16px; color: #c9d4df; line-height: 1.6; }
      @media print {
        body { background: #ffffff; color: #101923; padding: 0; }
        .sheet { border: 0; box-shadow: none; background: #ffffff; max-width: none; }
        .header, .section, .meta-card, .system-chip, .note-band { border-color: #d7dde4; background: #ffffff; }
        .kicker, .sub, .footer, .system-chip .label { color: #556575; }
        h1, .section-title, .system-chip .value, .meta-card p { color: #101923; }
        .bullet-list, .section p, .note-band { color: #253342; }
        .accent { color: #835e00; }
      }
`;

const renderSystemStrip = (state: BriefingState) =>
  formatSystemStateBlock(state)
    .map((line) => {
      const [label, value] = line.split(": ");
      return `<div class="system-chip"><span class="label">${escapeHtml(label)}</span><span class="value">${escapeHtml(value)}</span></div>`;
    })
    .join("");

const renderBulletList = (items: string[]) =>
  `<ul class="bullet-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;

export function renderExecutiveBriefHtml(state: BriefingState, currentViewName: string) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(state.scenarioName)} Executive Brief</title>
    <style>
      ${sharedConsoleStyles}
    </style>
  </head>
  <body>
    <section class="sheet">
      <header class="header">
        <div class="kicker">Executive Brief</div>
        <h1>${escapeHtml(state.scenarioName)}</h1>
        <p class="sub">${escapeHtml(state.boundedWorld)} | ${escapeHtml(state.asOf)} | <span class="accent">${escapeHtml(state.phase)}</span></p>
        <div class="meta-grid">
          <div class="meta-card"><div class="kicker">Boundary</div><p>${escapeHtml(state.boundaryDefinition)}</p></div>
          <div class="meta-card"><div class="kicker">Primary Path</div><p>${escapeHtml(state.primaryPath)}</p></div>
          <div class="meta-card"><div class="kicker">Structural Shift</div><p>${escapeHtml(state.structuralShift)}</p></div>
          <div class="meta-card"><div class="kicker">Current Condition</div><p>${escapeHtml(state.currentCondition)}</p></div>
        </div>
      </header>
      <div class="body">
        <section class="section">
          <div class="kicker">System State</div>
          <div class="system-strip">${renderSystemStrip(state)}</div>
        </section>

        <div class="section-grid-two" style="margin-top:14px;">
          <section class="section">
            <div class="kicker">System State Overview</div>
            <h2 class="section-title">Current condition and operational meaning</h2>
            <p>${escapeHtml(state.currentCondition)} ${escapeHtml(state.structuralShift)}</p>
            <p>Operationally, the visible pattern is carrying pressure through ${escapeHtml(joinList(state.pressurePoints.slice(0, 2)))}. The current readout is being shaped by structural uptake rather than one-off noise.</p>
          </section>
          <section class="section">
            <div class="kicker">Forward Orientation</div>
            <h2 class="section-title">Primary and alternate paths</h2>
            <p>${escapeHtml(state.primaryPath)}</p>
            ${state.alternatePaths.map((path) => `<p>${escapeHtml(path)}</p>`).join("")}
          </section>
        </div>

        <div class="section-grid-two" style="margin-top:14px;">
          <section class="section">
            <div class="kicker">Narrative Development</div>
            <h2 class="section-title">How the current state formed</h2>
            <div class="stack">
              <div class="note-band"><strong>Early signals.</strong> ${escapeHtml(`Formation began through ${joinList(state.earlySignals)}.`)}</div>
              <div class="note-band"><strong>Systemic uptake.</strong> ${escapeHtml(`Broader uptake followed through ${joinList(state.systemicUptake.slice(0, 3))}.`)}</div>
              <div class="note-band"><strong>Current condition.</strong> ${escapeHtml(`The present phase is now carried by ${joinList(state.latestDevelopments.slice(0, 3))}.`)}</div>
            </div>
          </section>
          <section class="section">
            <div class="kicker">Structural Interpretation</div>
            <h2 class="section-title">What the pattern means</h2>
            <p>The visible pressure is no longer confined to a single lane. It is now moving through the boundary in a way that aligns multiple source classes and gives the current phase more institutional weight.</p>
            <p>${escapeHtml(joinList(state.crossDomainEffects.slice(0, 2)))} This is why the current state reads as structural rather than episodic.</p>
          </section>
        </div>

        <div class="section-grid-two" style="margin-top:14px;">
          <section class="section">
            <div class="kicker">Strategic Positioning</div>
            <h2 class="section-title">Priorities, sensitivities, visibility</h2>
            ${renderBulletList([...state.priorities, ...state.sensitivities, ...state.visibilityNeeds].slice(0, 7))}
          </section>
          <section class="section">
            <div class="kicker">Signal Basis</div>
            <h2 class="section-title">Observable anchors</h2>
            ${renderBulletList(state.signalAnchors)}
          </section>
        </div>

        <div class="section-grid-two" style="margin-top:14px;">
          <section class="section">
            <div class="kicker">Cross-Domain Effects</div>
            <h2 class="section-title">How domains are interacting</h2>
            ${renderBulletList(state.crossDomainEffects)}
          </section>
          <section class="section">
            <div class="kicker">Stability / Containment</div>
            <h2 class="section-title">What is not spreading</h2>
            ${renderBulletList(state.stabilitySignals)}
          </section>
        </div>

        <p class="footer">Generated from ${escapeHtml(currentViewName)}. Orientation and evidence only.</p>
      </div>
    </section>
  </body>
</html>`;
}

export function renderPresentationBriefHtml(state: BriefingState, currentViewName: string) {
  const brief = composePresentationBrief(state);
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(state.scenarioName)} Presentation Slides</title>
    <style>
      ${sharedConsoleStyles}
      .deck-header { padding: 28px 30px 16px; border-bottom: 1px solid #223041; }
      .deck { padding: 22px 30px 30px; display: grid; gap: 16px; }
      .slide { border: 1px solid #223041; background: rgba(11,17,24,0.74); padding: 20px; }
      .slide-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .slide-number { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #7f90a4; }
      h2 { margin: 12px 0; font-size: 24px; }
      .notes { margin-top: 14px; color: #9aa8b7; font-size: 13px; line-height: 1.6; border-top: 1px solid #223041; padding-top: 12px; }
    </style>
  </head>
  <body>
    <section class="sheet">
      <header class="deck-header">
        <div class="kicker">Presentation Brief</div>
        <h1>${escapeHtml(state.scenarioName)}</h1>
        <p class="sub">${escapeHtml(state.boundedWorld)} | ${escapeHtml(state.asOf)} | <span class="accent">${escapeHtml(state.phase)}</span></p>
      </header>
      <div class="deck">
      ${brief.slides
        .map(
          (slide, index) => `<article class="slide">
            <div class="slide-top">
              <div class="kicker">Presentation Slide</div>
              <div class="slide-number">Slide ${index + 1}</div>
            </div>
            <h2>${escapeHtml(slide.title)}</h2>
            <ul>
              ${slide.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}
            </ul>
            <p class="notes">${escapeHtml(slide.speakerNotes)}</p>
          </article>`,
        )
        .join("")}
      <p class="footer">Generated from ${escapeHtml(currentViewName)}. Orientation and evidence only.</p>
      </div>
    </section>
  </body>
</html>`;
}

export function renderBoardOnePagerHtml(state: BriefingState, currentViewName: string) {
  const onePager = composeBoardOnePager(state);
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(state.scenarioName)} Board One Pager</title>
    <style>
      ${sharedConsoleStyles}
      .board-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 14px; }
    </style>
  </head>
  <body>
    <section class="sheet">
      <header class="header">
        <div class="kicker">Board One Pager</div>
        <h1>${escapeHtml(state.scenarioName)}</h1>
        <p class="sub">${escapeHtml(state.boundedWorld)} | ${escapeHtml(state.asOf)} | <span class="accent">${escapeHtml(state.phase)}</span></p>
        <div class="system-strip" style="margin-top:18px;">${renderSystemStrip(state)}</div>
      </header>
      <div class="body">
        <div class="board-grid">
          <section class="section">
            <div class="kicker">Situation in Brief</div>
            <h2 class="section-title">Board framing</h2>
            <p>${escapeHtml(onePager.situationInBrief)}</p>
            <p>${escapeHtml(onePager.whyThisMattersNow)}</p>
            <div class="note-band">${escapeHtml(state.boundaryDefinition)}</div>
          </section>
          <section class="section">
            <div class="kicker">Structural Reading</div>
            <h2 class="section-title">Current interpretation</h2>
            <p>${escapeHtml(onePager.structuralReading)}</p>
            ${renderBulletList(onePager.whatHasShifted)}
          </section>
        </div>

        <div class="section-grid-two" style="margin-top:14px;">
          <section class="section">
            <div class="kicker">Oversight Priorities</div>
            <h2 class="section-title">Exposure, dependencies, visibility</h2>
            ${renderBulletList(onePager.oversightPriorities)}
          </section>
          <section class="section">
            <div class="kicker">Signal Basis</div>
            <h2 class="section-title">Observable anchors</h2>
            ${renderBulletList(onePager.signalBasis)}
          </section>
        </div>

        <section class="section" style="margin-top:14px;">
          <div class="kicker">Stability / Containment</div>
          <h2 class="section-title">What remains constrained</h2>
          ${renderBulletList(onePager.stabilitySignals)}
        </section>

        <p class="footer">Generated from ${escapeHtml(currentViewName)}. Orientation and evidence only.</p>
      </div>
    </section>
  </body>
</html>`;
}
