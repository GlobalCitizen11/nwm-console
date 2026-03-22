import type {
  BoardOnePagerContent,
  CanonicalEvidenceAnchor,
  CanonicalExportSummary,
  ExecutiveBriefContent,
  ExecutiveBriefSectionContent,
  PresentationBriefContent,
  PresentationSlideContent,
} from "../types/export";

const clean = (text: string) => text.replace(/\s+/g, " ").trim();
const words = (text: string) => clean(text).split(/\s+/).filter(Boolean);

const danglingEndings = /\b(and|which|because|with|the|one|one of|of|to|for|in|on|a|an)$/i;

const stripTerminal = (text: string) => clean(text).replace(/[.!?]+$/g, "").trim();

const finalizeSentence = (text: string) => {
  const normalized = stripTerminal(text).replace(/[;:]+$/g, "").trim();
  if (!normalized) {
    return "";
  }
  const repaired = danglingEndings.test(normalized) ? normalized.replace(danglingEndings, "").trim() : normalized;
  return repaired ? `${repaired}.` : "";
};

const limitWords = (text: string, max: number) => {
  const source = words(text);
  if (source.length <= max) {
    return finalizeSentence(source.join(" "));
  }
  let trimmed = source.slice(0, max);
  while (trimmed.length > 4 && danglingEndings.test(trimmed[trimmed.length - 1] ?? "")) {
    trimmed = trimmed.slice(0, -1);
  }
  return finalizeSentence(trimmed.join(" "));
};

const sentence = (text: string, max?: number) => (max ? limitWords(text, max) : finalizeSentence(text));

