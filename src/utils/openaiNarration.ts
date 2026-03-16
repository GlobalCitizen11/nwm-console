import type { AudioMode, AudioRole } from "../context/audioPreferences";
import { getOpenAiVoice, type VoiceProfile } from "./speech";

const STORAGE_KEY = "nwm-console-openai-api-key";

export interface NarrationRequest {
  sectionTitle: string;
  role: AudioRole;
  mode: AudioMode;
  worldBoundaryContext: string;
  summary: string;
  currentState: string;
  businessUse: string;
  decisionGuidance?: string;
  rawContext?: string[];
}

interface ResponsesApiResult {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
}

type OpenAiSpeechVoice = "coral" | "shimmer";

const sectionLenses: Record<string, string> = {
  "HALO Orientation":
    "Treat this as a structural orientation brief. Focus on pressure, momentum, instability, and what the signal mix suggests about the current posture of the world.",
  "Timeline Replay":
    "Treat this as a sequence-and-turning-points brief. Focus on where the world changed, what persisted, and why the current point in time matters.",
  "State Evolution Charts":
    "Treat this as a metric-dynamics brief. Focus on relationships between rising and falling indicators and what those relationships imply structurally.",
  "Artifact Explorer":
    "Treat this as a contribution brief. Focus on the selected artifact or visible artifact cluster and how it is shaping the world state.",
  "Transition Inspector":
    "Treat this as an adjudication brief. Focus on why the transition matters, what evidence carries the transition, and how strong the structural case appears to be.",
  "Conditional Projection":
    "Treat this as a forward-structure brief. Focus on threshold proximity, continuation dynamics, and what the projection suggests under the stated assumptions.",
  "Counterfactual Sandbox":
    "Treat this as a sensitivity brief. Focus on what the modified scenario changes, what remains persistent, and what the comparison says about dependence on specific artifacts.",
  "Narrative World Map":
    "Treat this as a topology brief. Focus on concentration, clustering, link density, and what areas of the world appear structurally central right now.",
  "World Boundary":
    "Treat this as a scoping brief. Focus on what is in scope, what that means for interpretation, and how the boundary shapes the validity of the world readout.",
  "Governance Panel":
    "Treat this as a governance brief. Focus on limits, safeguards, and how the current posture constrains appropriate decision use.",
};

const analysisAngles = [
  "Compare the strongest signal against the weakest signal and explain the tension.",
  "Focus on what appears to be changing fastest and why that matters.",
  "Focus on what looks persistent rather than merely noisy.",
  "Highlight the most decision-relevant change visible right now.",
  "Describe where the current state appears stable versus fragile.",
];

const hashText = (value: string) =>
  value.split("").reduce((accumulator, char) => (accumulator * 31 + char.charCodeAt(0)) >>> 0, 7);

export function getSavedOpenAiApiKey() {
  if (typeof window === "undefined") {
    return "";
  }

  const envKey = (import.meta.env.VITE_OPENAI_API_KEY as string | undefined) ?? "";
  if (envKey) {
    return envKey;
  }

  return window.localStorage.getItem(STORAGE_KEY) ?? "";
}

