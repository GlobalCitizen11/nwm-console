import type {
  BoardOnePagerContent,
  CanonicalExportSummary,
  ExecutiveBriefContent,
  PresentationBriefContent,
} from "../types/export";
import type { VoiceBriefIntelligence, VoiceBriefTranscriptIntelligence } from "../../../types/voiceBriefIntelligence";
import {
  buildBoardOnePagerFieldPack,
  buildBoardOnePagerSpec,
  buildPresentationBriefFieldPack,
  buildPresentationBriefSpec,
} from "../../../lib/artifactSpecBuilders";
import {
  buildExecutiveBriefFieldPack,
  buildExecutiveBriefSpecFromSummary,
} from "../../../lib/buildExecutiveBriefSpec";

const clean = (text: string) => text.replace(/\s+/g, " ").trim();

const formatTimestamp = (text: string) => {
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return clean(text);
  }

  const date = parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const time = parsed.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
  return `${date} ${time} UTC`;
};

export const renderBoardOnePager = (
  summary: CanonicalExportSummary,
  intelligence?: VoiceBriefTranscriptIntelligence | VoiceBriefIntelligence,
): BoardOnePagerContent => {
  const spec = buildBoardOnePagerSpec(summary, intelligence);
  const fieldPack = buildBoardOnePagerFieldPack(spec);

  return {
    title: summary.scenarioTitle,
    replayMonth: summary.replayMonth,
    timestamp: formatTimestamp(summary.timestamp),
    confidentialityLabel: summary.confidentialityLabel,
    boundedWorld: summary.boundedWorld,
    systemStrip: [
      { label: "Phase", value: spec.stateBand.phase.value },
      { label: "Density", value: spec.stateBand.density.value },
      { label: "Momentum", value: spec.stateBand.momentum.value },
      { label: "Reversibility", value: spec.stateBand.reversibility.value },
    ],
    spec,
    fieldPack,
    topInterpretation: fieldPack.topInterpretation,
    boardRead: fieldPack.boardRead,
    decisionHeadline: fieldPack.decisionHeadline,
    signalGrid: fieldPack.signalGrid,
    decisionBullets: fieldPack.decisionBullets,
    dominantPath: fieldPack.dominantPath,
    primaryPressure: fieldPack.primaryPressure,
    riskConcentrations: fieldPack.riskConcentrations,
    nextChangeSignals: fieldPack.inflectionPaths,
    monitoringTriggers: fieldPack.monitoringTriggers,
    readShiftSignals: fieldPack.readShiftSignals,
    containedSpreadSplit: fieldPack.containedSpreadSplit,
    evidenceAnchors: fieldPack.evidenceAnchors,
  };
};

export const renderExecutiveBrief = (
  summary: CanonicalExportSummary,
  intelligence?: VoiceBriefTranscriptIntelligence | VoiceBriefIntelligence,
): ExecutiveBriefContent => {
  const spec = buildExecutiveBriefSpecFromSummary(summary, intelligence);
  const fieldPack = buildExecutiveBriefFieldPack(spec);

  return {
    title: spec.header.scenarioName.value,
    replayMonth: summary.replayMonth,
    timestamp: formatTimestamp(summary.timestamp),
    confidentialityLabel: summary.confidentialityLabel,
    boundedWorld: summary.boundedWorld,
    spec,
    fieldPack,
  };
};

export const renderPresentationBrief = (
  summary: CanonicalExportSummary,
  intelligence?: VoiceBriefTranscriptIntelligence | VoiceBriefIntelligence,
): PresentationBriefContent => {
  const spec = buildPresentationBriefSpec(summary, intelligence);
  const fieldPack = buildPresentationBriefFieldPack(spec);

  return {
    title: summary.scenarioTitle,
    replayMonth: summary.replayMonth,
    timestamp: formatTimestamp(summary.timestamp),
    confidentialityLabel: summary.confidentialityLabel,
    spec,
    fieldPack,
    slides: [
      fieldPack.titleSlide,
      fieldPack.systemStateSlide,
      fieldPack.keyJudgmentsSlide,
      fieldPack.progressionSlide,
      fieldPack.inflectionSlide,
      fieldPack.impactSlide,
      fieldPack.pathwaysSlide,
      fieldPack.monitoringSlide,
    ],
  };
};
