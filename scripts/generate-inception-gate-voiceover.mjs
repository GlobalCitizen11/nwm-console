import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const narrationPath = path.join(rootDir, "docs", "inception-gate-deck-narration.json");
const envPath = path.join(rootDir, ".env.local");

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

async function getApiKey() {
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }
  if (process.env.VITE_OPENAI_API_KEY) {
    return process.env.VITE_OPENAI_API_KEY;
  }

  const envFile = await readFile(envPath, "utf8").catch(() => "");
  const parsed = parseEnv(envFile);
  return parsed.OPENAI_API_KEY || parsed.VITE_OPENAI_API_KEY || "";
}

async function main() {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error("Missing OpenAI API key in environment or .env.local.");
  }

  const narration = JSON.parse(await readFile(narrationPath, "utf8"));
  const voice = process.argv.includes("--voice")
    ? process.argv[process.argv.indexOf("--voice") + 1] || narration.voice || "coral"
    : narration.voice || "coral";
  const model = narration.model || "gpt-4o-mini-tts";
  const outputDir = path.join(rootDir, "docs", "audio", "inception-gate");
  await mkdir(outputDir, { recursive: true });

  const manifest = [];

  for (const slide of narration.slides) {
    const outputPath = path.join(rootDir, "docs", slide.audioPath);
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        voice,
        format: "mp3",
        speed: 0.96,
        input: slide.script,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Speech generation failed for ${slide.slideId}: ${response.status} ${errorText}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
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
    `${JSON.stringify({ generatedAt: new Date().toISOString(), voice, model, slides: manifest }, null, 2)}\n`,
  );
  console.log(`Completed voiceover generation for ${manifest.length} slides.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
