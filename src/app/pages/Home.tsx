import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  FileText,
  Scale,
  Building,
  Shield,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { DocumentCard } from "../components/DocumentCard";
import { PdfModal } from "../components/PdfModal";
import {
  featuredDocuments,
  diarioOficialDocuments,
  contasPublicasDocuments,
  controleExternoDocuments,
  documentosFaltantes,
} from "../data/realData";
import { camaraPublicDocuments } from "../data/camaraPublicData";
import type { Document } from "../data/realData";
import { isPdfDocument, openExternalSource } from "../lib/sourceUtils";
import { openAssistantChat } from "../lib/assistantEvents";
import { getDocumentDetailHref } from "../lib/documentDetailRoute";
import {
  AuthBadge,
  PageContainer,
  SectionBlock,
  SectionHeading,
  StatKpi,
} from "../components/layout/PagePrimitives";

export function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const navigate = useNavigate();

  const featuredPdfDocuments = featuredDocuments.filter((document) => isPdfDocument(document));
  const currentFeatured = featuredPdfDocuments[currentSlide];

  const nextSlide = () => {
    if (!featuredPdfDocuments.length) return;
    setCurrentSlide((prev) => (prev + 1) % featuredPdfDocuments.length);
  };

  const prevSlide = () => {
    if (!featuredPdfDocuments.length) return;
    setCurrentSlide((prev) => (prev - 1 + featuredPdfDocuments.length) % featuredPdfDocuments.length);
  };

  const handleViewOriginal = (doc: Document) => {
    if (!doc.originalUrl) return;
    if (isPdfDocument(doc)) {
      setSelectedDocument(doc);
      setPdfModalOpen(true);
      return;
    }

    openExternalSource(doc.originalUrl);
  };

  const handleViewAnalysis = (doc: Document) => {
    if (doc.analysisUrl) {
      navigate(doc.analysisUrl);
    }
  };

  const handleViewDetails = (doc: Document) => {
    navigate(getDocumentDetailHref(doc));
  };

  const categories = [
    {
      icon: FileText,
      title: "Diário Oficial",
      description: "Publicações municipais diárias",
      href: "/diario-oficial",
      count: diarioOficialDocuments.length,
    },
    {
      icon: Scale,
      title: "Câmara Legislativa",
      description: "Projetos de lei e documentos",
      href: "/camara",
      count: camaraPublicDocuments.length,
    },
    {
      icon: TrendingUp,
      title: "Contas Públicas",
      description: "Orçamento e execução fiscal",
      href: "/contas-publicas",
      count: contasPublicasDocuments.length,
    },
    {
      icon: Shield,
      title: "Controle Externo",
      description: "TCE e órgãos de fiscalização",
      href: "/controle-externo",
      count: controleExternoDocuments.length,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <section className="relative overflow-hidden border-b border-slate-200 bg-slate-100">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-100 to-slate-200" />
        <PageContainer className="relative py-14 md:py-20">
          {currentFeatured ? (
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="max-w-4xl">
                <AuthBadge text="Transparência Radical" className="mb-4" />
                <h1 className="font-headline text-4xl font-black tracking-tight text-slate-950 md:text-6xl md:leading-[1.02]">
                  Sentinela de Pedreira
                  <span className="block text-slate-400">Fiscalização com contexto público.</span>
                </h1>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                    {currentFeatured.category}
                  </span>
                  {currentFeatured.riskLevel ? (
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                        currentFeatured.riskLevel === "critical"
                          ? "bg-red-100 text-red-800"
                          : currentFeatured.riskLevel === "high"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      Risco {currentFeatured.riskLevel}
                    </span>
                  ) : null}
                </div>

                <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 md:text-lg">
                  {currentFeatured.title}
                </p>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
                  {currentFeatured.summary}
                </p>

                <div className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {new Date(currentFeatured.date).toLocaleDateString("pt-BR")} · {currentFeatured.sourceEntity}
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  {currentFeatured.originalUrl ? (
                    <button
                      type="button"
                      onClick={() => handleViewOriginal(currentFeatured)}
                      className="rounded-lg border border-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-900 hover:text-white"
                    >
                      Visualizar PDF
                    </button>
                  ) : null}
                  {currentFeatured.hasAnalysis ? (
                    <button
                      type="button"
                      onClick={() => handleViewAnalysis(currentFeatured)}
                      className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                    >
                      Ler análise completa
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4 lg:w-72">
                <div className="grid grid-cols-3 gap-2">
                  {featuredPdfDocuments.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === currentSlide ? "col-span-2 bg-slate-900" : "bg-slate-300"
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={prevSlide}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 hover:border-slate-900 hover:text-slate-900"
                    aria-label="Slide anterior"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextSlide}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 hover:border-slate-900 hover:text-slate-900"
                    aria-label="Próximo slide"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid gap-2">
                  <StatKpi label="Documentos monitorados" value={allCount()} />
                  <StatKpi label="Atualização" value="Diária" trend="Dados públicos oficiais" />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">
              Nenhum destaque disponível no momento.
            </div>
          )}
        </PageContainer>
      </section>

      <PageContainer className="mt-10 space-y-10">
        <SectionBlock>
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Building className="h-6 w-6" />
            </span>
            <div>
              <SectionHeading
                title="Sobre a Plataforma"
                description="Inteligência cívica para transformar documentos oficiais em informação pública clara e auditável."
              />
              <p className="text-sm leading-relaxed text-slate-700 md:text-base">
                O Sentinela Pedreira organiza, cruza e contextualiza dados oficiais para ampliar a capacidade de
                fiscalização cidadã. O objetivo é reduzir opacidade institucional e acelerar o acesso a fatos
                verificáveis sobre gestão municipal.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatKpi label="Módulos públicos" value="4" />
                <StatKpi label="Dados" value="100%" trend="Fontes oficiais" />
                <StatKpi label="Disponibilidade" value="24/7" />
                <StatKpi label="Camada IA" value="Auditável" />
              </div>
            </div>
          </div>
        </SectionBlock>

        <section>
          <SectionHeading
            title="Navegação por Módulo"
            description="Entradas principais do sistema para documentos, finanças, fiscalização e apoio jurídico."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {categories.map((category, idx) => {
              const Icon = category.icon;
              return (
                <Link
                  key={idx}
                  to={category.href}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-headline text-xl font-bold tracking-tight text-slate-900">{category.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{category.description}</p>
                  <div className="mt-4 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <span>{category.count} docs</span>
                    <ArrowRight className="h-4 w-4 text-slate-700 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <SectionHeading
            title="Documentos Faltantes"
            description="Alertas para ausência de publicação em temas de transparência ativa."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {documentosFaltantes.slice(0, 2).map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onViewDetails={() => handleViewDetails(doc)}
                onViewOriginal={doc.originalUrl ? () => handleViewOriginal(doc) : undefined}
                onViewAnalysis={doc.analysisUrl ? () => handleViewAnalysis(doc) : undefined}
              />
            ))}
          </div>
          <div className="mt-4">
            <Link
              to="/documentos-faltantes"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-950"
            >
              <AlertTriangle className="h-4 w-4" />
              Ver lista completa de pendências
            </Link>
          </div>
        </section>

        <SectionBlock title="Base Legal e Jurídica">
          <div className="space-y-3 text-sm leading-relaxed text-slate-700">
            <p>
              Esta plataforma segue a Lei de Acesso à Informação (Lei 12.527/2011), a Lei de Responsabilidade
              Fiscal (LC 101/2000) e normas correlatas de transparência pública.
            </p>
            <p>
              A publicação de informações de agentes públicos ocorre exclusivamente sob interesse público e
              controle social. As respostas automatizadas de IA são apoio técnico e não substituem parecer
              jurídico oficial.
            </p>
          </div>
        </SectionBlock>

        <section className="rounded-2xl bg-slate-900 px-6 py-10 text-white shadow-2xl sm:px-10">
          <h2 className="font-headline text-3xl font-black tracking-tight">Assistente Jurídico Municipal</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 md:text-base">
            Tire dúvidas sobre legislação, documentos e procedimentos públicos com respostas baseadas em fontes
            oficiais e integração com edge function auditável.
          </p>
          <button
            type="button"
            onClick={openAssistantChat}
            className="mt-6 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
          >
            Abrir assistente
          </button>
        </section>
      </PageContainer>

      <PdfModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        title={selectedDocument?.title || ""}
        date={selectedDocument?.date}
        source={selectedDocument?.sourceEntity}
        pdfUrl={selectedDocument?.originalUrl}
      />
    </div>
  );
}

function allCount() {
  return [
    diarioOficialDocuments.length,
    camaraPublicDocuments.length,
    contasPublicasDocuments.length,
    controleExternoDocuments.length,
  ].reduce((sum, value) => sum + value, 0);
}
