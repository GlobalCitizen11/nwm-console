import { execFile } from "node:child_process";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { extractWebPageText, type WebPageExtractionStrategy } from "./webPageText";

const MAX_REMOTE_DOCUMENT_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const REQUEST_TIMEOUT_MS = 15000;
const CURL_RESPONSE_OVERHEAD_BYTES = 64 * 1024;
const CURL_FALLBACK_ERROR_CODES = new Set([
  "CERT_HAS_EXPIRED",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
]);

const blockedHostnames = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "169.254.169.254",
  "metadata.google.internal",
  "metadata",
]);

interface BriefUrlRequestBody {
  url: string;
}

class RequestError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
  }
}

export interface BriefUrlResponsePayload {
  url: string;
  finalUrl: string;
  fileName: string;
  contentType: string;
  byteLength: number;
  dataBase64: string;
  extractedText?: string;
  extractedFormat?: "text";
  extractionStrategy?: WebPageExtractionStrategy | "document";
}

export interface HandlerResult {
  statusCode: number;
  payload: unknown;
}

interface RemoteHttpResponse {
  status: number;
  headers: Map<string, string>;
  body: Buffer;
}

interface ExecFileBufferResult {
  stdout: Buffer;
  stderr: Buffer;
}

const parseBody = (body: unknown): BriefUrlRequestBody | null => {
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as BriefUrlRequestBody;
    } catch {
      return null;
    }
  }

  if (typeof body === "object" && body !== null) {
    return body as BriefUrlRequestBody;
  }

  return null;
};

const isPrivateIpv4 = (address: string) => {
  const parts = address.split(".").map((segment) => Number(segment));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return true;
  }

  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 192 && b === 0) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224) return true;
  return false;
};

const isPrivateIpv6 = (address: string) => {
  const normalized = address.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) return true;
  if (normalized.startsWith("::ffff:")) {
    const embedded = normalized.replace("::ffff:", "");
    return isIP(embedded) === 4 ? isPrivateIpv4(embedded) : true;
  }
  return false;
};

const isBlockedIpAddress = (address: string) => {
  const family = isIP(address);
  if (family === 4) return isPrivateIpv4(address);
  if (family === 6) return isPrivateIpv6(address);
  return true;
};

const validateUrlTarget = async (candidate: string | URL) => {
  const url = candidate instanceof URL ? candidate : new URL(candidate);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new RequestError("Only http and https URLs are allowed.", 400);
  }

  const hostname = url.hostname.toLowerCase();
  if (blockedHostnames.has(hostname) || hostname.endsWith(".local")) {
    throw new RequestError("Private or local network URLs are not allowed.", 403);
  }

  if (isIP(hostname) && isBlockedIpAddress(hostname)) {
    throw new RequestError("Private IP targets are not allowed.", 403);
  }

  const records = await lookup(hostname, { all: true, verbatim: true });
  if (records.some((record) => isBlockedIpAddress(record.address))) {
    throw new RequestError("Resolved target is on a private or reserved network.", 403);
  }

  return url;
};

