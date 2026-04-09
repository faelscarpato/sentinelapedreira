// ===================================================================
// groqService.ts — Assistente Jurídico via Groq API (frontend-only)
// Model: llama-3.3-70b-versatile (contexto reduzido, gratuito)
// ===================================================================

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqResponse {
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

// Injeta documentos relevantes como contexto reduzido
function buildContextFromDocuments(
  query: string,
  documents: Array<{ title: string; summary: string; category: string; date: string }>
): string {
  const relevant = documents
    .filter((d) =>
      d.title.toLowerCase().includes(query.toLowerCase()) ||
      d.summary.toLowerCase().includes(query.toLowerCase()) ||
      d.category.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 5); // máx 5 documentos como contexto

  if (!relevant.length) return "";

  return (
    "\n\n---\nDOCUMENTOS RELEVANTES DA BASE:\n" +
    relevant
      .map((d) => `• [${d.category}] ${d.title} (${d.date}): ${d.summary.slice(0, 200)}`)
      .join("\n")
  );
}

const SYSTEM_PROMPT = `Você é o Sentinela Jurídico — assistente especializado em legislação municipal brasileira, transparência pública e direito administrativo, vinculado à plataforma Sentinela Pedreira (Pedreira/SP).

Suas responsabilidades:
- Responder dúvidas sobre legislação municipal, estadual e federal
- Explicar documentos públicos, licitações, contratos e atos administrativos
- Orientar cidadãos sobre seus direitos e canais de denúncia
- Contextualizar informações com base nos documentos da plataforma
- Identificar possíveis irregularidades descritas pelo usuário

Regras:
- Seja objetivo, use linguagem acessível mas precisa
- Cite leis e artigos quando relevante
- NÃO emita pareceres jurídicos definitivos — indique sempre que para casos específicos o cidadão procure assessoria jurídica
- Quando mencionar documentos disponíveis na plataforma, use o formato [VER DOCUMENTO: título]
- Responda sempre em português brasileiro`;

export async function askGroqAssistant(
  messages: GroqMessage[],
  userQuery: string,
  contextDocuments: Array<{ title: string; summary: string; category: string; date: string }> = []
): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error("VITE_GROQ_API_KEY não configurada");

  const context = buildContextFromDocuments(userQuery, contextDocuments);

  // Injeta contexto na última mensagem do usuário
  const messagesWithContext: GroqMessage[] = [
    { role: "system", content: SYSTEM_PROMPT + context },
    ...messages.slice(-6), // histórico dos últimos 6 turnos (contexto reduzido)
  ];

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: messagesWithContext,
      max_tokens: 1024,
      temperature: 0.3,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Groq API error ${response.status}: ${error.error?.message || "Erro desconhecido"}`);
  }

  const data: GroqResponse = await response.json();
  return data.choices[0]?.message?.content ?? "Sem resposta";
}

// Streaming version para UX mais fluida
export async function* askGroqAssistantStream(
  messages: GroqMessage[],
  userQuery: string,
  contextDocuments: Array<{ title: string; summary: string; category: string; date: string }> = []
): AsyncGenerator<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error("VITE_GROQ_API_KEY não configurada");

  const context = buildContextFromDocuments(userQuery, contextDocuments);

  const messagesWithContext: GroqMessage[] = [
    { role: "system", content: SYSTEM_PROMPT + context },
    ...messages.slice(-6),
  ];

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: messagesWithContext,
      max_tokens: 1024,
      temperature: 0.3,
      stream: true,
    }),
  });

  if (!response.ok) throw new Error(`Groq API error ${response.status}`);

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value).split("\n");
    for (const line of lines) {
      if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
      try {
        const json = JSON.parse(line.slice(6));
        const token = json.choices?.[0]?.delta?.content;
        if (token) yield token;
      } catch {
        // skip malformed chunks
      }
    }
  }
}
