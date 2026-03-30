import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const narrationPath = path.join(rootDir, "docs", "inception-gate-deck-narration.json");
const envPath = path.join(rootDir, ".env.local");

function getArgValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
}

function parseBoolean(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "y", "on"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "n", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function parseNumber(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseEnv(source) {
  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

async function loadEnv() {
  const envFile = await readFile(envPath, "utf8").catch(() => "");
  return parseEnv(envFile);
}

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "") || "";
}

function buildElevenLabsVoiceSettings(env) {
  const stability = parseNumber(pickFirst(process.env.ELEVENLABS_STABILITY, env.ELEVENLABS_STABILITY), null);
  const similarityBoost = parseNumber(
    pickFirst(process.env.ELEVENLABS_SIMILARITY_BOOST, env.ELEVENLABS_SIMILARITY_BOOST),
    null,
  );
  const style = parseNumber(pickFirst(process.env.ELEVENLABS_STYLE, env.ELEVENLABS_STYLE), null);
  const speed = parseNumber(pickFirst(process.env.ELEVENLABS_SPEED, env.ELEVENLABS_SPEED), null);
  const useSpeakerBoost = parseBoolean(
    pickFirst(process.env.ELEVENLABS_USE_SPEAKER_BOOST, env.ELEVENLABS_USE_SPEAKER_BOOST),
    null,
  );

  const voiceSettings = {
    ...(stability === null ? {} : { stability }),
    ...(similarityBoost === null ? {} : { similarity_boost: similarityBoost }),
    ...(style === null ? {} : { style }),
    ...(speed === null ? {} : { speed }),
    ...(useSpeakerBoost === null ? {} : { use_speaker_boost: useSpeakerBoost }),
  };

  return Object.keys(voiceSettings).length ? voiceSettings : null;
}

function getProviderConfig(narration, env) {
  const provider = pickFirst(
    getArgValue("--provider"),
    process.env.VOICEOVER_PROVIDER,
    env.VOICEOVER_PROVIDER,
    "openai",
  ).toLowerCase();

  if (provider === "elevenlabs") {
    const apiKey = pickFirst(process.env.ELEVENLABS_API_KEY, env.ELEVENLABS_API_KEY);
    const voiceId = pickFirst(getArgValue("--voice-id"), process.env.ELEVENLABS_VOICE_ID, env.ELEVENLABS_VOICE_ID);
    const model = pickFirst(getArgValue("--model"), process.env.ELEVENLABS_MODEL_ID, env.ELEVENLABS_MODEL_ID, "eleven_multilingual_v2");
    const outputFormat = pickFirst(
      getArgValue("--output-format"),
      process.env.ELEVENLABS_OUTPUT_FORMAT,
      env.ELEVENLABS_OUTPUT_FORMAT,
      "mp3_44100_128",
    );
    const languageCode = pickFirst(
      getArgValue("--language-code"),
      process.env.ELEVENLABS_LANGUAGE_CODE,
      env.ELEVENLABS_LANGUAGE_CODE,
    );

    if (!apiKey) {
      throw new Error("Missing ElevenLabs API key. Set ELEVENLABS_API_KEY in the environment or .env.local.");
    }
    if (!voiceId) {
      throw new Error("Missing ElevenLabs voice ID. Set ELEVENLABS_VOICE_ID or pass --voice-id.");
    }

    return {
      provider,
      apiKey,
      voiceId,
      voiceLabel: pickFirst(process.env.ELEVENLABS_VOICE_NAME, env.ELEVENLABS_VOICE_NAME, voiceId),
      model,
      outputFormat,
      languageCode,
      voiceSettings: buildElevenLabsVoiceSettings(env),
    };
  }

  const apiKey = pickFirst(process.env.OPENAI_API_KEY, process.env.VITE_OPENAI_API_KEY, env.OPENAI_API_KEY, env.VITE_OPENAI_API_KEY);
  if (!apiKey) {
    throw new Error("Missing OpenAI API key in environment or .env.local.");
  }

  return {
    provider: "openai",
    apiKey,
    voice: pickFirst(getArgValue("--voice"), narration.voice, "coral"),
    model: pickFirst(getArgValue("--model"), narration.model, "gpt-4o-mini-tts"),
    speed: parseNumber(pickFirst(getArgValue("--speed"), process.env.OPENAI_TTS_SPEED, env.OPENAI_TTS_SPEED), 0.93),
  };
}

async function generateOpenAiSpeech(slide, config) {
  const voiceInput = slide.voiceScript || slide.script;
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      voice: config.voice,
      format: "mp3",
      speed: config.speed,
      input: voiceInput,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Speech generation failed for ${slide.slideId}: ${response.status} ${errorText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function generateElevenLabsSpeech(slide, config) {
  const voiceInput = slide.voiceScript || slide.script;
  const query = new URLSearchParams({ output_format: config.outputFormat });
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}?${query.toString()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": config.apiKey,
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: voiceInput,
      model_id: config.model,
      ...(config.languageCode ? { language_code: config.languageCode } : {}),
      ...(config.voiceSettings ? { voice_settings: config.voiceSettings } : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Speech generation failed for ${slide.slideId}: ${response.status} ${errorText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  const env = await loadEnv();
  const narration = JSON.parse(await readFile(narrationPath, "utf8"));
  const config = getProviderConfig(narration, env);
  const outputDir = path.join(rootDir, "docs", "audio", "inception-gate");
  await mkdir(outputDir, { recursive: true });

  const manifest = [];

  for (const slide of narration.slides) {
    const outputPath = path.join(rootDir, "docs", slide.audioPath);
    const audioBuffer = config.provider === "elevenlabs"
      ? await generateElevenLabsSpeech(slide, config)
      : await generateOpenAiSpeech(slide, config);
    await writeFile(outputPath, audioBuffer);
    manifest.push({
      slideId: slide.slideId,
      title: slide.title,
      audioPath: slide.audioPath,
      bytes: audioBuffer.byteLength,
    });
    console.log(`Generated ${slide.slideId} -> ${slide.audioPath}`);
  }

  await writeFile(
    path.join(rootDir, "docs", "inception-gate-deck-audio-manifest.json"),
    `${JSON.stringify({
      generatedAt: new Date().toISOString(),
      provider: config.provider,
      voice: config.provider === "elevenlabs" ? config.voiceLabel : config.voice,
      voiceId: config.provider === "elevenlabs" ? config.voiceId : undefined,
      model: config.model,
      slides: manifest,
    }, null, 2)}\n`,
  );
  console.log(`Completed voiceover generation for ${manifest.length} slides.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
