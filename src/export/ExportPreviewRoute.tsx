import { useMemo } from "react";
import { readExportPreviewPayload } from "./storage";

const getToken = () => new URLSearchParams(window.location.search).get("token") ?? "";

export function ExportPreviewRoute() {
  const token = getToken();
  const payload = useMemo(() => readExportPreviewPayload(token), [token]);
  const bodyMarkup = useMemo(() => {
    if (!payload) {
      return "";
    }
    const parsed = new DOMParser().parseFromString(payload.html, "text/html");
    return parsed.body.innerHTML;
  }, [payload]);

  if (!payload) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0a1118", color: "#e8f0f6", fontFamily: "Inter, sans-serif" }}>
        <div style={{ maxWidth: 560, padding: 24, textAlign: "center" }}>
          <p style={{ letterSpacing: "0.16em", textTransform: "uppercase", fontSize: 12, color: "#8aa2b7" }}>Export Preview</p>
          <h1 style={{ fontSize: 32, margin: "12px 0" }}>Preview unavailable</h1>
          <p style={{ color: "#9db2c1", lineHeight: 1.6 }}>
            The export payload could not be found. Return to the console and regenerate the preview from the export panel.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#091018" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: 16,
          padding: "18px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(7, 12, 18, 0.94)",
          backdropFilter: "blur(12px)",
          color: "#eaf2f8",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#87a0b4" }}>Export Preview</div>
          <div style={{ marginTop: 8, fontSize: 20, fontWeight: 600 }}>{payload.metadata.scenarioName}</div>
          <div style={{ marginTop: 6, fontSize: 13, color: "#9cb2c1" }}>
            {payload.metadata.phase} | {payload.metadata.asOf}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {payload.qa.issues.length > 0 ? (
            <div style={{ fontSize: 12, color: "#d9b768" }}>{payload.qa.issues.length} layout warning{payload.qa.issues.length === 1 ? "" : "s"}</div>
          ) : (
            <div style={{ fontSize: 12, color: "#86c08a" }}>Layout QA passed</div>
          )}
          <button
            style={{
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(22, 33, 45, 0.96)",
              color: "#f4f8fb",
              padding: "10px 16px",
              fontWeight: 600,
              cursor: "pointer",
            }}
            onClick={async (event) => {
              const button = event.currentTarget as HTMLButtonElement;
              if (button) {
                button.textContent = "Preparing PDF...";
                button.disabled = true;
              }
              try {
                const response = await fetch("/api/briefings/pdf", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    html: payload.html,
                    filename: payload.filename,
                    orientation: payload.orientation,
                  }),
                });
                if (!response.ok) {
                  throw new Error(await response.text());
                }
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = payload.filename;
                anchor.click();
                window.URL.revokeObjectURL(url);
              } catch {
                window.print();
              } finally {
                if (button) {
                  button.textContent = "Download PDF";
                  button.disabled = false;
                }
              }
            }}
          >
            Download PDF
          </button>
        </div>
      </div>
      <div dangerouslySetInnerHTML={{ __html: bodyMarkup }} />
    </div>
  );
}
