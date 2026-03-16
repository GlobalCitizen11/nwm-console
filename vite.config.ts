import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

interface ProxyRequest {
  method?: string;
  on: (event: string, handler: (chunk?: string) => void) => void;
}

interface ProxyResponse {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (body: string | Uint8Array) => void;
}

const asProxyRequest = (request: unknown) => request as ProxyRequest;
const asProxyResponse = (response: unknown) => response as ProxyResponse;

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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const apiKey = env.VITE_OPENAI_API_KEY;

  return {
    plugins: [
      react(),
      {
        name: "openai-audio-proxy",
        configureServer(server) {
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
        },
      },
    ],
    test: {
      environment: "node",
    },
  };
});
