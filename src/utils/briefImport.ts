import { loadScenarioDataset } from "../data/schema";
import type { ScenarioDefinition, SourceType, StructuralEffect, WorldDefinition, ScenarioDataset } from "../types";
import { buildScenarioFromSource, type SourceEventSet, type SourceWorldDefinition } from "./sourceScenario";
import { validateScenarioDataset } from "./scenarioValidation";

export type BriefSourceFormat = "text" | "markdown" | "html" | "docx" | "pdf";

export interface BriefImportEventDraft {
  id: string;
  title: string;
  date: string;
  description: string;
  source: string;
  eventType: string;
  confidenceLevel: string;
  severityLevel: string;
  affectedDomains: string[];
  tags: string[];
  narrativeSignificance: string;
}

export interface BriefImportDraft {
  fileName: string;
  format: BriefSourceFormat;
  extractedText: string;
  warnings: string[];
  world: {
    name: string;
    domain: string;
    geography: string;
    timeHorizonMonths: number;
    governanceMode: WorldDefinition["governanceMode"];
    boundedDescription: string;
    summary: string;
    sourceClasses: SourceType[];
  };
  events: BriefImportEventDraft[];
}

interface ExtractedBriefText {
  format: BriefSourceFormat;
  text: string;
}

interface DomainRule {
  label: string;
  sourceType: SourceType;
  keywords: string[];
}

const GENERIC_TITLES = new Set([
  "executive brief",
  "briefing note",
  "briefing memo",
  "situation report",
  "status update",
  "memorandum",
  "brief",
  "report",
]);

const DOMAIN_RULES: DomainRule[] = [
  {
    label: "policy",
    sourceType: "policy",
    keywords: ["policy", "government", "ministry", "agency", "committee", "cabinet", "guidance", "directive", "industrial policy"],
  },
  {
    label: "legal",
    sourceType: "legal",
    keywords: ["law", "legal", "regulation", "regulatory", "court", "litigation", "antitrust", "compliance", "license", "export control", "sanction"],
  },
  {
    label: "market",
    sourceType: "market",
    keywords: ["market", "capital", "pricing", "investment", "funding", "revenue", "acquisition", "valuation", "investor", "customer"],
  },
  {
    label: "infrastructure",
    sourceType: "infrastructure",
    keywords: ["compute", "cloud", "semiconductor", "chip", "data center", "datacenter", "infrastructure", "grid", "network", "supply chain", "fab"],
  },
  {
    label: "sovereign",
    sourceType: "sovereign",
    keywords: ["sovereign", "national", "state", "security", "defense", "strategic autonomy", "strategic infrastructure"],
  },
  {
    label: "media",
    sourceType: "media",
    keywords: ["media", "press", "coverage", "interview", "briefing", "statement", "commentary", "leak", "rumor"],
  },
];

const GEOGRAPHY_RULES = [
  { label: "United States", patterns: [/\bunited states\b/i, /\bu\.s\.\b/i, /\bus\b/] },
  { label: "China", patterns: [/\bchina\b/i, /\bprc\b/i] },
  { label: "European Union", patterns: [/\beuropean union\b/i, /\beu\b/] },
  { label: "United Kingdom", patterns: [/\bunited kingdom\b/i, /\buk\b/] },
  { label: "India", patterns: [/\bindia\b/i] },
  { label: "Japan", patterns: [/\bjapan\b/i] },
  { label: "Taiwan", patterns: [/\btaiwan\b/i] },
  { label: "South Korea", patterns: [/\bsouth korea\b/i, /\bkorea\b/i] },
  { label: "Canada", patterns: [/\bcanada\b/i] },
  { label: "Middle East", patterns: [/\bmiddle east\b/i, /\bgulf\b/i, /\buae\b/i, /\bsaudi\b/i] },
  { label: "Latin America", patterns: [/\blatin america\b/i, /\bbrasil\b/i, /\bbrazil\b/i, /\bmexico\b/i] },
  { label: "Southeast Asia", patterns: [/\bsoutheast asia\b/i, /\basean\b/i, /\bsingapore\b/i] },
  { label: "Australia", patterns: [/\baustralia\b/i] },
];