const deriveExtension = (contentType: string, url: URL) => {
  const normalizedContentType = contentType.split(";")[0].trim().toLowerCase();
  if (normalizedContentType === "application/pdf") return "pdf";
  if (normalizedContentType === "text/html") return "html";
  if (normalizedContentType === "text/markdown") return "md";
  if (normalizedContentType === "text/plain") return "txt";
  if (normalizedContentType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";

  const match = url.pathname.match(/\.([a-z0-9]{2,8})$/i);
  return match?.[1]?.toLowerCase() ?? "txt";
};

const deriveFileName = (contentDisposition: string | null, url: URL, contentType: string) => {
  const quoted = contentDisposition?.match(/filename\*=UTF-8''([^;]+)|filename=\"?([^\";]+)\"?/i);
  if (quoted?.[1] || quoted?.[2]) {
    return decodeURIComponent((quoted[1] ?? quoted[2]).trim());
  }

  const pathName = decodeURIComponent(url.pathname.split("/").pop() ?? "").trim();
  if (pathName && pathName.includes(".")) {
    return pathName;
  }

  return `remote-brief.${deriveExtension(contentType, url)}`;
};

const appendHeader = (headers: Map<string, string>, name: string, value: string) => {
  const normalizedName = name.toLowerCase();
  const existing = headers.get(normalizedName);
  headers.set(normalizedName, existing ? `${existing}, ${value}` : value);
};

const execFileBuffer = (file: string, args: string[], timeoutSeconds: number) =>
  new Promise<ExecFileBufferResult>((resolve, reject) => {
    execFile(
      file,
      args,
      {
        encoding: "buffer",
        maxBuffer: MAX_REMOTE_DOCUMENT_BYTES + CURL_RESPONSE_OVERHEAD_BYTES,
      },
      (error, stdout, stderr) => {
        const normalizedStdout = Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout ?? "");
        const normalizedStderr = Buffer.isBuffer(stderr) ? stderr : Buffer.from(stderr ?? "");

        if (error) {
          reject(Object.assign(error, { stdout: normalizedStdout, stderr: normalizedStderr, timeoutSeconds }));
          return;
        }

        resolve({
          stdout: normalizedStdout,
          stderr: normalizedStderr,
        });
      },
    );
  });

const parseCurlResponse = (stdout: Buffer): RemoteHttpResponse => {
  const headerDelimiter = Buffer.from("\r\n\r\n");
  const linefeedDelimiter = Buffer.from("\n\n");
  const headerEndIndex = stdout.indexOf(headerDelimiter);
  const usesLinefeedsOnly = headerEndIndex < 0;
  const fallbackHeaderEndIndex = usesLinefeedsOnly ? stdout.indexOf(linefeedDelimiter) : headerEndIndex;

  if (fallbackHeaderEndIndex < 0) {
    throw new RequestError("Remote URL response could not be parsed.", 502);
  }

  const separatorLength = usesLinefeedsOnly ? linefeedDelimiter.length : headerDelimiter.length;
  const rawHeaders = stdout.subarray(0, fallbackHeaderEndIndex).toString("utf8");
  const body = stdout.subarray(fallbackHeaderEndIndex + separatorLength);
  const headerLines = rawHeaders
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const statusLine = headerLines.shift();
  const statusMatch = statusLine?.match(/^HTTP\/\d(?:\.\d)?\s+(\d{3})/i);
  if (!statusMatch) {
    throw new RequestError("Remote URL response did not include a valid HTTP status.", 502);
  }

  const headers = new Map<string, string>();
  for (const line of headerLines) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex <= 0) continue;
    appendHeader(headers, line.slice(0, separatorIndex), line.slice(separatorIndex + 1).trim());
  }

  return {
    status: Number(statusMatch[1]),
    headers,
    body,
  };
};

const fetchViaCurl = async (url: URL): Promise<RemoteHttpResponse> => {
  try {
    const timeoutSeconds = Math.ceil(REQUEST_TIMEOUT_MS / 1000);
    const { stdout } = await execFileBuffer(
      "curl",
      [
        "--silent",
        "--show-error",
        "--include",
        "--max-time",
        `${timeoutSeconds}`,
        "--user-agent",
        "NWM-Console-Brief-Ingest/1.0",
        "--header",
        "Accept: text/html,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document;q=0.9,*/*;q=0.5",
        url.toString(),
      ],
      timeoutSeconds,
    );

    return parseCurlResponse(stdout);
  } catch (error) {
    const message =
      error && typeof error === "object" && "stderr" in error && Buffer.isBuffer(error.stderr)
        ? error.stderr.toString("utf8").trim()
        : error instanceof Error
          ? error.message
          : "Unexpected curl fallback failure.";
    throw new RequestError(message || "Unexpected curl fallback failure.", 502);
  }
};

const shouldRetryWithCurl = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  const cause =
    "cause" in error && error.cause && typeof error.cause === "object"
      ? (error.cause as { code?: string; message?: string })
      : null;

  if (cause?.code && CURL_FALLBACK_ERROR_CODES.has(cause.code)) {
    return true;
  }

  const combinedMessage = `${error.message} ${cause?.message ?? ""}`.toLowerCase();
  return combinedMessage.includes("certificate");
};

