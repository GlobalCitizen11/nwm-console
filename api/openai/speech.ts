type VercelRequest = {
  method?: string;
  body?: unknown;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  setHeader: (name: string, value: string) => void;
  send: (body: string | Uint8Array) => void;
};

const extractBody = (body: unknown) => {
  if (typeof body === "string") {
    return body;
  }

  return JSON.stringify(body ?? {});
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    response.status(405).send(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const apiKey = process.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    response.status(500).send(JSON.stringify({ error: "Missing VITE_OPENAI_API_KEY in server environment." }));
    return;
  }

  try {
    const upstream = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: extractBody(request.body),
    });

    const buffer = new Uint8Array(await upstream.arrayBuffer());
    response.setHeader("Content-Type", upstream.headers.get("content-type") ?? "audio/mpeg");
    response.status(upstream.status).send(buffer);
  } catch (error) {
    response
      .status(500)
      .send(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unexpected speech proxy failure.",
        }),
      );
  }
}