const DATE_PATTERNS = [
  /\b\d{4}-\d{2}-\d{2}\b/,
  /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/,
  /\b(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+\d{1,2},\s+\d{4}\b/i,
  /\b(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+\d{4}\b/i,
  /\bQ[1-4]\s+\d{4}\b/i,
];

const SOURCE_PATTERN = /\bsource(?:s)?\s*[:\-]\s*(.+)$/i;
const CONFIDENCE_PATTERN = /\bconfidence\s*[:\-]\s*(high|medium|low)\b/i;
const SEVERITY_PATTERN = /\bseverity\s*[:\-]\s*(high|medium|low)\b/i;
const HEADED_VALUE_PATTERN = /^(title|scenario|subject|world|name|domain|geography|region|scope|summary|overview|as of|time horizon)\s*[:\-]\s*(.+)$/i;
const HEADING_PATTERN = /^[A-Z][A-Z\s/&-]{3,}$/;
const BULLET_PATTERN = /^[-*•]\s+/;
const ORDERED_BULLET_PATTERN = /^\d+[.)]\s+/;

const xmlEntityMap: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

const clean = (text: string) => text.replace(/\s+/g, " ").trim();

const wordCount = (text: string) => clean(text).split(/\s+/).filter(Boolean).length;

const titleCase = (value: string) =>
  value
    .split(/[\s/-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const truncateWords = (text: string, maxWords: number) => {
  const words = clean(text).split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return words.join(" ");
  }
  return `${words.slice(0, maxWords).join(" ")}...`;
};

const splitList = (value: string) =>
  value
    .split(/[|,;/]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

const unique = <T,>(items: T[]) => Array.from(new Set(items));

const slugify = (value: string) =>
  clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "imported-brief";

const normalizeText = (text: string) =>
  text
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const splitBlocks = (text: string) =>
  normalizeText(text)
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

const splitLines = (text: string) =>
  normalizeText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const decodeXmlEntities = (text: string) =>
  text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, (match) => xmlEntityMap[match] ?? match);

const decodeByteText = (bytes: Uint8Array) => {
  if (
    bytes.length >= 2 &&
    ((bytes[0] === 0xfe && bytes[1] === 0xff) || (bytes[0] === 0xff && bytes[1] === 0xfe))
  ) {
    return new TextDecoder(bytes[0] === 0xfe ? "utf-16be" : "utf-16le").decode(bytes);
  }

  const nullByteCount = bytes.filter((byte) => byte === 0).length;
  if (nullByteCount > 0 && nullByteCount >= Math.floor(bytes.length / 4)) {
    return new TextDecoder("utf-16be").decode(bytes);
  }

  return new TextDecoder("latin1").decode(bytes);
};

const extractHtmlMetadata = (html: string) => {
  const parts: string[] = [];
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch?.[1]) {
    parts.push(titleMatch[1]);
  }

  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    const name = tag.match(/\b(?:name|property)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
    const content = tag.match(/\bcontent\s*=\s*["']([\s\S]*?)["']/i)?.[1];
    if (!name || !content) {
      continue;
    }

    if (["description", "og:title", "og:description", "twitter:title", "twitter:description"].includes(name)) {
      parts.push(content);
    }
  }

  return unique(parts.map((part) => clean(decodeXmlEntities(part))).filter(Boolean));
};

const stripHtmlToText = (html: string) => {
  const metadata = extractHtmlMetadata(html);

  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("script, style, noscript, template").forEach((node) => node.remove());
    const bodyText = normalizeText(doc.body.textContent ?? "");
    return normalizeText([...metadata, bodyText].filter(Boolean).join("\n\n"));
  }

  const bodyText = normalizeText(
    decodeXmlEntities(
      html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
        .replace(/<template[\s\S]*?<\/template>/gi, " ")
        .replace(/<[^>]+>/g, " "),
    ),
  );
  return normalizeText([...metadata, bodyText].filter(Boolean).join("\n\n"));
};

const getUint16 = (view: DataView, offset: number) => view.getUint16(offset, true);
const getUint32 = (view: DataView, offset: number) => view.getUint32(offset, true);

const findEndOfCentralDirectory = (bytes: Uint8Array) => {
  const minOffset = Math.max(0, bytes.length - 22 - 0xffff);
  for (let offset = bytes.length - 22; offset >= minOffset; offset -= 1) {
    if (
      bytes[offset] === 0x50 &&
      bytes[offset + 1] === 0x4b &&
      bytes[offset + 2] === 0x05 &&
      bytes[offset + 3] === 0x06
    ) {
      return offset;
    }
  }
  throw new Error("DOCX extraction failed: ZIP directory footer was not found.");
};

interface ZipEntry {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  localHeaderOffset: number;
}

const parseZipEntries = (bytes: Uint8Array) => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocdOffset = findEndOfCentralDirectory(bytes);
  const entryCount = getUint16(view, eocdOffset + 10);
  const centralDirectoryOffset = getUint32(view, eocdOffset + 16);

  const entries: ZipEntry[] = [];
  let offset = centralDirectoryOffset;

  for (let index = 0; index < entryCount; index += 1) {
    if (getUint32(view, offset) !== 0x02014b50) {
      throw new Error("DOCX extraction failed: ZIP central directory entry was invalid.");
    }

    const compressionMethod = getUint16(view, offset + 10);
    const compressedSize = getUint32(view, offset + 20);
    const fileNameLength = getUint16(view, offset + 28);
    const extraFieldLength = getUint16(view, offset + 30);
    const fileCommentLength = getUint16(view, offset + 32);
    const localHeaderOffset = getUint32(view, offset + 42);
    const nameBytes = bytes.slice(offset + 46, offset + 46 + fileNameLength);
    const name = new TextDecoder().decode(nameBytes);

    entries.push({ name, compressionMethod, compressedSize, localHeaderOffset });
    offset += 46 + fileNameLength + extraFieldLength + fileCommentLength;
  }

  return entries;
};

const inflateRaw = async (bytes: Uint8Array) => {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("DOCX extraction requires browser decompression support.");
  }

  const stream = new Blob([Uint8Array.from(bytes).buffer]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
};

const readZipEntryBytes = async (archive: Uint8Array, entry: ZipEntry) => {
  const view = new DataView(archive.buffer, archive.byteOffset, archive.byteLength);
  const localOffset = entry.localHeaderOffset;
  if (getUint32(view, localOffset) !== 0x04034b50) {
    throw new Error("DOCX extraction failed: ZIP local header was invalid.");
  }

  const fileNameLength = getUint16(view, localOffset + 26);
  const extraFieldLength = getUint16(view, localOffset + 28);
  const dataOffset = localOffset + 30 + fileNameLength + extraFieldLength;
  const compressed = archive.slice(dataOffset, dataOffset + entry.compressedSize);

  if (entry.compressionMethod === 0) {
    return compressed;
  }
  if (entry.compressionMethod === 8) {
    return inflateRaw(compressed);
  }

  throw new Error(`DOCX extraction failed: unsupported ZIP compression method ${entry.compressionMethod}.`);
};

const xmlToDocText = (xml: string) =>
  normalizeText(
    decodeXmlEntities(
      xml
        .replace(/<w:tab[^>]*\/>/g, "\t")
        .replace(/<w:br[^>]*\/>/g, "\n")
        .replace(/<\/w:p>/g, "\n\n")
        .replace(/<\/w:tr>/g, "\n")
        .replace(/<[^>]+>/g, " "),
    ),
  );

const extractDocxText = async (file: File) => {
  const archive = new Uint8Array(await file.arrayBuffer());
  const entries = parseZipEntries(archive)
    .filter((entry) => /^word\/(document|header\d+|footer\d+|footnotes|endnotes)\.xml$/.test(entry.name))
    .sort((left, right) => left.name.localeCompare(right.name));

  if (entries.length === 0) {
    throw new Error("DOCX extraction failed: no readable document XML parts were found.");
  }

  const parts: string[] = [];
  for (const entry of entries) {
    const bytes = await readZipEntryBytes(archive, entry);
    const xml = new TextDecoder().decode(bytes);
    const text = xmlToDocText(xml);
    if (text) {
      parts.push(text);
    }
  }

  return normalizeText(parts.join("\n\n"));
};

const inflatePdfStream = async (bytes: Uint8Array) => {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("PDF extraction requires browser decompression support.");
  }

  const stream = new Blob([Uint8Array.from(bytes).buffer]).stream().pipeThrough(new DecompressionStream("deflate"));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
};

