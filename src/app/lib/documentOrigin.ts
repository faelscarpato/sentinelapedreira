export interface DocumentOriginInput {
  source?: string;
  domain?: string;
  sourceEntity?: string;
  metadata?: Record<string, unknown> | null;
}

export function resolveDocumentOriginLabel(input: DocumentOriginInput) {
  const source = (input.source ?? "").toLowerCase();
  const sourceEntity = (input.sourceEntity ?? "").toLowerCase();
  const domain = (input.domain ?? "").toLowerCase();
  const metadataOrigin = String(input.metadata?.ingestion_origin ?? "").toLowerCase();

  const combined = `${source} ${sourceEntity} ${domain} ${metadataOrigin}`;

  if (combined.includes("tce") || domain.includes("transparencia.tce.sp.gov.br")) {
    return "TCE-SP";
  }

  if (combined.includes("upload")) {
    return "Upload";
  }

  if (combined.includes("camara") || combined.includes("câmara")) {
    return "Câmara";
  }

  if (domain.includes("pedreira.sp.gov.br") || combined.includes("prefeitura")) {
    return "Prefeitura";
  }

  return "Outra fonte";
}
