import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, AlertTriangle, FileText, Scale, Building, Shield, TrendingUp, ArrowRight } from "lucide-react";
import { DocumentCard } from "../components/DocumentCard";
import { PdfModal } from "../components/PdfModal";
import { featuredDocuments, diarioOficialDocuments, camaraDocuments, contasPublicasDocuments, controleExternoDocuments, documentosFaltantes } from "../data/realData";
import type { Document } from "../data/realData";
import { isPdfDocument, openExternalSource } from "../lib/sourceUtils";
import { openAssistantChat } from "../lib/assistantEvents";

export function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const navigate = useNavigate();

  const currentFeatured = featuredDocuments[currentSlide];

  const nextSlide = () => {
    if (!featuredDocuments.length) return;
    setCurrentSlide((prev) => (prev + 1) % featuredDocuments.length);
  };

  const prevSlide = () => {
    if (!featuredDocuments.length) return;
    setCurrentSlide((prev) => (prev - 1 + featuredDocuments.length) % featuredDocuments.length);
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

  const categories = [
    {
      icon: FileText,
      title: 'Diário Oficial',
      description: 'Publicações municipais diárias',
      href: '/diario-oficial',
      count: diarioOficialDocuments.length
    },
    {
      icon: Scale,
      title: 'Câmara Legislativa',
      description: 'Projetos de lei e documentos',
      href: '/camara',
      count: camaraDocuments.length
    },
    {
      icon: TrendingUp,
      title: 'Contas Públicas',
      description: 'Orçamento e execução fiscal',
      href: '/contas-publicas',
      count: contasPublicasDocuments.length
    },
    {
      icon: Shield,
      title: 'Controle Externo',
      description: 'TCE e órgãos de fiscalização',
      href: '/controle-externo',
      count: controleExternoDocuments.length
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero / Carousel */}
      <section className="bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="relative">
            {/* Slide Content */}
            {currentFeatured ? (
            <div className="min-h-[400px] flex flex-col justify-center">
              <div className="mb-4">
                <span className={`inline-block px-3 py-1 text-xs font-mono ${
                  currentFeatured.riskLevel === 'critical' 
                    ? 'bg-red-600' 
                    : currentFeatured.riskLevel === 'high'
                    ? 'bg-orange-500'
                    : 'bg-neutral-700'
                }`}>
                  {currentFeatured.category.toUpperCase()}
                </span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-mono mb-4">
                {currentFeatured.title}
              </h2>
              
              <p className="text-lg text-neutral-300 mb-6 max-w-3xl">
                {currentFeatured.summary}
              </p>
              
              <div className="flex items-center space-x-3 text-sm text-neutral-400 mb-8">
                <span>{new Date(currentFeatured.date).toLocaleDateString('pt-BR')}</span>
                <span>•</span>
                <span>{currentFeatured.sourceEntity}</span>
              </div>

              <div className="flex flex-wrap gap-3">
                {currentFeatured.originalUrl && (
                  <button
                    onClick={() => handleViewOriginal(currentFeatured)}
                    className="px-6 py-3 border border-white text-white font-mono text-sm hover:bg-white hover:text-black transition-colors"
                  >
                    {currentFeatured.previewMode === "pdf" ? "VER PDF" : "ABRIR FONTE"}
                  </button>
                )}
                {currentFeatured.hasAnalysis && (
                  <button
                    onClick={() => handleViewAnalysis(currentFeatured)}
                    className="px-6 py-3 bg-white text-black font-mono text-sm hover:bg-neutral-200 transition-colors"
                  >
                    LER ANÁLISE COMPLETA
                  </button>
                )}
              </div>
            </div>
            ) : (
              <div className="min-h-[320px] flex items-center">
                <p className="text-neutral-300">Nenhum destaque disponível no momento.</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              <div className="flex items-center space-x-2">
                {featuredDocuments.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-2 h-2 transition-all ${
                      idx === currentSlide ? 'bg-white w-8' : 'bg-neutral-600'
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={prevSlide}
                  className="p-2 border border-white hover:bg-white hover:text-black transition-colors"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextSlide}
                  className="p-2 border border-white hover:bg-white hover:text-black transition-colors"
                  aria-label="Próximo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-neutral-50 border border-neutral-200 p-8 md:p-12">
          <div className="flex items-start space-x-4 mb-6">
            <Building className="w-8 h-8 flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-mono mb-4">Sobre a Plataforma</h2>
              <p className="text-neutral-700 mb-4">
                O <strong>CIVIC_WATCH</strong> é uma plataforma pública de inteligência cívica municipal 
                que organiza, analisa e disponibiliza documentos públicos de forma acessível e estruturada.
              </p>
              <p className="text-neutral-700 mb-4">
                Nossa missão é facilitar o <strong>controle social</strong> e fortalecer a 
                <strong> transparência pública</strong>, tornando informações complexas compreensíveis 
                para todos os cidadãos.
              </p>
              <div className="grid md:grid-cols-4 gap-4 mt-6">
                <div className="border-l-4 border-black pl-4">
                  <div className="font-mono text-2xl mb-1">4</div>
                  <div className="text-sm text-neutral-600">Áreas de atuação</div>
                </div>
                <div className="border-l-4 border-black pl-4">
                  <div className="font-mono text-2xl mb-1">100%</div>
                  <div className="text-sm text-neutral-600">Dados públicos</div>
                </div>
                <div className="border-l-4 border-black pl-4">
                  <div className="font-mono text-2xl mb-1">24/7</div>
                  <div className="text-sm text-neutral-600">Acesso aberto</div>
                </div>
                <div className="border-l-4 border-black pl-4">
                  <div className="font-mono text-2xl mb-1">IA</div>
                  <div className="text-sm text-neutral-600">Análise inteligente</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-mono mb-8">Navegue por Categoria</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((category, idx) => {
            const Icon = category.icon;
            return (
              <Link
                key={idx}
                to={category.href}
                className="border border-neutral-200 p-6 hover:border-black hover:bg-neutral-50 transition-all group"
              >
                <Icon className="w-8 h-8 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-mono mb-2">{category.title}</h3>
                <p className="text-sm text-neutral-600 mb-4">{category.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-neutral-500">{category.count} docs</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Documentos Faltantes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-mono">Documentos Faltantes</h2>
          </div>
          <Link
            to="/documentos-faltantes"
            className="text-sm font-mono hover:underline flex items-center space-x-2"
          >
            <span>Ver todos</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {documentosFaltantes.slice(0, 2).map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onViewOriginal={doc.originalUrl ? () => handleViewOriginal(doc) : undefined}
              onViewAnalysis={doc.analysisUrl ? () => handleViewAnalysis(doc) : undefined}
            />
          ))}
        </div>
      </section>

      {/* Legal Notice */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-blue-50 border border-blue-200 p-8">
          <h2 className="font-mono text-lg mb-4">Base Legal e Jurídica</h2>
          <div className="prose prose-sm max-w-none text-neutral-700">
            <p>
              Esta plataforma é fundamentada na <strong>Lei de Acesso à Informação (LAI - Lei 12.527/2011)</strong>,
              na <strong>Lei de Responsabilidade Fiscal (LC 101/2000)</strong> e demais legislações de transparência pública.
            </p>
            <p className="mt-3">
              A divulgação de nomes de agentes públicos e figuras políticas ocorre exclusivamente no contexto
              de <strong>controle social e interesse público</strong>. As análises automatizadas são ferramentas
              de apoio técnico e não constituem pareceres jurídicos definitivos.
            </p>
            <p className="mt-3 text-sm italic">
              Em conformidade com a LGPD, não coletamos dados pessoais de cidadãos comuns, apenas informações
              públicas e institucionais já disponibilizadas pelos órgãos competentes.
            </p>
          </div>
        </div>
      </section>

      {/* Assistente CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-black text-white p-12 text-center">
          <h2 className="text-2xl font-mono mb-4">Assistente Jurídico Municipal</h2>
          <p className="text-neutral-300 mb-6 max-w-2xl mx-auto">
            Tire dúvidas sobre leis municipais, projetos em andamento e documentos públicos.
            Respostas baseadas em informações oficiais e legislação vigente.
          </p>
          <button
            type="button"
            onClick={openAssistantChat}
            className="inline-block px-8 py-3 bg-white text-black font-mono hover:bg-neutral-200 transition-colors"
          >
            ACESSAR ASSISTENTE
          </button>
        </div>
      </section>

      {/* PDF Modal */}
      <PdfModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        title={selectedDocument?.title || ''}
        date={selectedDocument?.date}
        source={selectedDocument?.sourceEntity}
        pdfUrl={selectedDocument?.originalUrl}
      />
    </div>
  );
}