const fetchRemoteResponse = async (url: URL): Promise<RemoteHttpResponse> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "text/html,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document;q=0.9,*/*;q=0.5",
          "User-Agent": "NWM-Console-Brief-Ingest/1.0",
        },
        redirect: "manual",
        signal: controller.signal,
      });

      const headers = new Map<string, string>();
      response.headers.forEach((value, name) => appendHeader(headers, name, value));
      return {
        status: response.status,
        headers,
        body: Buffer.from(await response.arrayBuffer()),
      };
    } catch (error) {
      if (!shouldRetryWithCurl(error)) {
        throw error;
      }

      return await fetchViaCurl(url);
    }
  } finally {
    clearTimeout(timeout);
  }
};

const fetchWithRedirects = async (initialUrl: URL) => {
  let currentUrl = initialUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    await validateUrlTarget(currentUrl);

    const response = await fetchRemoteResponse(currentUrl);

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new RequestError("Remote URL redirected without a location header.", 502);
      }
      currentUrl = new URL(location, currentUrl);
      continue;
    }

    return { response, finalUrl: currentUrl };
  }

  throw new RequestError("Too many redirects while fetching the remote URL.", 508);
};

const isSupportedRemoteContentType = (contentType: string, url: URL) => {
  const normalized = contentType.split(";")[0].trim().toLowerCase();
  if (
    [
      "application/pdf",
      "text/html",
      "text/plain",
      "text/markdown",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ].includes(normalized)
  ) {
    return true;
  }

  return /\.(pdf|txt|md|markdown|html|htm|docx)$/i.test(url.pathname);
};

export async function handleBriefingUrlRequest(body: unknown): Promise<HandlerResult> {
  const payload = parseBody(body);
  if (!payload?.url || typeof payload.url !== "string") {
    return {
      statusCode: 400,
      payload: { error: "Missing url." },
    };
  }

  try {
    const requestedUrl = await validateUrlTarget(payload.url.trim());
    const { response, finalUrl } = await fetchWithRedirects(requestedUrl);

    if (response.status < 200 || response.status >= 300) {
      return {
        statusCode: response.status,
        payload: { error: `Remote URL returned ${response.status}.` },
      };
    }

    const contentType = response.headers.get("content-type") ?? "application/octet-stream";
    if (!isSupportedRemoteContentType(contentType, finalUrl)) {
      return {
        statusCode: 415,
        payload: { error: "Remote URL did not return a supported brief format." },
      };
    }

    const buffer = response.body;
    if (buffer.length === 0) {
      return {
        statusCode: 422,
        payload: { error: "Remote URL returned an empty document." },
      };
    }
    if (buffer.length > MAX_REMOTE_DOCUMENT_BYTES) {
      return {
        statusCode: 413,
        payload: { error: "Remote document exceeded the 5 MB ingest limit." },
      };
    }

    const result: BriefUrlResponsePayload = {
      url: requestedUrl.toString(),
      finalUrl: finalUrl.toString(),
      fileName: deriveFileName(response.headers.get("content-disposition"), finalUrl, contentType),
      contentType,
      byteLength: buffer.length,
      dataBase64: buffer.toString("base64"),
      extractionStrategy: "document",
    };

    if (contentType.split(";")[0].trim().toLowerCase() === "text/html") {
      const webPageText = await extractWebPageText({
        html: buffer.toString("utf8"),
        url: finalUrl,
        validateUrl: validateUrlTarget,
        timeoutMs: REQUEST_TIMEOUT_MS,
      });

      if (webPageText) {
        result.extractedText = webPageText.extractedText;
        result.extractedFormat = "text";
        result.extractionStrategy = webPageText.extractionStrategy;
      }
    }

    return {
      statusCode: 200,
      payload: result,
    };
  } catch (error) {
    return {
      statusCode: error instanceof RequestError ? error.statusCode : 500,
      payload: {
        error: error instanceof Error ? error.message : "Unexpected remote URL ingest failure.",
      },
    };
  }
}
