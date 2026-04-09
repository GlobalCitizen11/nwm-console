import { readFile } from "node:fs/promises";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { handleBriefingUrlRequest } from "./api/briefings/urlHandler";

interface ProxyRequest {
  headers?: Record<string, string | string[] | undefined>;
  method?: string;
  url?: string;
  on: (event: string, handler: (chunk?: string) => void) => void;
}

interface ProxyResponse {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (body: string | Uint8Array) => void;
}

type NextFunction = (error?: unknown) => void;

const CONSOLE_ALIAS_BASE = "/nwm-console";

const asProxyRequest = (request: unknown) => request as ProxyRequest;
const asProxyResponse = (response: unknown) => response as ProxyResponse;

const getRequestPath = (request: ProxyRequest) => request.url?.split("?")[0] ?? "";

const acceptsHtml = (request: ProxyRequest) => {
  const accept = request.headers?.accept;
  if (Array.isArray(accept)) {
    return accept.some((value) => value.includes("text/html"));
  }
  return accept?.includes("text/html") ?? false;
};

const isConsoleAliasRequest = (request: ProxyRequest) => {
  if (!["GET", "HEAD"].includes(request.method ?? "GET")) {
    return false;
  }

  if (!acceptsHtml(request)) {
    return false;
  }

  const path = getRequestPath(request);
  return (
    path === CONSOLE_ALIAS_BASE
    || path === `${CONSOLE_ALIAS_BASE}/`
    || path.startsWith(`${CONSOLE_ALIAS_BASE}/export/`)
  );
};

const readBody = (request: ProxyRequest) =>
  new Promise<string>((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });

const writeJson = (
  response: ProxyResponse,
  statusCode: number,
  payload: unknown,
) => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(payload));
};

const registerConsoleAliasFallback = (
  transformIndexHtml: (url: string, html: string) => Promise<string>,
  use: (handler: (request: unknown, response: unknown, next: NextFunction) => void | Promise<void>) => void,
) => {
  use(async (request, response, next) => {
    const proxyRequest = asProxyRequest(request);
    const proxyResponse = asProxyResponse(response);

    if (!isConsoleAliasRequest(proxyRequest)) {
      next();
      return;
    }

    try {
      const htmlTemplate = await readFile(new URL("./index.html", import.meta.url), "utf8");
      const html = await transformIndexHtml(getRequestPath(proxyRequest), htmlTemplate);
      proxyResponse.statusCode = 200;
      proxyResponse.setHeader("Content-Type", "text/html");
      proxyResponse.end(html);
    } catch (error) {
      next(error);
    }
  });
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const apiKey = env.VITE_OPENAI_API_KEY;

  return {
    plugins: [
      react(),
      {
        name: "openai-audio-proxy",
        configureServer(server) {
          registerConsoleAliasFallback(
            server.transformIndexHtml.bind(server),
            server.middlewares.use.bind(server.middlewares),
          );

          server.middlewares.use("/api/openai/narration", async (request, response) => {
            const proxyRequest = asProxyRequest(request);
            const proxyResponse = asProxyResponse(response);
            if (proxyRequest.method !== "POST") {
              writeJson(proxyResponse, 405, { error: "Method not allowed" });
              return;
            }

            if (!apiKey) {
              writeJson(proxyResponse, 500, { error: "Missing VITE_OPENAI_API_KEY in server environment." });
              return;
            }

            try {
              const rawBody = await readBody(proxyRequest);
              const body = JSON.parse(rawBody || "{}");
              const upstream = await fetch("https://api.openai.com/v1/responses", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify(body),
              });

              const upstreamText = await upstream.text();
              proxyResponse.statusCode = upstream.status;
              proxyResponse.setHeader("Content-Type", upstream.headers.get("content-type") ?? "application/json");
              proxyResponse.end(upstreamText);
            } catch (error) {
              writeJson(proxyResponse, 500, {
                error: error instanceof Error ? error.message : "Unexpected narration proxy failure.",
              });
            }
          });

          server.middlewares.use("/api/openai/speech", async (request, response) => {
            const proxyRequest = asProxyRequest(request);
            const proxyResponse = asProxyResponse(response);
            if (proxyRequest.method !== "POST") {
              writeJson(proxyResponse, 405, { error: "Method not allowed" });
              return;
            }

            if (!apiKey) {
              writeJson(proxyResponse, 500, { error: "Missing VITE_OPENAI_API_KEY in server environment." });
              return;
            }

            try {
              const rawBody = await readBody(proxyRequest);
              const body = JSON.parse(rawBody || "{}");
              const upstream = await fetch("https://api.openai.com/v1/audio/speech", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify(body),
              });

              const buffer = new Uint8Array(await upstream.arrayBuffer());
              proxyResponse.statusCode = upstream.status;
              proxyResponse.setHeader("Content-Type", upstream.headers.get("content-type") ?? "audio/mpeg");
              proxyResponse.end(buffer);
            } catch (error) {
              writeJson(proxyResponse, 500, {
                error: error instanceof Error ? error.message : "Unexpected speech proxy failure.",
              });
            }
          });

          server.middlewares.use("/api/briefings/url", async (request, response) => {
            const proxyRequest = asProxyRequest(request);
            const proxyResponse = asProxyResponse(response);
            if (proxyRequest.method !== "POST") {
              writeJson(proxyResponse, 405, { error: "Method not allowed" });
              return;
            }

            try {
              const rawBody = await readBody(proxyRequest);
              const result = await handleBriefingUrlRequest(rawBody || "{}");
              writeJson(proxyResponse, result.statusCode, result.payload);
            } catch (error) {
              writeJson(proxyResponse, 500, {
                error: error instanceof Error ? error.message : "Unexpected URL ingest proxy failure.",
              });
            }
          });
        },
      },
    ],
    test: {
      environment: "node",
    },
  };
});
