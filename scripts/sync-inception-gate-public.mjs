import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const docsDir = path.join(rootDir, "docs");
const publicDeckDir = path.join(rootDir, "public", "inception-gate");

async function main() {
  await rm(publicDeckDir, { recursive: true, force: true });
  await mkdir(publicDeckDir, { recursive: true });

  await cp(path.join(docsDir, "inception-gate-deck.html"), path.join(publicDeckDir, "index.html"));
  await cp(path.join(docsDir, "inception-gate-deck.html"), path.join(publicDeckDir, "inception-gate-deck.html"));
  await cp(
    path.join(docsDir, "inception-gate-deck-narration.json"),
    path.join(publicDeckDir, "inception-gate-deck-narration.json"),
  );
  await cp(
    path.join(docsDir, "inception-gate-deck-audio-manifest.json"),
    path.join(publicDeckDir, "inception-gate-deck-audio-manifest.json"),
  );

  try {
    await cp(path.join(docsDir, "inception-gate-deck.pdf"), path.join(publicDeckDir, "inception-gate-deck.pdf"));
  } catch {
    // PDF export is optional for sync. Skip if it has not been generated yet.
  }

  await cp(path.join(docsDir, "audio"), path.join(publicDeckDir, "audio"), { recursive: true });
  console.log(`Synced Inception Gate deck assets to ${publicDeckDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
