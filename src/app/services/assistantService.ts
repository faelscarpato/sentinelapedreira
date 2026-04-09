import { getClient } from "./serviceUtils";

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantResponse {
  content: string;
  citations: Array<{ slug: string; title: string; category: string }>;
  sessionId: string | null;
  provider?: string;
  model?: string;
}

export async function askLegalAssistant(
  query: string,
  history: AssistantMessage[],
  sessionId?: string,
): Promise<AssistantResponse> {
  const client = getClient();

  const { data, error } = await client.functions.invoke("legal-assistant", {
    body: {
      query,
      history,
      sessionId,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data || typeof data.content !== "string") {
    throw new Error("Edge Function legal-assistant retornou payload inválido.");
  }

  return {
    content: data.content,
    citations: Array.isArray(data.citations) ? data.citations : [],
    sessionId: typeof data.sessionId === "string" ? data.sessionId : null,
    provider: typeof data.provider === "string" ? data.provider : undefined,
    model: typeof data.model === "string" ? data.model : undefined,
  };
}

export async function* askLegalAssistantStream(
  query: string,
  history: AssistantMessage[],
  sessionId?: string,
): AsyncGenerator<string, AssistantResponse, void> {
  const response = await askLegalAssistant(query, history, sessionId);

  const tokens = response.content.split(/(\s+)/).filter(Boolean);
  for (const token of tokens) {
    yield token;
  }

  return response;
}
