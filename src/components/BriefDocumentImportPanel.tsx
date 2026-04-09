import { useState } from "react";
import type { ScenarioDefinition, SourceType } from "../types";
import {
  buildBriefImportDraft,
  buildImportedScenarioFromBriefDraft,
  extractBriefTextFromFile,
  type BriefSourceFormat,
  type BriefImportDraft,
} from "../utils/briefImport";

const SOURCE_TYPE_OPTIONS: SourceType[] = ["policy", "legal", "market", "infrastructure", "sovereign", "media"];
const LEVEL_OPTIONS = ["high", "medium", "low"] as const;

const splitList = (value: string) =>
  value
    .split(/[|,;/]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

const parseSourceClasses = (value: string) =>
  splitList(value).filter((entry): entry is SourceType => SOURCE_TYPE_OPTIONS.includes(entry.toLowerCase() as SourceType));

const addMonthsIso = (dateIso: string, months: number) => {
  const base = dateIso ? new Date(`${dateIso}T00:00:00Z`) : new Date();
  const date = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + months, 1));
  return date.toISOString().slice(0, 10);
};

const buildBlankEvent = (draft: BriefImportDraft | null) => {
  const nextIndex = (draft?.events.length ?? 0) + 1;
  const previousDate = draft?.events[draft.events.length - 1]?.date ?? new Date().toISOString().slice(0, 10);
  return {
    id: `brief-event-${nextIndex}`,
    title: "",
    date: addMonthsIso(previousDate, 1),
    description: "",
    source: "Uploaded brief",
    eventType: "policy",
    confidenceLevel: "medium",
    severityLevel: "medium",
    affectedDomains: ["brief-upload"],
    tags: [],
    narrativeSignificance: "",
  };
};

interface RemoteBriefResponse {
  url: string;
  finalUrl: string;
  fileName: string;
  contentType: string;
  byteLength: number;
  dataBase64: string;
  extractedText?: string;
  extractedFormat?: BriefSourceFormat;
  extractionStrategy?: "document" | "html-static" | "html-rendered";
}

interface RemoteBriefErrorResponse {
  error?: string;
}

type ExtractionStrategy = NonNullable<RemoteBriefResponse["extractionStrategy"]>;

interface ResolutionSummary {
  sourceLabel: string;
  byteLength: number;
  extractionStrategy: ExtractionStrategy;
}

const decodeBase64ToUint8Array = (value: string) => {
  const binary = window.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

const parseRemoteBriefResponse = (rawBody: string) => {
  const trimmed = rawBody.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed) as Partial<RemoteBriefResponse> & RemoteBriefErrorResponse;
  } catch {
    throw new Error("URL ingest relay returned a non-JSON response. Restart the local console server and try again.");
  }
};

const formatSourceSize = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

const describeExtractionStrategy = (strategy: ExtractionStrategy) =>
  strategy === "html-rendered"
    ? "Rendered webpage"
    : strategy === "html-static"
      ? "Page text"
      : "Document";