const decodePdfLiteralString = (token: string) => {
  const source = token.startsWith("(") && token.endsWith(")") ? token.slice(1, -1) : token;
  const bytes: number[] = [];

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char !== "\\") {
      bytes.push(source.charCodeAt(index) & 0xff);
      continue;
    }

    const next = source[index + 1];
    if (!next) break;
    index += 1;

    if (/[0-7]/.test(next)) {
      const octal = `${next}${source[index + 1] ?? ""}${source[index + 2] ?? ""}`.match(/^[0-7]{1,3}/)?.[0] ?? next;
      bytes.push(Number.parseInt(octal, 8));
      index += octal.length - 1;
      continue;
    }

    const escaped = {
      n: 0x0a,
      r: 0x0d,
      t: 0x09,
      b: 0x08,
      f: 0x0c,
      "(": 0x28,
      ")": 0x29,
      "\\": 0x5c,
    }[next];

    if (typeof escaped === "number") {
      bytes.push(escaped);
      continue;
    }

    if (next === "\n" || next === "\r") {
      continue;
    }

    bytes.push(next.charCodeAt(0) & 0xff);
  }

  return clean(decodeByteText(new Uint8Array(bytes)).replace(/[\x00-\x08\x0b-\x1f]+/g, " "));
};

const decodePdfHexString = (token: string) => {
  const hex = token
    .replace(/[<>\s]/g, "")
    .replace(/[^0-9a-f]/gi, "");
  const padded = hex.length % 2 === 0 ? hex : `${hex}0`;
  const bytes = new Uint8Array(padded.length / 2);

  for (let index = 0; index < padded.length; index += 2) {
    bytes[index / 2] = Number.parseInt(padded.slice(index, index + 2), 16);
  }

  return clean(decodeByteText(bytes).replace(/[\x00-\x08\x0b-\x1f]+/g, " "));
};

const decodePdfTextToken = (token: string) => {
  if (token.startsWith("(")) {
    return decodePdfLiteralString(token);
  }
  if (token.startsWith("<")) {
    return decodePdfHexString(token);
  }
  return "";
};

