import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Scale,
  Shield,
  TrendingUp,
  ArrowRight,
  Receipt,
  Wallet,
  Gavel,
  ArrowLeftRight,
  Clock,
  Heart,
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
import { HomeDashboard } from "../components/HomeDashboard";
import { SEO } from "../components/ui/SEO";

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
    setCurrentSlide(
      (prev) => (prev - 1 + featuredPdfDocuments.length) % featuredPdfDocuments.length,
    );
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

  // Módulos principais de documentos
  const documentCategories = [
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

  // Módulos de finanças detalhadas
  const financeCategories = [
    {
      icon: Receipt,
      title: "Receitas",
      description: "Arrecadação mensal detalhada",
      href: "/receitas",
    },
    {
      icon: Wallet,
      title: "Despesas",
      description: "Gastos por órgão e categoria",
      href: "/despesas",
    },
    {
      icon: Gavel,
      title: "Licitações",
      description: "Compras e contratos públicos",
      href: "/licitacoes",
    },
    {
      icon: ArrowLeftRight,
      title: "Repasses",
      description: "Transferências e destinação",
      href: "/repasses",
    },
    {
      icon: Clock,
      title: "Pagamentos Pendentes",
      description: "Restos a pagar",
      href: "/pagamentos-pendentes",
    },
    {
      icon: Heart,
      title: "Terceiro Setor",
      description: "Convênios e entidades",
      href: "/terceiro-setor",
    },
  ];

  const totalDocs = [
    diarioOficialDocuments.length,
    camaraPublicDocuments.length,
    contasPublicasDocuments.length,
    controleExternoDocuments.length,
  ].reduce((sum, v) => sum + v, 0);

  return (
    <PageContainer>
      <SEO title="Início" />

      {/* ── Hero / Destaque ── */}
      <SectionBlock>
        <AuthBadge label="TRANSPARÊNCIA RADICAL" />
        <SectionHeading
          title="Sentinela de Pedreira"
          subtitle="Fiscalização com contexto público."
        />

        {currentFeatured ? (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                {currentFeatured.category}
              </span>
              {currentFeatured.riskLevel ? (
                <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700">
                  Risco {currentFeatured.riskLevel}
                </span>
              ) : null}
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">{currentFeatured.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {currentFeatured.summary}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              {new Date(currentFeatured.date).toLocaleDateString("pt-BR")} ·{" "}
              {currentFeatured.sourceEntity}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {currentFeatured.originalUrl ? (
                <button
                  onClick={() => handleViewOriginal(currentFeatured)}
                  className="rounded-lg border border-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-900 hover:text-white"
                >
                  Visualizar PDF
                </button>
              ) : null}
              {currentFeatured.hasAnalysis ? (
                <button
                  onClick={() => handleViewAnalysis(currentFeatured)}
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  Ler análise completa
                </button>
              ) : null}
            </div>

            {/* Indicadores do carrossel */}
            <div className="mt-6 grid auto-cols-fr grid-flow-col gap-1.5">
              {featuredPdfDocuments.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentSlide ? "col-span-2 bg-slate-900" : "bg-slate-300"
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Botões prev / next */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={prevSlide}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                aria-label="Slide anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={nextSlide}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                aria-label="Próximo slide"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Nenhum destaque disponível no momento.</p>
        )}
      </SectionBlock>

      {/* ── KPIs globais ── */}
      <SectionBlock>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatKpi label="DOCUMENTOS MONITORADOS" value={totalDocs.toLocaleString("pt-BR")} />
          <StatKpi label="ATUALIZAÇÃO" value="Diária" sublabel="Dados públicos oficiais" />
          <StatKpi label="MÓDULOS PÚBLICOS" value={documentCategories.length + financeCategories.length} />
          <StatKpi label="DISPONIBILIDADE" value="24/7" />
        </div>
      </SectionBlock>

      {/* ── Dashboard financeiro ── */}
      <SectionBlock>
        <SectionHeading
          title="Panorama de Gestão & Transparência"
          subtitle="Evolução histórica da saúde financeira municipal baseada em dados consolidados (2020-2026)."
        />
        <HomeDashboard />
      </SectionBlock>

      {/* ── Sobre a plataforma ── */}
      <SectionBlock id="sobre">
        <SectionHeading title="Sobre a Plataforma" />
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
          Inteligência cívica para transformar documentos oficiais em informação pública clara e
          auditável.
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          O Sentinela Pedreira organiza, cruza e contextualiza dados oficiais para ampliar a
          capacidade de fiscalização cidadã. O objetivo é reduzir opacidade institucional e acelerar
          o acesso a fatos verificáveis sobre gestão municipal.
        </p>
      </SectionBlock>

      {/* ── Navegação por Módulo — Documentos ── */}
      <SectionBlock>
        <SectionHeading
          title="Navegação por Módulo"
          subtitle="Entradas principais do sistema para documentos, finanças, fiscalização e apoio jurídico."
        />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {documentCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.href}
                to={category.href}
                className="group flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-900">{category.title}</h3>
                <p className="text-xs text-slate-500">{category.description}</p>
                <p className="mt-auto text-xs font-semibold text-slate-400">
                  {category.count} DOCS
                </p>
              </Link>
            );
          })}
        </div>
      </SectionBlock>

      {/* ── Finanças Públicas ── */}
      <SectionBlock>
        <SectionHeading
          title="Finanças Públicas"
          subtitle="Painéis analíticos com dados do portal de transparência de Pedreira."
        />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {financeCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.href}
                to={category.href}
                className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{category.title}</p>
                  <p className="text-xs text-slate-500">{category.description}</p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </Link>
            );
          })}
        </div>
      </SectionBlock>

      {/* ── Documentos Faltantes ── */}
      <SectionBlock>
        <SectionHeading
          title="Documentos Faltantes"
          subtitle="Alertas para ausência de publicação em temas de transparência ativa."
        />
        <div className="mt-4 space-y-4">
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
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
          >
            Ver lista completa de pendências
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </SectionBlock>

      {/* ── Base Legal ── */}
      <SectionBlock id="base-legal">
        <SectionHeading title="Base Legal e Jurídica" />
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
          Esta plataforma segue a Lei de Acesso à Informação (Lei 12.527/2011), a Lei de
          Responsabilidade Fiscal (LC 101/2000) e normas correlatas de transparência pública.
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          A publicação de informações de agentes públicos ocorre exclusivamente sob interesse público
          e controle social. As respostas automatizadas de IA são apoio técnico e não substituem
          parecer jurídico oficial.
        </p>
      </SectionBlock>

      {/* ── Assistente Jurídico CTA ── */}
      <SectionBlock>
        <SectionHeading title="Assistente Jurídico Municipal" />
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
          Tire dúvidas sobre legislação, documentos e procedimentos públicos com respostas baseadas
          em fontes oficiais e integração com edge function auditável.
        </p>
        <button
          onClick={() => openAssistantChat()}
          className="mt-5 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
        >
          Abrir assistente
        </button>
      </SectionBlock>

      {/* ── Modal PDF ── */}
      <PdfModal
        open={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        title={selectedDocument?.title ?? ""}
        date={selectedDocument?.date}
        source={selectedDocument?.sourceEntity}
        pdfUrl={selectedDocument?.originalUrl}
      />
    </PageContainer>
  );
} 