const humanize = (text: string) =>
  clean(text)
    .replace(/-/g, " ")
    .replace(/\bbloc competition\b/gi, "bloc competition")
    .replace(/\bai\b/g, "AI")
    .replace(/\bcurrent posture is sensitive to\b/gi, "")
    .replace(/\bvisibility is needed on whether\b/gi, "")
    .replace(/\bmonitoring should stay fixed on\b/gi, "")
    .replace(/\bdecision posture should stay disciplined where\b/gi, "")
    .replace(/\bthat pressure is now shaping\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

const lower = (text: string) => clean(text).toLowerCase();

const removeLead = (text: string, pattern: RegExp) => clean(text).replace(pattern, "").trim();

const titleCase = (text: string) =>
  clean(text)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (/^(AI|M\d+)$/i.test(word)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");

const asPhrase = (text: string, pattern: RegExp, fallback: string) => {
  const phrase = humanize(removeLead(text, pattern)).replace(/[.]+$/g, "");
  return phrase || fallback;
};

const refinePressurePhrase = (phrase: string) => {
  const normalized = humanize(phrase);
  if (normalized === "bloc competition") {
    return "bloc competition, allocation, and infrastructure";
  }
  return normalized;
};

const refineEvidenceTitle = (text: string) =>
  titleCase(
    clean(text)
      .replace(/\bTransition To\b/gi, "")
      .replace(/\bObserved Boundary Signal\b/gi, "")
      .replace(/\s+/g, " ")
      .trim(),
  );

const refineEvidenceSubtitle = (text: string) =>
  titleCase(
    clean(text)
      .replace(/\bObserved Boundary Signal\b/gi, "Boundary signal")
      .replace(/\bRetaliation\b/gi, "Retaliatory action")
      .replace(/\bDestabilization\b/gi, "Market destabilization")
      .replace(/\s+/g, " ")
      .trim(),
  );

const inflectionBullet = (text: string, fallback: string) => {
  const normalized = humanize(text);
  if (/^Early signals first appeared around /i.test(normalized)) {
    const phrase = removeLead(normalized, /^Early signals first appeared around\s+/i);
    return makeBullet(`${phrase} marked the first visible break from the prior operating logic`, 14);
  }
  if (/^Systemic uptake widened across /i.test(normalized)) {
    const phrase = removeLead(normalized, /^Systemic uptake widened across\s+/i);
    return makeBullet(`${phrase} widened the response burden across domains`, 14);
  }
  if (/^Recent developments turned the pattern into an operating condition inside the boundary/i.test(normalized)) {
    return makeBullet("Recent developments turned the pattern into an operating condition", 12);
  }
  return makeBullet(normalized || fallback, 14);
};

const boardCurrentState = (summary: CanonicalExportSummary) =>
  compactSentence(
    `The system is operating in a ${lower(summary.phase)}. Narrative density is ${summary.density}. Reversibility remains ${summary.reversibility}. Fragmentation now defines the planning baseline across the bounded world.`,
    50,
  );

const boardImplications = (summary: CanonicalExportSummary) => {
  const phrase = asPhrase(summary.implicationsSummary, /^that pressure is now shaping\s+/i, "coordination, timing, and allocation");
  return compactSentence(`Decision room is narrowing around ${phrase}.`, 25);
};

const boardMonitoring = (summary: CanonicalExportSummary) => {
  const phrase = asPhrase(summary.monitoringSummary, /^monitoring should stay fixed on\s+/i, "the signals that could reopen flexibility");
  return compactSentence(`Monitor ${phrase}. Early deviations would matter immediately.`, 20);
};

const boardPrimaryPressure = (summary: CanonicalExportSummary) => {
  const phrase = refinePressurePhrase(asPhrase(summary.primaryPressureSummary, /^pressure is concentrated in\s+/i, "bloc competition"));
  return compactSentence(`Pressure is concentrated in ${phrase}.`, 15);
};

const boardDominantPath = (summary: CanonicalExportSummary) =>
  compactSentence(
    humanize(summary.dominantPathSummary).replace(/\bis likely to deepen without a stabilizing interruption\b/i, "deepens without a stabilizing interruption"),
    15,
  );

const executivePressurePhrase = (summary: CanonicalExportSummary) =>
  refinePressurePhrase(asPhrase(summary.primaryPressureSummary, /^pressure is concentrated in\s+/i, "coordination bottlenecks"));

const executiveMonitoringPhrase = (summary: CanonicalExportSummary) =>
  asPhrase(summary.monitoringSummary, /^monitoring should stay fixed on\s+/i, "the indicators that could reopen flexibility");

const executivePositioningPhrase = (summary: CanonicalExportSummary) =>
  asPhrase(summary.strategicPositioningSummary, /^decision posture should stay disciplined where\s+/i, "exposure and timing are most sensitive");

const compactAnchor = (anchor: CanonicalEvidenceAnchor): CanonicalEvidenceAnchor => ({
  ...anchor,
  shortTitle: refineEvidenceTitle(clean(anchor.shortTitle).replace(/[()]/g, " ").split(/\s+/).slice(0, 6).join(" ")),
  shortSubtitle: refineEvidenceSubtitle(
    clean(anchor.shortSubtitle)
      .replace(/[(),]/g, " ")
      .replace(/\bDestabilize\b/gi, "Destabilization")
      .split(/\s+/)
      .slice(0, 8)
      .join(" "),
  ),
});

const section = (
  id: ExecutiveBriefSectionContent["id"],
  title: string,
  paragraphs: string[],
  insightCard: ExecutiveBriefSectionContent["insightCard"],
  bullets?: string[],
): ExecutiveBriefSectionContent => ({
  id,
  title,
  paragraphs: paragraphs.map((paragraph) => finalizeSentence(paragraph)),
  bullets: bullets?.map((bullet) => finalizeSentence(bullet)),
  insightCard: {
    label: insightCard.label,
    value: finalizeSentence(insightCard.value),
    support: insightCard.support ? finalizeSentence(insightCard.support) : undefined,
  },
});

const compactSentence = (text: string, maxWordsCount: number) => limitWords(text, maxWordsCount);

const narrativeParagraph = (parts: string[], maxWordsCount: number) =>
  limitWords(parts.map((part) => stripTerminal(part)).join(" "), maxWordsCount);

const makeBullet = (text: string, maxWordsCount = 14) => limitWords(text, maxWordsCount);

const slide = (id: string, title: string, headline: string, bullets: string[]): PresentationSlideContent => ({
  id,
  title,
  headline: clean(headline).split(/\s+/).slice(0, 8).join(" "),
  bullets: bullets.slice(0, 4).map((bullet) => finalizeSentence(bullet)),
});

export const renderBoardOnePager = (summary: CanonicalExportSummary): BoardOnePagerContent => ({
  title: summary.scenarioTitle,
  replayMonth: summary.replayMonth,
  timestamp: summary.timestamp,
  confidentialityLabel: summary.confidentialityLabel,
  boundedWorld: summary.boundedWorld,
  currentStateSummary: boardCurrentState(summary),
  implicationsSummary: boardImplications(summary),
  monitoringSummary: boardMonitoring(summary),
  signalStack: [
    { label: "Phase", value: summary.phase },
    { label: "Density", value: summary.density },
    { label: "Momentum", value: summary.momentum },
    { label: "Reversibility", value: summary.reversibility },
    { label: "Dominant path", value: boardDominantPath(summary) },
    { label: "Primary pressure", value: boardPrimaryPressure(summary) },
  ],
  evidenceAnchors: summary.evidenceAnchorsCompact.slice(0, 3).map(compactAnchor),
});

export const renderExecutiveBrief = (summary: CanonicalExportSummary): ExecutiveBriefContent => ({
  title: summary.scenarioTitle,
  replayMonth: summary.replayMonth,
  timestamp: summary.timestamp,
  confidentialityLabel: summary.confidentialityLabel,
  boundedWorld: summary.boundedWorld,
  systemStrip: [
    { label: "Phase", value: summary.phase },
    { label: "Density", value: summary.density },
    { label: "Momentum", value: summary.momentum },
    { label: "Reversibility", value: summary.reversibility },
  ],
  sections: [
    section(
      "system-state-overview",
      "System state overview",
      [
        narrativeParagraph(
          [
            summary.currentStateSummary,
            "Fragmentation now functions as an operating condition rather than a passing disruption.",
            "Executive planning must assume persistence because easy normalization is no longer credible.",
            "That shift changes the baseline from episodic stress to managed endurance.",
          ],
          64,
        ),
        narrativeParagraph(
          [
            `Pressure is concentrated in ${executivePressurePhrase(summary)}.`,
            "The system is now reacting faster to upstream constraints than to downstream reassurance.",
            "Assumptions built on rapid coordination recovery no longer hold at decision speed.",
            "Pressure is accumulating where allocation and control shape the room to maneuver.",
          ],
          64,
        ),
      ],
      {
        label: "Executive insight",
        value: "Decision risk is highest where coordination fails before exposure can be repositioned",
        support: "The binding constraint now sits upstream of routine response options",
      },
    ),
    section(
      "narrative-development",
      "Narrative development",
      [
        narrativeParagraph(
          [
            summary.narrativeDevelopment.earlySignalsSummary,
            "Those signals mattered because they challenged the prior operating logic before formal alignment shifted.",
            "They weakened confidence in assumptions that had treated the pressure as temporary.",
          ],
          38,
        ),
        narrativeParagraph(
          [
            summary.narrativeDevelopment.systemicUptakeSummary,
            "Responses spread across adjacent domains and widened the cost of waiting.",
            "That spread turned a localized signal into broader system behavior.",
          ],
          38,
        ),
        narrativeParagraph(
          [
            summary.narrativeDevelopment.currentStateFormationSummary,
            "The latest interval locked the pattern into practical planning assumptions.",
            "This moment is different because actors must now operate through the condition rather than debate it.",
          ],
          38,
        ),
      ],
      {
        label: "System inflection",
        value: "Signal accumulation has crossed into operating behavior",
        support: "The issue now shapes action before it invites further explanation",
      },
    ),
    section(
      "structural-interpretation",
      "Structural interpretation",
      [
        narrativeParagraph(
          [
            summary.structuralInterpretationSummary,
            "The sequence indicates a transition from contested narrative into structural regime behavior.",
            "Pressure now shapes coordination choices before actors can rely on legacy buffers.",
            "That is why the present condition carries more consequence than a temporary shock cycle.",
          ],
          64,
        ),
        narrativeParagraph(
          [
            summary.watchpointSummary,
            "Partial containment still exists, but it cannot restore the prior operating logic on its own.",
            "What remains unresolved is whether any credible interrupt can slow transmission before it hardens further.",
            "The system can still absorb noise, but it cannot yet absorb a true reversal signal.",
          ],
          64,
        ),
      ],
      {
        label: "Structural read",
        value: "The system is reorganizing around narrower coordination assumptions",
        support: "Containment remains partial and cannot reset the broader readout",
      },
    ),
    section(
      "forward-orientation",
      "Forward orientation",
      [
        narrativeParagraph(
          [
            summary.forwardOrientationSummary,
            "Continuation would make the present logic harder to reverse in practice.",
            "The next condition would carry more persistence and less room for informal stabilization.",
            "That path would lock more decisions into a narrower strategic corridor.",
          ],
          64,
        ),
        narrativeParagraph(
          [
            summary.alternatePathSummary,
            "A redirect would require structural interruption rather than rhetorical relief.",
            "Meaningful stabilization depends on visible coordination that changes behavior across the boundary.",
            "Without that interruption, the system will keep pricing continuity over normalization.",
          ],
          64,
        ),
      ],
      {
        label: "Path split",
        value: "The dominant path deepens the current operating condition",
        support: "A redirect requires a structural break rather than a narrative adjustment",
      },
    ),
    section(
      "strategic-positioning",
      "Strategic positioning",
      [
        narrativeParagraph(
          [
            `Discipline matters most where ${executivePositioningPhrase(summary)}.`,
            "What matters most now is where exposure, timing, and dependency intersect under pressure.",
            "That is where small changes can create disproportionate decision consequences.",
            "Decision posture should therefore privilege resilience over optimistic timing assumptions.",
          ],
          64,
        ),
        narrativeParagraph(
          [
            `Monitoring should stay fixed on ${executiveMonitoringPhrase(summary)}.`,
            "Those indicators are the ones most likely to reopen flexibility.",
            "Decision posture should preserve room to move while the watchpoint set remains small.",
            "The practical challenge is staying responsive without overreacting to routine noise.",
          ],
          64,
        ),
      ],
      {
        label: "Watchpoint",
        value: "Flexibility depends on a narrow set of visible indicators",
        support: "Attention should stay on the signals that can reopen room to act",
      },
    ),
    section(
      "evidence-anchors",
      "Evidence anchors",
      [
        narrativeParagraph(
          [
            "The current read rests on a compact evidence base that remains visible across institutions, markets, and policy channels.",
            "These anchors matter because they show the system moving through observable behavior rather than inferred intent.",
            "Together they confirm that the present condition is operational rather than speculative.",
            "They also establish a repeatable basis for comparing the next interval against the current read.",
          ],
          64,
        ),
      ],
      {
        label: "Evidence concentration",
        value: "The strongest anchors are the ones that move the wider system",
        support: "Observable developments now carry the interpretation",
      },
      summary.evidenceAnchorsCompact
        .slice(0, 3)
        .map((anchor) => sentence(`${stripTerminal(compactAnchor(anchor).shortTitle)}. ${compactAnchor(anchor).shortSubtitle}`, 14)),
    ),
  ],
});

export const renderPresentationBrief = (summary: CanonicalExportSummary): PresentationBriefContent => ({
  title: summary.scenarioTitle,
  replayMonth: summary.replayMonth,
  timestamp: summary.timestamp,
  confidentialityLabel: summary.confidentialityLabel,
  slides: [
    slide("title", "Operating context", "Fragmentation now defines the brief", [
      makeBullet(`The system is operating in ${summary.phase}`, 10),
      makeBullet(`Pressure is concentrated in ${executivePressurePhrase(summary)}`, 12),
    ]),
    slide("system", "System posture", "Density and momentum remain elevated", [
      makeBullet(`Narrative density is ${summary.density}`, 8),
      makeBullet(`Structural momentum is ${summary.momentum}`, 8),
      makeBullet(`Reversibility is ${summary.reversibility}`, 8),
    ]),
    slide("takeaways", "Executive takeaways", "Three points frame the current read", [
      makeBullet("Fragmentation is now an operating condition", 9),
      makeBullet("The dominant path still favors deeper separation", 9),
      makeBullet("Decision room is narrowing around timing and coordination", 10),
    ]),
    slide("progression", "Narrative progression", "The pattern moved from signal to condition", [
      makeBullet("Early signals challenged the prior operating logic", 10),
      makeBullet("Systemic uptake spread the burden across domains", 10),
      makeBullet("Recent developments locked the pattern into planning", 10),
    ]),
    slide("inflections", "Inflection points", "Three turns changed the read", [
      inflectionBullet(summary.narrativeDevelopment.earlySignalsSummary, "Early signals challenged the prior operating logic"),
      inflectionBullet(summary.narrativeDevelopment.systemicUptakeSummary, "Systemic uptake widened the response burden"),
      inflectionBullet(summary.narrativeDevelopment.currentStateFormationSummary, "Recent developments locked the pattern into planning"),
    ]),
    slide("implications", "Strategic implications", "The system now constrains decision room", [
      makeBullet(boardImplications(summary), 12),
      makeBullet("Coordination failures now carry larger downstream costs", 10),
      makeBullet("Exposure matters most where dependency and timing intersect", 11),
    ]),
    slide("paths", "Scenario paths", "The current path still dominates", [
      makeBullet(humanize(summary.dominantPathSummary), 12),
      makeBullet(humanize(summary.alternatePathSummary), 12),
    ]),
    slide("monitoring", "Monitoring priorities", "A narrow watch list now matters most", [
      makeBullet(`Monitor ${executiveMonitoringPhrase(summary)}`, 12),
      makeBullet(humanize(summary.watchpointSummary), 12),
      makeBullet("The watch list is narrow and highly consequential", 10),
    ]),
  ],
});
