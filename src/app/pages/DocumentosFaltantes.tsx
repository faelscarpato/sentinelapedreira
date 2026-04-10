import { AlertTriangle } from "lucide-react";
import { PageContainer, PageHero, SectionBlock } from "../components/layout/PagePrimitives";
import { documentosFaltantes } from "../data/realData";
import { DocumentCard } from "../components/DocumentCard";
import { useNavigate } from "react-router";
import { SEO } from "../components/ui/SEO";

export function DocumentosFaltantes() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <SEO title="Documentos Faltantes" description="Radar de ausência de transparência e documentos não publicados." />
      <PageHero
        title="Documentos Faltantes"
        description="Radar de ausência documental. Identificamos documentos obrigatórios por lei ou sensibilidade cívica que não foram localizados nos portais oficiais."
        eyebrow="Monitor de Pendências"
        icon={AlertTriangle}
      />

      <PageContainer className="pt-8">
        <SectionBlock 
          title="Radar de Ausência" 
          description={`${documentosFaltantes.length} indícios de omissão de transparência identificados.`}
        >
          <div className="grid gap-6 md:grid-cols-2">
            {documentosFaltantes.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onViewDetails={() => navigate(`/documentos/${doc.id}`)}
              />
            ))}
          </div>

          <div className="mt-8 rounded-xl bg-amber-50 border border-amber-200 p-6 text-sm text-amber-900">
            <h4 className="font-bold flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5" />
              Por que estes documentos estão aqui?
            </h4>
            <p className="leading-relaxed">
              O Sentinela Pedreira utiliza uma matriz de obrigatoriedade baseada na LAI (Lei de Acesso à Informação) 
              e prazos do TCE-SP. Quando um processo licitatório ou obra é anunciado, monitoramos a publicação 
              dos anexos obrigatórios. Se não encontrados em até 30 dias após o fato gerador, eles entram no radar.
            </p>
          </div>
        </SectionBlock>
      </PageContainer>
    </div>
  );
}