const extractPdfTextFromContent = (content: string) => {
  const sections = Array.from(content.matchAll(/BT([\s\S]*?)ET/g));
  const activeSections = sections.length > 0 ? sections.map((match) => match[1]) : [content];
  const decodedSections: string[] = [];

  for (const section of activeSections) {
    const sectionChunks: string[] = [];
    const showPattern =
      /\[(?<array>[\s\S]*?)\]\s*TJ|(?<single>\((?:\\.|[^\\()])*\)|<[0-9a-fA-F\s]+>)\s*Tj|(?<quote>\((?:\\.|[^\\()])*\)|<[0-9a-fA-F\s]+>)\s*'|(?:-?\d+(?:\.\d+)?\s+){2}(?<double>\((?:\\.|[^\\()])*\)|<[0-9a-fA-F\s]+>)\s*"/g;

    let match: RegExpExecArray | null;
    while ((match = showPattern.exec(section)) !== null) {
      if (match.groups?.array) {
        const parts = Array.from(match.groups.array.matchAll(/\((?:\\.|[^\\()])*\)|<[0-9a-fA-F\s]+>/g))
          .map((part) => decodePdfTextToken(part[0]))
          .filter(Boolean);
        if (parts.length > 0) {
          sectionChunks.push(parts.join(" "));
        }
        continue;
      }

      const token = match.groups?.single ?? match.groups?.quote ?? match.groups?.double ?? "";
      const decoded = decodePdfTextToken(token);
      if (decoded) {
        sectionChunks.push(decoded);
      }
    }

    const sectionText = clean(sectionChunks.join(" "));
    if (sectionText) {
      decodedSections.push(sectionText);
    }
  }

  return normalizeText(decodedSections.join("\n\n"));
};

