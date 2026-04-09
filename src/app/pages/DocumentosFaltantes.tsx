import { AlertTriangle } from "lucide-react";
import { PageContainer, PageHero, PageState } from "../components/layout/PagePrimitives";

export function DocumentosFaltantes() {
  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <PageHero
        title="Documentos Faltantes"
        description="Radar de ausência documental em áreas sensíveis de transparência pública."
        eyebrow="Monitor de Pendências"
        icon={AlertTriangle}
      />

      <PageContainer className="pt-8">
        <PageState
          mode="empty"
          title="Nenhum documento listado no momento"
          description="Esta seção ficará em branco até a próxima etapa de implantação de coleta e publicação."
        />
      </PageContainer>
    </div>
  );
}
