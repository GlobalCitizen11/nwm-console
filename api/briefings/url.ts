import { handleBriefingUrlRequest } from "./urlHandler";

type VercelRequest = {
  method?: string;
  body?: unknown;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  setHeader: (name: string, value: string) => void;
  send: (body: string) => void;
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    response.setHeader("Content-Type", "application/json");
    response.status(405).send(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const result = await handleBriefingUrlRequest(request.body);
  response.setHeader("Content-Type", "application/json");
  response.status(result.statusCode).send(JSON.stringify(result.payload));
}