const extractPdfText = async (file: File) => {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdfText = new TextDecoder("latin1").decode(bytes);
  const extractedSections: string[] = [];
  const streamPattern = /<<(.*?)>>\s*stream\r?\n/gms;
  let match: RegExpExecArray | null;

  while ((match = streamPattern.exec(pdfText)) !== null) {
    const dictionary = match[1] ?? "";
    const start = match.index + match[0].length;
    let end = pdfText.indexOf("endstream", start);
    if (end < 0) {
      break;
    }
    while (end > start && (pdfText.charCodeAt(end - 1) === 10 || pdfText.charCodeAt(end - 1) === 13)) {
      end -= 1;
    }

    const rawStream = bytes.slice(start, end);
    let decodedBytes = rawStream;

    if (/\/Filter\s*\[\s*\/FlateDecode/i.test(dictionary) || /\/Filter\s*\/FlateDecode/i.test(dictionary)) {
      try {
        decodedBytes = await inflatePdfStream(rawStream);
      } catch {
        continue;
      }
    } else if (/\/Filter\s*\//i.test(dictionary)) {
      continue;
    }

    const text = extractPdfTextFromContent(new TextDecoder("latin1").decode(decodedBytes));
    if (text) {
      extractedSections.push(text);
    }
  }

  if (extractedSections.length > 0) {
    return normalizeText(extractedSections.join("\n\n"));
  }

  const fallback = Array.from(pdfText.matchAll(/\(([^()]{4,240})\)/g))
    .map((token) => decodePdfLiteralString(`(${token[1]})`))
    .filter((value) => /[A-Za-z]{3,}/.test(value))
    .slice(0, 80)
    .join(" ");

  return normalizeText(fallback);
};

const inferBriefSourceFormatFromMetadata = (file: File): BriefSourceFormat => {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") return "pdf";
  if (name.endsWith(".docx")) return "docx";
  if (name.endsWith(".html") || name.endsWith(".htm")) return "html";
  if (name.endsWith(".md") || name.endsWith(".markdown")) return "markdown";
  return "text";
};

const sniffBriefSourceFormat = async (file: File): Promise<BriefSourceFormat | null> => {
  const sampleBytes = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
  if (
    sampleBytes.length >= 5 &&
    sampleBytes[0] === 0x25 &&
    sampleBytes[1] === 0x50 &&
    sampleBytes[2] === 0x44 &&
    sampleBytes[3] === 0x46 &&
    sampleBytes[4] === 0x2d
  ) {
    return "pdf";
  }

  const sampleText = decodeByteText(sampleBytes);
  if (/<(?:!doctype\s+html|html|head|body|meta|title)\b/i.test(sampleText)) {
    return "html";
  }

  return null;
};

export const extractBriefTextFromFile = async (file: File): Promise<ExtractedBriefText> => {
  const format = inferBriefSourceFormatFromMetadata(file) === "text"
    ? (await sniffBriefSourceFormat(file)) ?? "text"
    : inferBriefSourceFormatFromMetadata(file);
  if (format === "pdf") {
    return { format, text: await extractPdfText(file) };
  }
  if (format === "docx") {
    return { format, text: await extractDocxText(file) };
  }

  const rawText = await file.text();
  if (format === "html") {
    return { format, text: stripHtmlToText(rawText) };
  }

  return { format, text: normalizeText(rawText) };
};

const extractHeadedValue = (lines: string[], labels: string[]) => {
  const target = new Set(labels.map((label) => label.toLowerCase()));
  for (const line of lines.slice(0, 24)) {
    const match = line.match(HEADED_VALUE_PATTERN);
    if (match && target.has(match[1].toLowerCase())) {
      return match[2].trim();
    }
  }
  return "";
};

const parseQuarter = (value: string) => {
  const match = value.match(/\bQ([1-4])\s+(\d{4})\b/i);
  if (!match) {
    return null;
  }

  const quarter = Number(match[1]);
  const year = Number(match[2]);
  return new Date(Date.UTC(year, (quarter - 1) * 3, 1));
};

const parseLooseDate = (value: string) => {
  const quarter = parseQuarter(value);
  if (quarter) {
    return quarter;
  }

  const isoMatch = value.match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (isoMatch) {
    const date = new Date(`${isoMatch[0]}T00:00:00Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const slashMatch = value.match(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/);
  if (slashMatch) {
    const [month, day, yearRaw] = slashMatch[0].split("/");
    const year = yearRaw.length === 2 ? Number(`20${yearRaw}`) : Number(yearRaw);
    const date = new Date(Date.UTC(year, Number(month) - 1, Number(day)));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const longMonthMatch = value.match(
    /\b(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+\d{1,2},\s+\d{4}\b/i,
  );
  if (longMonthMatch) {
    const date = new Date(`${longMonthMatch[0]} UTC`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const monthYearMatch = value.match(
    /\b(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+\d{4}\b/i,
  );
  if (monthYearMatch) {
    const date = new Date(`${monthYearMatch[0]} UTC`);
    return Number.isNaN(date.getTime()) ? null : new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  }

  return null;
};

const formatIsoDate = (date: Date) => date.toISOString().slice(0, 10);

const addMonthsUtc = (date: Date, months: number) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));

const extractDateToken = (text: string) => {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }
  return "";
};

const inferTopDomains = (text: string, maxItems = 4) => {
  const lower = text.toLowerCase();
  return DOMAIN_RULES
    .map((rule) => ({
      rule,
      score: rule.keywords.reduce((count, keyword) => count + (lower.includes(keyword.toLowerCase()) ? 1 : 0), 0),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, maxItems)
    .map((entry) => entry.rule);
};

const inferSourceType = (text: string): SourceType =>
  inferTopDomains(text, 1)[0]?.sourceType ?? "media";

const inferEventType = (text: string) => {
  const sourceType = inferSourceType(text);
  if (sourceType === "legal") return "regulation";
  if (sourceType === "policy") return "policy";
  if (sourceType === "infrastructure") return "infrastructure";
  if (sourceType === "sovereign") return "sovereign initiative";
  if (sourceType === "market") return "market development";
  return "media signal";
};

const inferGeography = (text: string) => {
  const matches = GEOGRAPHY_RULES.filter((rule) => rule.patterns.some((pattern) => pattern.test(text))).map((rule) => rule.label);
  return matches.length > 0 ? unique(matches).slice(0, 4).join(" / ") : "Multi-jurisdiction";
};

const inferSeverity = (text: string) => {
  const explicit = text.match(SEVERITY_PATTERN);
  if (explicit) {
    return explicit[1].toLowerCase();
  }

  const lower = text.toLowerCase();
  if (/\bban|block|restrict|sanction|emergency|collapse|lawsuit|investigation|export control|blacklist|shutdown\b/.test(lower)) {
    return "high";
  }
  if (/\blaunch|announce|review|guidance|expand|fund|invest|proposal|warning|hearing|probe\b/.test(lower)) {
    return "medium";
  }
  return "low";
};

const inferConfidence = (text: string) => {
  const explicit = text.match(CONFIDENCE_PATTERN);
  if (explicit) {
    return explicit[1].toLowerCase();
  }

  const lower = text.toLowerCase();
  if (/\breportedly|rumor|speculation|unconfirmed\b/.test(lower)) {
    return "low";
  }
  if (/\bofficial|confirmed|published|announced|released\b/.test(lower)) {
    return "high";
  }
  return "medium";
};

const inferStructuralEffect = (text: string): StructuralEffect => {
  const lower = text.toLowerCase();
  if (/\breclassif|strategic|sovereignty|export control|national security|strategic infrastructure\b/.test(lower)) {
    return "reclassify";
  }
  if (/\brestrict|ban|block|tighten|stress|strain|disrupt|escalat|destabil/i.test(lower)) {
    return "destabilize";
  }
  return "reinforce";
};

const inferEventDomains = (text: string) => {
  const rules = inferTopDomains(text);
  if (rules.length === 0) {
    return ["brief-upload"];
  }
  return unique(rules.map((rule) => rule.label));
};

const inferTags = (text: string) => {
  const tags = inferEventDomains(text);
  const lower = text.toLowerCase();
  if (/\bexport control|license\b/.test(lower)) tags.push("access-control");
  if (/\bcompute|cloud|semiconductor|chip\b/.test(lower)) tags.push("compute");
  if (/\bcapital|funding|investment\b/.test(lower)) tags.push("capital");
  if (/\bsovereign|national security\b/.test(lower)) tags.push("sovereignty");
  if (/\bcompliance|law|regulat/i.test(lower)) tags.push("governance");
  return unique(tags).slice(0, 6);
};

const cleanEventBlock = (block: string) =>
  normalizeText(
    block
      .replace(BULLET_PATTERN, "")
      .replace(ORDERED_BULLET_PATTERN, "")
      .replace(SOURCE_PATTERN, "")
      .replace(CONFIDENCE_PATTERN, "")
      .replace(SEVERITY_PATTERN, ""),
  );

const inferEventTitle = (block: string) => {
  const cleaned = cleanEventBlock(block);
  const stripped = cleaned.replace(extractDateToken(cleaned), "").replace(/^[\s:.-]+/, "");
  const firstLine = splitLines(stripped)[0] ?? stripped;
  const firstSentence = firstLine.split(/(?<=[.!?])\s+/)[0] ?? firstLine;
  const candidate = clean(firstSentence.replace(/\.$/, ""));
  if (wordCount(candidate) <= 14) {
    return candidate;
  }
  return truncateWords(candidate, 12);
};

const inferNarrativeSignificance = (description: string, eventType: string, structuralEffect: StructuralEffect) => {
  const cleaned = clean(description);
  if (cleaned) {
    return truncateWords(cleaned, 24);
  }
  return `${titleCase(eventType)} event with ${structuralEffect} implications.`;
};

const looksLikeMetadataOnly = (block: string) => {
  const lines = splitLines(block);
  const metadataLines = lines.filter((line) => HEADED_VALUE_PATTERN.test(line) || /^as of\b/i.test(line)).length;
  return metadataLines >= Math.max(2, lines.length - 1);
};

const looksLikeEventBlock = (block: string) => {
  if (extractDateToken(block)) return true;
  const firstLine = splitLines(block)[0] ?? "";
  if (BULLET_PATTERN.test(firstLine) || ORDERED_BULLET_PATTERN.test(firstLine)) return true;
  return false;
};

const inferTitle = (lines: string[], blocks: string[], domains: DomainRule[], geography: string) => {
  const explicit = extractHeadedValue(lines, ["title", "scenario", "subject", "world", "name"]);
  if (explicit) {
    return explicit;
  }

  for (const line of lines.slice(0, 12)) {
    const cleanedLine = clean(line.replace(/^#+\s*/, ""));
    if (!cleanedLine || cleanedLine.length > 100) continue;
    if (HEADING_PATTERN.test(cleanedLine) || (wordCount(cleanedLine) >= 3 && wordCount(cleanedLine) <= 14)) {
      const lower = cleanedLine.toLowerCase();
      if (!GENERIC_TITLES.has(lower) && !HEADED_VALUE_PATTERN.test(cleanedLine)) {
        return cleanedLine;
      }
    }
  }

  const domainLabel = domains.length > 0 ? domains.map((domain) => titleCase(domain.label)).join(" / ") : "Strategic";
  return `${domainLabel} Brief ${geography === "Multi-jurisdiction" ? "Scenario" : geography}`;
};

const inferTimeHorizon = (text: string, events: BriefImportEventDraft[]) => {
  const explicitMatch = text.match(/\b(\d{1,2})\s*[- ]?(?:month|months)\b/i);
  if (explicitMatch) {
    const value = Number(explicitMatch[1]);
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  const parsedDates = events.map((event) => parseLooseDate(event.date)).filter((value): value is Date => value instanceof Date);
  if (parsedDates.length >= 2) {
    const first = parsedDates[0];
    const last = parsedDates[parsedDates.length - 1];
    const months = (last.getUTCFullYear() - first.getUTCFullYear()) * 12 + (last.getUTCMonth() - first.getUTCMonth()) + 6;
    return Math.max(18, months);
  }

  return Math.max(18, events.length + 6);
};

const buildOverviewBlocks = (blocks: string[]) =>
  blocks.filter((block) => !looksLikeEventBlock(block) && !looksLikeMetadataOnly(block) && !HEADING_PATTERN.test(block));

const buildNarrativeFallbackBlocks = (blocks: string[]) =>
  buildOverviewBlocks(blocks)
    .map((block) => clean(block))
    .filter((block) => wordCount(block) >= 8)
    .slice(0, 8);

const inferSummary = (blocks: string[], title: string) => {
  const summaryBlocks = buildOverviewBlocks(blocks).slice(0, 2);
  if (summaryBlocks.length > 0) {
    return truncateWords(summaryBlocks.join(" "), 90);
  }
  return `Uploaded brief converted into a bounded scenario around ${title}.`;
};

const inferBoundary = (blocks: string[], domains: DomainRule[], geography: string) => {
  const scopeLine = blocks.find((block) => /\bscope|boundary|mandate|objective\b/i.test(block));
  if (scopeLine) {
    return truncateWords(scopeLine, 80);
  }

  const domainLabel = domains.length > 0 ? domains.map((domain) => titleCase(domain.label)).join(", ") : "strategic";
  return `Uploaded brief bounded to ${domainLabel} conditions across ${geography}.`;
};

const assignMissingDates = (events: BriefImportEventDraft[], text: string, warnings: string[]) => {
  const parsedDates = events.map((event) => parseLooseDate(event.date));
  const asOfRaw = extractHeadedValue(splitLines(text), ["as of"]) || extractDateToken(text);
  const endDate = parseLooseDate(asOfRaw) ?? new Date();
  let assignedSyntheticDate = false;

  for (let index = 0; index < events.length; index += 1) {
    if (parsedDates[index]) continue;

    let assigned: Date | null = null;
    for (let prev = index - 1; prev >= 0; prev -= 1) {
      if (parsedDates[prev]) {
        assigned = addMonthsUtc(parsedDates[prev]!, index - prev);
        break;
      }
    }
    if (!assigned) {
      for (let next = index + 1; next < events.length; next += 1) {
        if (parsedDates[next]) {
          assigned = addMonthsUtc(parsedDates[next]!, -(next - index));
          break;
        }
      }
    }
    if (!assigned) {
      assigned = addMonthsUtc(new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 1)), -(events.length - 1 - index));
    }

    events[index] = { ...events[index], date: formatIsoDate(assigned) };
    parsedDates[index] = assigned;
    assignedSyntheticDate = true;
  }

  if (assignedSyntheticDate) {
    warnings.push("Some events had no explicit dates. Synthetic month-order dates were assigned for review and replay.");
  }
};

const extractEventsFromBlocks = (blocks: string[]) => {
  const datedBlocks = blocks.filter((block) => extractDateToken(block) && !looksLikeMetadataOnly(block));
  if (datedBlocks.length >= 3) {
    return datedBlocks;
  }

  const bulletBlocks = blocks.filter((block) => looksLikeEventBlock(block));
  if (bulletBlocks.length >= 3) {
    return bulletBlocks;
  }

  const sentenceCandidates = normalizeText(blocks.join("\n\n"))
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((sentence) => clean(sentence))
    .filter((sentence) => wordCount(sentence) >= 8)
    .filter((sentence) => /launch|announce|impose|approve|ban|open|expand|review|signal|warn|tighten|fund|build|publish|issue|order/i.test(sentence));

  if (sentenceCandidates.length > 0) {
    return sentenceCandidates.slice(0, 8);
  }

  return buildNarrativeFallbackBlocks(blocks);
};

const buildEventDraft = (block: string, index: number): BriefImportEventDraft => {
  const dateToken = extractDateToken(block);
  const parsedDate = parseLooseDate(dateToken);
  const cleanedBlock = cleanEventBlock(block);
  const sourceMatch = block.match(SOURCE_PATTERN);
  const source = sourceMatch?.[1] ? clean(sourceMatch[1]) : "Uploaded brief";
  const structuralEffect = inferStructuralEffect(block);
  const title = inferEventTitle(block) || `Imported Event ${index + 1}`;
  const description = clean(cleanedBlock.replace(dateToken, "").replace(title, "").replace(/^[\s:.-]+/, "")) || cleanedBlock;
  const eventType = inferEventType(block);

  return {
    id: `brief-event-${index + 1}`,
    title,
    date: parsedDate ? formatIsoDate(parsedDate) : dateToken,
    description,
    source,
    eventType,
    confidenceLevel: inferConfidence(block),
    severityLevel: inferSeverity(block),
    affectedDomains: inferEventDomains(block),
    tags: unique([...inferTags(block), structuralEffect]),
    narrativeSignificance: inferNarrativeSignificance(description || cleanedBlock, eventType, structuralEffect),
  };
};

export const buildBriefImportDraft = ({
  fileName,
  text,
  format,
}: {
  fileName: string;
  text: string;
  format: BriefSourceFormat;
}): BriefImportDraft => {
  const extractedText = normalizeText(text);
  if (!extractedText) {
    throw new Error("The uploaded brief was empty after text extraction.");
  }

  const warnings: string[] = [];
  const blocks = splitBlocks(extractedText);
  const lines = splitLines(extractedText);
  const topDomains = inferTopDomains(extractedText);
  const geography = extractHeadedValue(lines, ["geography", "region"]) || inferGeography(extractedText);
  const title = inferTitle(lines, blocks, topDomains, geography);
  const events = extractEventsFromBlocks(blocks).map((block, index) => buildEventDraft(block, index));

  if (events.length === 0) {
    warnings.push("No event candidates were detected automatically. Review the extracted text and add events manually before import.");
  } else if (events.length < 4) {
    warnings.push("Fewer than four event candidates were detected. Replay and phase progression may be thin until more evidence is added.");
  }
  if (events.length > 12) {
    warnings.push("More than twelve event candidates were detected. Review the extracted list to keep only the most consequential developments.");
  }

  assignMissingDates(events, extractedText, warnings);

  const sourceClasses = unique([
    ...events.map((event) => inferSourceType(`${event.eventType} ${event.description}`)),
    ...topDomains.map((domain) => domain.sourceType),
  ]);
  const summary = extractHeadedValue(lines, ["summary", "overview"]) || inferSummary(blocks, title);
  const boundedDescription =
    extractHeadedValue(lines, ["scope"]) || inferBoundary(blocks, topDomains, geography);
  const domain = extractHeadedValue(lines, ["domain"]) || (topDomains.length > 0 ? topDomains.map((entry) => titleCase(entry.label)).join(", ") : "Strategic environment");

  return {
    fileName,
    format,
    extractedText,
    warnings,
    world: {
      name: title,
      domain,
      geography,
      timeHorizonMonths: inferTimeHorizon(extractedText, events),
      governanceMode: "Institutional",
      boundedDescription,
      summary,
      sourceClasses: sourceClasses.length > 0 ? sourceClasses : ["media"],
    },
    events: events.slice(0, 12),
  };
};

const addMonthsIso = (dateIso: string, months: number) => {
  const base = dateIso ? new Date(`${dateIso}T00:00:00Z`) : new Date();
  const date = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + months, 1));
  return date.toISOString().slice(0, 10);
};

export const normalizeBriefImportDraft = (draft: BriefImportDraft): BriefImportDraft => ({
  ...draft,
  world: {
    ...draft.world,
    name: clean(draft.world.name) || "Imported Brief Scenario",
    domain: clean(draft.world.domain) || "Strategic environment",
    geography: clean(draft.world.geography) || "Multi-jurisdiction",
    boundedDescription: clean(draft.world.boundedDescription) || draft.world.summary || "Uploaded brief boundary.",
    summary: clean(draft.world.summary) || "Uploaded brief converted into a bounded scenario.",
    sourceClasses: draft.world.sourceClasses.length > 0 ? draft.world.sourceClasses : ["media"],
  },
  events: draft.events
    .map((event, index) => ({
      ...event,
      id: clean(event.id) || `brief-event-${index + 1}`,
      title: clean(event.title) || `Imported Event ${index + 1}`,
      date: event.date || addMonthsIso(new Date().toISOString().slice(0, 10), index),
      description: clean(event.description) || clean(event.narrativeSignificance) || event.title || `Imported event ${index + 1}.`,
      source: clean(event.source) || "Uploaded brief",
      eventType: clean(event.eventType) || "media signal",
      confidenceLevel: clean(event.confidenceLevel) || "medium",
      severityLevel: clean(event.severityLevel) || "medium",
      affectedDomains: event.affectedDomains.length > 0 ? event.affectedDomains : ["brief-upload"],
      tags: event.tags,
      narrativeSignificance: clean(event.narrativeSignificance) || clean(event.description) || clean(event.title),
    }))
    .filter((event) => clean(event.title) || clean(event.description)),
});

export const buildImportedScenarioFromBriefDraft = ({
  draft,
  id,
}: {
  draft: BriefImportDraft;
  id: string;
}): {
  normalizedDraft: BriefImportDraft;
  scenario: ScenarioDefinition;
  validationWarnings: string[];
} => {
  const normalizedDraft = normalizeBriefImportDraft(draft);
  if (normalizedDraft.events.length === 0) {
    throw new Error("At least one event is required to import a brief.");
  }

  const dataset = loadScenarioDataset(buildScenarioDatasetFromBriefImportDraft(normalizedDraft));
  const validationWarnings = validateScenarioDataset(dataset).warnings;
  const scenario: ScenarioDefinition = {
    id,
    label: dataset.world.name,
    description: dataset.world.summary,
    dataset,
  };

  return {
    normalizedDraft,
    scenario,
    validationWarnings,
  };
};

const buildSourceWorldDefinitionFromDraft = (draft: BriefImportDraft): SourceWorldDefinition => ({
  world_id: slugify(draft.world.name),
  world_name: draft.world.name,
  world_description: draft.world.boundedDescription,
  scope_boundaries: {
    included_domains: splitList(draft.world.domain),
  },
  key_geographies: splitList(draft.world.geography),
  time_horizon: `${draft.world.timeHorizonMonths} months`,
  signal_types: draft.world.sourceClasses,
  analyst_notes: draft.world.summary,
  primary_tensions: splitList(draft.world.summary).slice(0, 5),
});

const buildSourceEventSetFromDraft = (draft: BriefImportDraft): SourceEventSet => ({
  event_set_id: `${slugify(draft.world.name)}-events`,
  world_id: slugify(draft.world.name),
  events: draft.events.map((event, index) => {
    const structuralEffect = inferStructuralEffect(`${event.eventType} ${event.narrativeSignificance} ${event.description}`);
    return {
      event_id: event.id || `brief-event-${index + 1}`,
      event_title: event.title,
      event_type: event.eventType,
      event_date: event.date,
      description: event.description,
      source: event.source || "Uploaded brief",
      confidence_level: event.confidenceLevel,
      affected_domains: event.affectedDomains,
      narrative_significance: `${event.narrativeSignificance} ${structuralEffect}`,
      severity_level: event.severityLevel,
      tags: event.tags,
    };
  }),
});

export const buildScenarioDatasetFromBriefImportDraft = (draft: BriefImportDraft): ScenarioDataset =>
  buildScenarioFromSource(buildSourceWorldDefinitionFromDraft(draft), buildSourceEventSetFromDraft(draft));