export function BriefDocumentImportPanel({
  onImport,
}: {
  onImport: (scenario: ScenarioDefinition) => void;
}) {
  const [briefFile, setBriefFile] = useState<File | null>(null);
  const [briefUrl, setBriefUrl] = useState("");
  const [draft, setDraft] = useState<BriefImportDraft | null>(null);
  const [status, setStatus] = useState("Upload a brief, extract a normalized draft, review it, then import it into the console.");
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [lastResolution, setLastResolution] = useState<ResolutionSummary | null>(null);

  const extractFromFile = async (file: File, sourceLabel?: string) => {
    const extracted = await extractBriefTextFromFile(file);
    return extractFromText({
      fileName: file.name,
      text: extracted.text,
      format: extracted.format,
      sourceLabel,
    });
  };

  const extractFromText = ({
    fileName,
    text,
    format,
    sourceLabel,
  }: {
    fileName: string;
    text: string;
    format: BriefSourceFormat;
    sourceLabel?: string;
  }) => {
    const nextDraft = buildBriefImportDraft({
      fileName,
      text,
      format,
    });
    setDraft(nextDraft);
    setWarnings(nextDraft.warnings);
    const nextStatus =
      nextDraft.events.length > 0
        ? `Extracted ${nextDraft.events.length} reviewable events from ${sourceLabel ?? fileName}.`
        : `Extracted brief text from ${sourceLabel ?? fileName}, but no events were detected automatically. Review the text and add events manually.`;
    setStatus(nextStatus);
    return nextDraft;
  };

  const fetchUrlFile = async (url: string) => {
    const response = await fetch("/api/briefings/url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    const rawBody = await response.text();
    const payload = parseRemoteBriefResponse(rawBody);
    if (!response.ok) {
      if (response.status === 404 && !payload) {
        throw new Error("URL ingest relay is unavailable. Restart the local console server and try again.");
      }

      throw new Error(payload?.error ?? `Remote URL returned ${response.status}.`);
    }

    if (!payload) {
      throw new Error("URL ingest relay returned an empty response. Restart the local console server and try again.");
    }

    if (!payload.fileName || !payload.contentType || !payload.dataBase64 || !payload.finalUrl) {
      throw new Error("Remote URL response was incomplete.");
    }

    const bytes = decodeBase64ToUint8Array(payload.dataBase64);
    return {
      file: new File([bytes], payload.fileName, { type: payload.contentType }),
      finalUrl: payload.finalUrl,
      byteLength: payload.byteLength ?? bytes.byteLength,
      extractedText: payload.extractedText,
      extractedFormat: payload.extractedFormat,
      extractionStrategy: payload.extractionStrategy ?? "document",
    };
  };

  const resolveDraftFromCurrentInput = async () => {
    if (briefUrl.trim()) {
      const remote = await fetchUrlFile(briefUrl.trim());
      const nextDraft =
        remote.extractedText && remote.extractedFormat
          ? extractFromText({
              fileName: remote.file.name,
              text: remote.extractedText,
              format: remote.extractedFormat,
              sourceLabel: remote.finalUrl,
            })
          : await extractFromFile(remote.file, remote.finalUrl);
      setBriefFile(remote.file);
      const resolution = {
        draft: nextDraft,
        sourceLabel: remote.finalUrl,
        byteLength: remote.byteLength,
        extractionStrategy: remote.extractionStrategy,
      };
      setLastResolution(resolution);
      return resolution;
    }

    if (!briefFile) {
      throw new Error("Choose a URL or upload a PDF, text, markdown, HTML, or DOCX brief first.");
    }

    const resolution = {
      draft: await extractFromFile(briefFile),
      sourceLabel: briefFile.name,
      byteLength: briefFile.size,
      extractionStrategy: "document" as const,
    };
    setLastResolution(resolution);
    return resolution;
  };

  const importDraftToConsole = (nextDraft: BriefImportDraft) => {
    const { normalizedDraft, scenario, validationWarnings } = buildImportedScenarioFromBriefDraft({
      draft: nextDraft,
      id: `imported-${Date.now()}`,
    });
    onImport(scenario);
    setDraft(normalizedDraft);
    setWarnings(validationWarnings);
    setError(null);
    return scenario;
  };

  const handleExtract = async () => {
    try {
      setExtracting(true);
      setError(null);
      setWarnings([]);
      const resolved = await resolveDraftFromCurrentInput();
      if (briefUrl.trim()) {
        setStatus(
          resolved.draft.events.length > 0
            ? `Fetched ${Math.max(1, Math.round(resolved.byteLength / 1024))} KB from ${resolved.sourceLabel} and extracted a reviewable draft via ${resolved.extractionStrategy === "html-rendered" ? "rendered webpage" : resolved.extractionStrategy === "html-static" ? "page text" : "document"} ingestion.`
            : `Fetched ${Math.max(1, Math.round(resolved.byteLength / 1024))} KB from ${resolved.sourceLabel} and extracted readable page text. Review the draft and add events manually if needed.`
        );
      }
    } catch (caught) {
      const rawMessage = caught instanceof Error ? caught.message : "Brief extraction failed.";
      const message =
        briefUrl.trim() && rawMessage === "The uploaded brief was empty after text extraction."
          ? "The URL returned a document with no readable brief text. Try a direct PDF, HTML, text, markdown, or DOCX file URL, or download the file and upload it directly."
          : rawMessage;
      setError(message);
      setStatus("Brief extraction failed.");
      setDraft(null);
      setWarnings([]);
    } finally {
      setExtracting(false);
    }
  };

  const handleIngestToConsole = async () => {
    try {
      setIngesting(true);
      setError(null);
      setWarnings([]);
      const resolved = await resolveDraftFromCurrentInput();

      if (resolved.draft.events.length === 0) {
        setStatus(
          briefUrl.trim()
            ? `Fetched ${Math.max(1, Math.round(resolved.byteLength / 1024))} KB from ${resolved.sourceLabel} and synthesized a bounded world draft, but no event sequence was strong enough to auto-load the console. Review the draft and add events manually.`
            : `Synthesized a bounded world draft from ${resolved.sourceLabel}, but no event sequence was strong enough to auto-load the console. Review the draft and add events manually.`
        );
        return;
      }

      const scenario = importDraftToConsole(resolved.draft);
      setStatus(
        briefUrl.trim()
          ? `Ingested ${scenario.label} from ${resolved.sourceLabel} and loaded it into the console for analysis across all views.`
          : `Ingested ${scenario.label} from ${resolved.sourceLabel} and loaded it into the console for analysis across all views.`
      );
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Console ingest failed.";
      setError(message);
      setStatus("Console ingest failed.");
    } finally {
      setIngesting(false);
    }
  };

  const handleImport = () => {
    try {
      if (!draft) {
        throw new Error("Extract and review a brief draft before importing.");
      }
      const scenario = importDraftToConsole(draft);
      setStatus(`Imported brief scenario: ${scenario.label}`);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Brief import failed.";
      setError(message);
      setStatus("Brief import failed.");
    }
  };

  const updateWorldField = <K extends keyof BriefImportDraft["world"]>(field: K, value: BriefImportDraft["world"][K]) => {
    setDraft((current) => (current ? { ...current, world: { ...current.world, [field]: value } } : current));
  };

  const updateEventField = <K extends keyof BriefImportDraft["events"][number]>(
    index: number,
    field: K,
    value: BriefImportDraft["events"][number][K],
  ) => {
    setDraft((current) => {
      if (!current) return current;
      const nextEvents = [...current.events];
      nextEvents[index] = { ...nextEvents[index], [field]: value };
      return { ...current, events: nextEvents };
    });
  };

  const activeSource = briefUrl.trim()
    ? { label: briefUrl.trim(), kind: "URL", detail: "URL takes priority when both inputs are populated." }
    : briefFile
      ? { label: briefFile.name, kind: "File", detail: `${formatSourceSize(briefFile.size)} local upload` }
      : { label: "No source selected", kind: "Pending", detail: "Provide either a URL or a file to start." };

  const readinessLabel = draft
    ? draft.events.length > 0
      ? "Ready to load"
      : "Draft needs events"
    : "No draft";

  const readinessDetail = draft
    ? draft.events.length > 0
      ? `${draft.events.length} synthesized events can populate all views.`
      : "Readable text exists, but event structure still needs review."
    : "Extract first if you want to inspect before loading.";

  const lastResolutionLabel = lastResolution
    ? `${describeExtractionStrategy(lastResolution.extractionStrategy)} | ${formatSourceSize(lastResolution.byteLength)}`
    : "Awaiting extraction";

  return (
    <div className="mt-4 space-y-4">
      <div className="surface-panel-subtle p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="section-kicker">Brief Ingest</p>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Use a live webpage or uploaded brief to synthesize a bounded world. If the extracted material is strong enough, the console can load it directly into every view.
            </p>
          </div>
          <div className="surface-panel-subtle px-3 py-2 text-right text-sm text-muted">
            <p>Primary action: <span className="text-ink">Ingest To Console</span></p>
            <p className="mt-1">Fallback: <span className="text-ink">Extract Draft</span> for manual review.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.95fr)]">
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="control-stack">
                <span className="control-label">Remote URL</span>
                <input
                  className="control-input"
                  type="url"
                  value={briefUrl}
                  placeholder="https://example.com/brief.html"
                  onChange={(event) => {
                    setBriefUrl(event.target.value);
                    setError(null);
                  }}
                />
              </label>
              <label className="control-stack">
                <span className="control-label">Brief file</span>
                <input
                  className="control-input"
                  type="file"
                  accept=".pdf,.txt,.md,.markdown,.html,.htm,.docx,application/pdf,text/plain,text/markdown,text/html,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(event) => {
                    setBriefFile(event.target.files?.[0] ?? null);
                    setError(null);
                  }}
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <button className="action-button border-muted bg-shell/90" onClick={handleIngestToConsole} disabled={extracting || ingesting}>
                {ingesting ? "Ingesting..." : "Ingest To Console"}
              </button>
              <button className="action-button" onClick={handleExtract} disabled={extracting || ingesting}>
                {extracting ? "Extracting..." : "Extract Draft"}
              </button>
              <button
                className="action-button"
                onClick={() => {
                  setBriefFile(null);
                  setBriefUrl("");
                  setDraft(null);
                  setWarnings([]);
                  setError(null);
                  setLastResolution(null);
                  setStatus("Upload a brief, extract a normalized draft, review it, then import it into the console.");
                }}
              >
                Reset
              </button>
            </div>

            <p className="text-sm text-muted">
              Supports direct URLs plus `.pdf`, `.txt`, `.md`, `.html`, and `.docx`. Remote webpages are normalized into readable text server-side, and JS-rendered pages can fall back to a headless browser pass. PDF extraction is best on machine-generated text PDFs; scanned image PDFs still need OCR.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-md border border-edge/60 bg-panel/35 p-3">
              <p className="section-kicker">Active Source</p>
              <p className="mt-2 text-sm text-ink">{activeSource.label}</p>
              <p className="mt-2 text-xs text-muted">{activeSource.kind} | {activeSource.detail}</p>
            </div>
            <div className="rounded-md border border-edge/60 bg-panel/35 p-3">
              <p className="section-kicker">Last Extraction</p>
              <p className="mt-2 text-sm text-ink">{lastResolutionLabel}</p>
              <p className="mt-2 text-xs text-muted">
                {lastResolution ? lastResolution.sourceLabel : "No extraction has been run in this session."}
              </p>
            </div>
            <div className="rounded-md border border-edge/60 bg-panel/35 p-3">
              <p className="section-kicker">Console Readiness</p>
              <p className="mt-2 text-sm text-ink">{readinessLabel}</p>
              <p className="mt-2 text-xs text-muted">{readinessDetail}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-edge/60 bg-panel/30 p-3">
          <p className="section-kicker">Status</p>
          <p className="mt-2 text-sm text-muted">{status}</p>
          {error ? <p className="mt-3 text-sm text-phaseRed">{error}</p> : null}
        </div>
      </div>

      {warnings.length > 0 ? (
        <div className="surface-panel-subtle p-4">
          <p className="section-kicker">Extraction Warnings</p>
          <div className="mt-3 space-y-2 text-sm text-muted">
            {warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        </div>
      ) : null}

      {draft ? (
        <>
          <div className="surface-panel-subtle p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="section-kicker">Review Draft</p>
                <p className="mt-2 text-sm text-muted">
                  Confirm the bounded world fields and event chronology before import. This draft will feed the same deterministic replay and export pipeline as any other scenario.
                </p>
              </div>
              <div className="text-sm text-muted">
                <p>Source file: <span className="text-ink">{draft.fileName}</span></p>
                <p className="mt-2">Format: <span className="text-ink">{draft.format.toUpperCase()}</span></p>
                <p className="mt-2">Events: <span className="text-ink">{draft.events.length}</span></p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-md border border-edge/60 bg-panel/35 p-3">
                <p className="section-kicker">Scenario</p>
                <p className="mt-2 text-sm text-ink">{draft.world.name}</p>
              </div>
              <div className="rounded-md border border-edge/60 bg-panel/35 p-3">
                <p className="section-kicker">Geography</p>
                <p className="mt-2 text-sm text-ink">{draft.world.geography}</p>
              </div>
              <div className="rounded-md border border-edge/60 bg-panel/35 p-3">
                <p className="section-kicker">Horizon</p>
                <p className="mt-2 text-sm text-ink">{draft.world.timeHorizonMonths} months</p>
              </div>
              <div className="rounded-md border border-edge/60 bg-panel/35 p-3">
                <p className="section-kicker">Source Classes</p>
                <p className="mt-2 text-sm text-ink">{draft.world.sourceClasses.join(", ") || "Pending"}</p>
              </div>
            </div>

            <details open className="mt-4 rounded-md border border-edge/60 bg-panel/25 p-4">
              <summary className="cursor-pointer list-none text-sm font-medium text-ink">World Framing</summary>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="control-stack">
                  <span className="control-label">Scenario name</span>
                  <input className="control-input" value={draft.world.name} onChange={(event) => updateWorldField("name", event.target.value)} />
                </label>
                <label className="control-stack">
                  <span className="control-label">Domain</span>
                  <input className="control-input" value={draft.world.domain} onChange={(event) => updateWorldField("domain", event.target.value)} />
                </label>
                <label className="control-stack">
                  <span className="control-label">Geography</span>
                  <input className="control-input" value={draft.world.geography} onChange={(event) => updateWorldField("geography", event.target.value)} />
                </label>
                <label className="control-stack">
                  <span className="control-label">Time horizon months</span>
                  <input
                    className="control-input"
                    type="number"
                    min={1}
                    value={draft.world.timeHorizonMonths}
                    onChange={(event) => updateWorldField("timeHorizonMonths", Math.max(1, Number(event.target.value) || 1))}
                  />
                </label>
                <label className="control-stack md:col-span-2">
                  <span className="control-label">Bounded description</span>
                  <textarea
                    className="control-input min-h-[96px]"
                    value={draft.world.boundedDescription}
                    onChange={(event) => updateWorldField("boundedDescription", event.target.value)}
                  />
                </label>
                <label className="control-stack md:col-span-2">
                  <span className="control-label">Summary</span>
                  <textarea className="control-input min-h-[96px]" value={draft.world.summary} onChange={(event) => updateWorldField("summary", event.target.value)} />
                </label>
                <label className="control-stack md:col-span-2">
                  <span className="control-label">Source classes</span>
                  <input
                    className="control-input"
                    value={draft.world.sourceClasses.join(", ")}
                    onChange={(event) => updateWorldField("sourceClasses", parseSourceClasses(event.target.value))}
                    placeholder="policy, legal, market, infrastructure, sovereign, media"
                  />
                </label>
              </div>
            </details>

            <div className="mt-4 flex flex-wrap gap-2">
              <button className="action-button border-muted bg-shell/90" onClick={handleImport}>
                Load Draft Into Console
              </button>
              <button className="action-button" onClick={() => setDraft((current) => (current ? { ...current, events: [...current.events, buildBlankEvent(current)] } : current))}>
                Add Event
              </button>
            </div>
          </div>

          <details open className="surface-panel-subtle p-4">
            <summary className="cursor-pointer list-none text-sm font-medium text-ink">
              Event Sequence ({draft.events.length})
            </summary>
            <div className="mt-4 space-y-3">
              {draft.events.map((event, index) => (
                <div key={`${event.id}-${index}`} className="rounded-md border border-edge/60 bg-panel/25 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="section-kicker">Event {index + 1}</p>
                      <p className="mt-1 text-sm text-muted">Review date, type, source, and consequence before import.</p>
                    </div>
                    <button
                      className="action-button"
                      onClick={() =>
                        setDraft((current) =>
                          current
                            ? {
                                ...current,
                                events: current.events.filter((_, eventIndex) => eventIndex !== index),
                              }
                            : current,
                        )
                      }
                      disabled={draft.events.length <= 1}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <label className="control-stack">
                      <span className="control-label">Title</span>
                      <input className="control-input" value={event.title} onChange={(entry) => updateEventField(index, "title", entry.target.value)} />
                    </label>
                    <label className="control-stack">
                      <span className="control-label">Date</span>
                      <input className="control-input" type="date" value={event.date} onChange={(entry) => updateEventField(index, "date", entry.target.value)} />
                    </label>
                    <label className="control-stack">
                      <span className="control-label">Event type</span>
                      <input className="control-input" value={event.eventType} onChange={(entry) => updateEventField(index, "eventType", entry.target.value)} />
                    </label>
                    <label className="control-stack">
                      <span className="control-label">Source</span>
                      <input className="control-input" value={event.source} onChange={(entry) => updateEventField(index, "source", entry.target.value)} />
                    </label>
                    <label className="control-stack">
                      <span className="control-label">Confidence</span>
                      <select className="control-input" value={event.confidenceLevel} onChange={(entry) => updateEventField(index, "confidenceLevel", entry.target.value)}>
                        {LEVEL_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="control-stack">
                      <span className="control-label">Severity</span>
                      <select className="control-input" value={event.severityLevel} onChange={(entry) => updateEventField(index, "severityLevel", entry.target.value)}>
                        {LEVEL_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="control-stack lg:col-span-2">
                      <span className="control-label">Description</span>
                      <textarea className="control-input min-h-[92px]" value={event.description} onChange={(entry) => updateEventField(index, "description", entry.target.value)} />
                    </label>
                    <label className="control-stack">
                      <span className="control-label">Affected domains</span>
                      <input
                        className="control-input"
                        value={event.affectedDomains.join(", ")}
                        onChange={(entry) => updateEventField(index, "affectedDomains", splitList(entry.target.value))}
                      />
                    </label>
                    <label className="control-stack">
                      <span className="control-label">Tags</span>
                      <input className="control-input" value={event.tags.join(", ")} onChange={(entry) => updateEventField(index, "tags", splitList(entry.target.value))} />
                    </label>
                    <label className="control-stack lg:col-span-2">
                      <span className="control-label">Narrative significance</span>
                      <textarea
                        className="control-input min-h-[74px]"
                        value={event.narrativeSignificance}
                        onChange={(entry) => updateEventField(index, "narrativeSignificance", entry.target.value)}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </details>

          <details className="surface-panel-subtle p-4">
            <summary className="cursor-pointer list-none text-sm font-medium text-ink">Extracted Text Preview</summary>
            <div className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-sm leading-6 text-muted">
              {draft.extractedText.slice(0, 3200)}
              {draft.extractedText.length > 3200 ? "\n\n[truncated preview]" : ""}
            </div>
          </details>
        </>
      ) : null}
    </div>
  );
}
