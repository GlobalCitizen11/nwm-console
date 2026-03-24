import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = path.resolve("/Users/globalpoppasmurf/nwm-console");
const publicDeckDir = path.join(rootDir, "public", "inception-gate");
const distDir = path.join(rootDir, "dist");
const distDeckDir = path.join(distDir, "inception-gate");

async function main() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDeckDir, { recursive: true });

  await cp(publicDeckDir, distDeckDir, { recursive: true });

  const rootIndex = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0; url=/inception-gate/" />
    <title>Inception Gate Deck</title>
  </head>
  <body>
    <p>Redirecting to <a href="/inception-gate/">/inception-gate/</a>...</p>
  </body>
</html>
`;

  await writeFile(path.join(distDir, "index.html"), rootIndex);
  console.log(`Built static Inception Gate deck into ${distDeckDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
