interface PdfArtifactOptions {
  filename: string;
  html: string;
  orientation?: "portrait" | "landscape";
}

const parseArtifactHtml = (html: string) => {
  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");
  return {
    title: document.title,
    styles: Array.from(document.head.querySelectorAll("style"))
      .map((style) => style.textContent ?? "")
      .join("\n"),
    body: document.body.innerHTML,
  };
};

export async function downloadStyledPdfArtifact({
  filename,
  html,
  orientation = "portrait",
}: PdfArtifactOptions) {
  const { default: html2pdf } = await import("html2pdf.js");
  const parsed = parseArtifactHtml(html);

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-20000px";
  host.style.top = "0";
  host.style.width = orientation === "landscape" ? "1400px" : "1120px";
  host.style.pointerEvents = "none";
  host.style.opacity = "0";

  host.innerHTML = `
    <style>
      ${parsed.styles}
      .sheet { box-shadow: none !important; }
      .slide, .section, .meta-card, .system-chip, .note-band { break-inside: avoid; }
    </style>
    ${parsed.body}
  `;

  document.body.appendChild(host);

  try {
    await html2pdf()
      .set({
        filename,
        margin: [8, 8, 8, 8],
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#0c1117",
          scrollY: 0,
        },
        jsPDF: {
          unit: "mm",
          format: "letter",
          orientation,
        },
        pagebreak: {
          mode: ["css", "legacy"],
          avoid: ".section,.meta-card,.system-chip,.note-band",
        },
      } as never)
      .from(host)
      .save();
  } finally {
    document.body.removeChild(host);
  }
}