export function setSavedOpenAiApiKey(apiKey: string) {
  if (typeof window === "undefined") {
    return;
  }

  if (apiKey.trim()) {
    window.localStorage.setItem(STORAGE_KEY, apiKey.trim());
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export function hasOpenAiNarrationConfig() {
  return Boolean(getSavedOpenAiApiKey());
}

export function buildNarrationPrompt({
  sectionTitle,
  role,
  mode,
  worldBoundaryContext,
  summary,
  currentState,
  businessUse,
  decisionGuidance,
  rawContext,
}: NarrationRequest) {
  const targetLength = mode === "short" ? "90 to 130 words" : "170 to 240 words";
  const sectionLens =
    sectionLenses[sectionTitle] ??
    "Treat this as a live analytical brief. Focus on what is structurally happening now and why it matters.";
  const selectedAngle = analysisAngles[hashText(`${sectionTitle}:${currentState}:${rawContext?.join("|") ?? ""}`) % analysisAngles.length];

  return [
    "You are generating spoken narration for NWM Console, a governance-grade Narrative World Modeling interface.",
    "Write natural, plain-English audio narration for one live section of the console.",
    "Sound like a strong analyst or briefing officer speaking spontaneously after reviewing the panel, not like a template or product tour.",
    "Start from what stands out most in the live state, then connect it to the broader world, then explain why it matters for business decision support.",
    "Use the section purpose only briefly, if at all. Prioritize observations, relationships, contrasts, shifts, and implications.",
    "Do not sound scripted, templated, or repetitive across sections or repeated clicks.",
    "Avoid canned openings like 'This section shows', 'A firm can use this section', or 'In this scenario' unless there is no better phrasing.",
    "Do not mechanically restate every field. Select the most salient details and interpret them.",
    "You may describe what the system is inferring structurally about momentum, stability, pressure, reclassification risk, concentration, sensitivity, or phase direction, but those inferences must stay bounded to the modeled world state.",
    "Explain how the scenario can support company decision-making, such as timing review, contingency planning, escalation, monitoring priorities, capital allocation review, governance oversight, or executive briefings.",
    "You may be cautiously forward-looking, but do not claim certainty, truth, actor intent, or automated recommendations.",
    "Use phrases like 'may warrant', 'can support', or 'may indicate' instead of definitive prescriptions.",
    "Do not say the system predicts behavior, determines truth, infers beliefs, profiles actors, or automates decisions.",
    "Do not give orders or prescribe a single action. Frame decision support as human judgment support.",
    `Write in a ${role.toLowerCase()}-appropriate tone.`,
    `Keep it to roughly ${targetLength}.`,
    "Return only the narration text with no bullets, headings, or markdown.",
    "",
    `Section: ${sectionTitle}`,
    `Role: ${role}`,
    `Mode: ${mode}`,
    `Bounded world definition: ${worldBoundaryContext}`,
    `Section lens: ${sectionLens}`,
    `Interpretive angle for this brief: ${selectedAngle}`,
    `Brief orientation: ${summary}`,
    `Visible state and signals: ${currentState}`,
    rawContext?.length ? `Raw section context:\n${rawContext.map((item, index) => `${index + 1}. ${item}`).join("\n")}` : "",
    `Operational relevance: ${businessUse}`,
    decisionGuidance ? `Human-review guidance: ${decisionGuidance}` : "",
    "Cover these ideas naturally, not as headings:",
    "what is happening now",
    "how it pertains to the broader Narrative World and the World Boundary",
    "what structural inference is reasonable",
    "how it can help the company make a better governed decision",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function generateOpenAiNarration(request: NarrationRequest) {
  const response = await fetch("/api/openai/narration", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5-mini",
      input: buildNarrationPrompt(request),
      text: {
        verbosity: request.mode === "short" ? "low" : "medium",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI narration request failed: ${response.status} ${errorText}`);
  }

  const result = (await response.json()) as ResponsesApiResult;
  if (result.output_text?.trim()) {
    return result.output_text.trim();
  }

  const extractedText =
    result.output
      ?.flatMap((item) => item.content ?? [])
      .find((content) => content.type === "output_text" && content.text?.trim())
      ?.text?.trim() ?? "";

  return extractedText;
}

export async function generateOpenAiSpeechAudio(
  text: string,
  voiceProfile: VoiceProfile,
  role: AudioRole,
) {
  const response = await fetch("/api/openai/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: getOpenAiVoice(voiceProfile) as OpenAiSpeechVoice,
      input: text,
      format: "mp3",
      speed:
        {
          Executive: 1,
          Analyst: 0.96,
          Sandbox: 0.98,
          Oversight: 0.94,
        }[role],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI speech request failed: ${response.status} ${errorText}`);
  }

  return response.blob();
}
