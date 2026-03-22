import type { ExportMode } from "../types/export";

export async function playwrightPdf({
  mode,
  html,
  filename,
  orientation,
}: {
  mode: ExportMode;
  html: string;
  filename: string;
  orientation: "portrait" | "landscape";
}) {
  const response = await fetch("/api/briefings/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, html, filename, orientation }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}
