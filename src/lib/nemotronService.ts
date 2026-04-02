// ===================================================================
// nemotronService.ts — Análise profunda de documentos via NVIDIA NIM
// Model: nvidia/llama-3.1-nemotron-ultra-253b-v1
// USO RESTRITO: painel interno, poucos docs/dia, não público
// ===================================================================

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const NEMOTRON_MODEL = "nvidia/llama-3.1-nemotron-ultra-253b-v1";

import type { RastreabilidadeAnalysis, TreasurySnapshot } from "./rastreabilidadeTypes";

const ANALYSIS_SYSTEM_PROMPT = `Você é SENTINELA-CORE — motor de análise de inteligência cívica municipal para Pedreira/SP.

Você analisa documentos públicos e produz análises estruturadas de RASTREABILIDADE FINANCEIRA.

Ao analisar um documento, você DEVE:
1. Identificar se há pedido/autorização de saída de recursos do tesouro municipal
2. Verificar documentos técnicos obrigatórios (relatório técnico, justificativa, orçamento, cotações, pareceres)
3. Rastrear o fluxo: ORIGEM → APROVAÇÃO → RECURSO → DESTINO → IMPACTO
4. Cruzar com o estado atual do cofre municipal fornecido no contexto
5. Comparar importância frente às análises anteriores fornecidas
6. Atribuir score de risco de 0 a 100

SEMPRE retorne JSON válido com a estrutura exata fornecida. Sem texto fora do JSON.`;

interface NemotronRequest {
  documentContent: string;
  documentTitle: string;
  documentId: string;
  treasury: TreasurySnapshot;
  previousAnalyses: Array<{
    id: string;
    title: string;
    riskScore: number;
    summary: string;
    financialValue?: number;
  }>;
}

function buildAnalysisPrompt(req: NemotronRequest): string {
  const prevSummary =
    req.previousAnalyses.length > 0
      ? req.previousAnalyses
          .slice(-5)
          .map(
            (a) =>
              `- [${a.id}] "${a.title}" | Risco: ${a.riskScore}/100 | Valor: R$ ${a.financialValue?.toLocaleString("pt-BR") ?? "N/D"} | ${a.summary.slice(0, 150)}`
          )
          .join("\n")
      : "Nenhuma análise anterior disponível.";

  return `DOCUMENTO PARA ANÁLISE:
Título: ${req.documentTitle}
ID: ${req.documentId}

CONTEÚDO:
${req.documentContent.slice(0, 8000)}

---
CONTEXTO FINANCEIRO MUNICIPAL (Pedreira/SP — momento atual):
- Execução orçamentária: ${req.treasury.executionPercentage}% do previsto gasto
- Saldo disponível estimado: R$ ${req.treasury.availableBalance.toLocaleString("pt-BR")}
- Status: ${req.treasury.status === "red" ? "🔴 CRÍTICO — cofre abaixo do mínimo operacional" : req.treasury.status === "yellow" ? "🟡 ATENÇÃO — capacidade limitada" : "🟢 REGULAR"}
- Meta fiscal: ${req.treasury.fiscalGoalOk ? "Dentro do limite" : "⚠️ META EM RISCO"}
- Notas: ${req.treasury.notes}

---
ÚLTIMAS ANÁLISES DE RASTREABILIDADE (para comparação):
${prevSummary}

---
Retorne APENAS o seguinte JSON (sem texto adicional):
{
  "documentId": "${req.documentId}",
  "documentTitle": "${req.documentTitle}",
  "analyzedAt": "<ISO timestamp>",
  "financialRequest": {
    "hasRequest": <boolean>,
    "value": <number ou null>,
    "category": "<investimento|custeio|pessoal|transferencia|outro|null>",
    "source": "<tesouro_municipal|repasse_federal|fundo_especifico|convenio|null>",
    "destination": "<nome da secretaria, empresa ou entidade beneficiada>",
    "description": "<descrição clara do que será feito com o recurso>"
  },
  "missingDocuments": [
    { "name": "<nome do doc>", "severity": "<critical|high|medium>", "reason": "<por que é obrigatório>" }
  ],
  "treasuryImpact": {
    "riskLevel": "<red|yellow|green>",
    "canFulfillCommitment": <boolean>,
    "impactOnFiscalGoal": "<positivo|neutro|negativo>",
    "explanation": "<explicação técnica do impacto no cofre>"
  },
  "traceChain": [
    {
      "step": <number>,
      "type": "<origem|proposta|aprovacao|recurso|destino|impacto>",
      "description": "<descrição do passo>",
      "entity": "<órgão ou agente responsável>",
      "date": "<data ou null>",
      "flags": ["<alerta1>", "<alerta2>"]
    }
  ],
  "relatedAnalyses": [
    { "id": "<id>", "relationship": "<complementa|contradiz|duplica|substitui|sem_relacao>", "relevanceScore": <0-100>, "note": "<obs>" }
  ],
  "importanceRanking": {
    "score": <0-100>,
    "justification": "<por que é mais ou menos importante que os anteriores>",
    "priority": "<urgente|alta|media|baixa>"
  },
  "riskScore": <0-100>,
  "riskLevel": "<critical|high|medium|low>",
  "summary": "<resumo executivo em 2-3 frases>",
  "recommendations": ["<recomendação 1>", "<recomendação 2>"]
}`;
}

export async function analyzeDocumentWithNemotron(
  req: NemotronRequest
): Promise<RastreabilidadeAnalysis> {
  const apiKey = import.meta.env.VITE_NVIDIA_API_KEY;
  if (!apiKey) throw new Error("VITE_NVIDIA_API_KEY não configurada");

  const response = await fetch(NVIDIA_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: NEMOTRON_MODEL,
      messages: [
        { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
        { role: "user", content: buildAnalysisPrompt(req) },
      ],
      max_tokens: 3000,
      temperature: 0.1, // baixa temperatura para análises estruturadas
      top_p: 0.9,
      stream: false,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`NVIDIA API error ${response.status}: ${err.detail ?? "Erro desconhecido"}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "";

  // Extrai JSON da resposta (Nemotron às vezes adiciona texto antes/depois)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Nemotron retornou resposta inválida (sem JSON)");

  const parsed = JSON.parse(jsonMatch[0]) as RastreabilidadeAnalysis;
  parsed.analyzedAt = parsed.analyzedAt || new Date().toISOString();

  return parsed;
}
