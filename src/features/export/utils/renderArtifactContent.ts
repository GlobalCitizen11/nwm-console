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

const compactAnchor = (anchor: CanonicalEvidenceAnchor): CanonicalEvidenceAnchor => ({
  ...anchor,
  shortTitle: clean(anchor.shortTitle).split(/\s+/).slice(0, 6).join(" "),
  shortSubtitle: clean(anchor.shortSubtitle).split(/\s+/).slice(0, 8).join(" "),
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
  currentStateSummary: compactSentence(
    `${summary.currentStateSummary} ${summary.structuralInterpretationSummary} The regime now operates as the active planning condition inside the boundary.`,
    50,
  ),
  implicationsSummary: compactSentence(
    `${summary.implicationsSummary} Decision room is narrowing around coordination and timing.`,
    25,
  ),
  monitoringSummary: compactSentence(
    `${summary.monitoringSummary} Early deviations would matter immediately.`,
    20,
  ),
  signalStack: [
    { label: "Phase", value: summary.phase },
    { label: "Density", value: summary.density },
    { label: "Momentum", value: summary.momentum },
    { label: "Reversibility", value: summary.reversibility },
    { label: "Dominant path", value: compactSentence(summary.dominantPathSummary, 15) },
    { label: "Primary pressure", value: compactSentence(summary.primaryPressureSummary, 15) },
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
            summary.primaryPressureSummary,
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
        support: "The constraint now sits upstream of routine response options",
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
        support: "The issue now shapes action before it invites explanation",
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
        support: "Containment is partial and cannot reset the broader readout",
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
            summary.strategicPositioningSummary,
            "What matters most now is where exposure, timing, and dependency intersect under pressure.",
            "That is where small changes can create disproportionate decision consequences.",
            "Decision posture should therefore privilege resilience over optimistic timing assumptions.",
          ],
          64,
        ),
        narrativeParagraph(
          [
            summary.monitoringSummary,
            "Visibility should stay fixed on the narrow signals that can reopen flexibility.",
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
        .map((anchor) => sentence(`${stripTerminal(anchor.shortTitle)} ${anchor.shortSubtitle}`, 14)),
    ),
  ],
});

export const renderPresentationBrief = (summary: CanonicalExportSummary): PresentationBriefContent => ({
  title: summary.scenarioTitle,
  replayMonth: summary.replayMonth,
  timestamp: summary.timestamp,
  confidentialityLabel: summary.confidentialityLabel,
  slides: [
    slide("title", "Situation frame", "Situation frame", [
      makeBullet(`The system is operating in ${summary.phase}`, 10),
      makeBullet(`Pressure is concentrated in ${stripTerminal(summary.primaryPressureSummary).replace(/^Pressure is concentrated in /, "")}`, 12),
    ]),
    slide("system", "System state", "System state", [
      makeBullet(`Narrative density is ${summary.density}`, 8),
      makeBullet(`Structural momentum is ${summary.momentum}`, 8),
      makeBullet(`Reversibility is ${summary.reversibility}`, 8),
    ]),
    slide("takeaways", "Key takeaways", "Key takeaways", [
      makeBullet("Fragmentation is now an operating condition", 9),
      makeBullet("The dominant path still favors deeper separation", 9),
      makeBullet("Decision room is narrowing around timing and coordination", 10),
    ]),
    slide("progression", "Narrative progression", "Narrative progression", [
      makeBullet(summary.narrativeDevelopment.earlySignalsSummary, 12),
      makeBullet(summary.narrativeDevelopment.systemicUptakeSummary, 12),
      makeBullet(summary.narrativeDevelopment.currentStateFormationSummary, 13),
    ]),
    slide("inflections", "Inflection points", "Inflection points", [
      makeBullet("Early signals challenged the prior operating logic", 10),
      makeBullet("Cross-domain uptake widened the response burden", 9),
      makeBullet("Recent developments locked the pattern into planning", 10),
    ]),
    slide("implications", "Strategic implications", "Strategic implications", [
      makeBullet(summary.implicationsSummary, 12),
      makeBullet("Coordination failures now carry larger downstream costs", 10),
      makeBullet("Exposure matters most where dependency and timing intersect", 11),
    ]),
    slide("paths", "Scenario paths", "Scenario paths", [
      makeBullet(summary.dominantPathSummary, 12),
      makeBullet(summary.alternatePathSummary, 12),
    ]),
    slide("monitoring", "Risk and monitoring", "Risk and monitoring", [
      makeBullet(summary.monitoringSummary, 12),
      makeBullet(summary.watchpointSummary, 12),
      makeBullet("The watch list is narrow and highly consequential", 10),
    ]),
  ],
});
