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
import { getAdjudicationStatusDisplay } from "../../../lib/systemLabels";

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
  const adjudicationStatus = getAdjudicationStatusDisplay(summary.phaseResolution.adjudicationStatus);
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
    v2: {
      currentState: summary.currentStateSummary,
      structuralReality: summary.dominantPathSummary,
      keyDrivers: [
        summary.primaryPressureSummary,
        summary.artifactSetSummary,
        summary.traceabilitySummary,
      ].filter(Boolean),
      immediateImplications: [
        summary.implicationsSummary,
        summary.proofSummary,
        `State vector: density ${summary.stateVector.density.toFixed(1)}, coherence ${summary.stateVector.coherence.toFixed(1)}, reversibility ${summary.stateVector.reversibility.toFixed(1)}.`,
      ].filter(Boolean),
      whatToWatch: [
        summary.watchpointSummary,
        ...summary.preGcsSensitivity.primarySensitivities.slice(0, 2),
      ].slice(0, 3),
      adjudicationStatus: `Current phase ${summary.phaseResolution.phase} is marked ${adjudicationStatus}.`,
      traceabilitySummary: summary.traceabilitySummary,
      proofSummary: summary.proofSummary,
      stateVector: summary.stateVector,
      phaseResolution: summary.phaseResolution,
    },
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
    v2: {
      boundedWorldDefinition: summary.boundaryDefinition,
      artifactSetSummary: summary.artifactSetSummary,
      stateVector: summary.stateVector,
      phaseResolution: summary.phaseResolution,
      traceabilitySummary: summary.traceabilitySummary,
      proofSummary: summary.proofSummary,
      artifactStateMapping: summary.artifactStateMapping,
      temporalSpine: summary.temporalSpine,
      preGcsSensitivity: summary.preGcsSensitivity,
    },
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
