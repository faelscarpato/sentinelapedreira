// ===================================================================
// routes.tsx — Rotas com lazy loading para code splitting
// ===================================================================
import { lazy } from "react";
import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { RequireAuth } from "./guards/RequireAuth";
import { RequireRoles } from "./guards/RequireRoles";

// --- Lazy-loaded pages (each becomes its own chunk) ---
const Home = lazy(() => import("./pages/Home").then((m) => ({ default: m.Home })));
const Entrar = lazy(() => import("./pages/Entrar").then((m) => ({ default: m.Entrar })));
const DiarioOficial = lazy(() => import("./pages/DiarioOficial").then((m) => ({ default: m.DiarioOficial })));
const CamaraLegislativa = lazy(() => import("./pages/CamaraLegislativa").then((m) => ({ default: m.CamaraLegislativa })));
const CamaraAnaliseDetalhes = lazy(() => import("./pages/CamaraAnaliseDetalhes").then((m) => ({ default: m.CamaraAnaliseDetalhes })));
const ContasPublicas = lazy(() => import("./pages/ContasPublicas").then((m) => ({ default: m.ContasPublicas })));
const ControleExterno = lazy(() => import("./pages/ControleExterno").then((m) => ({ default: m.ControleExterno })));
const Repasses = lazy(() => import("./pages/Repasses").then((m) => ({ default: m.Repasses })));
const Receitas = lazy(() => import("./pages/Receitas").then((m) => ({ default: m.Receitas })));
const Despesas = lazy(() => import("./pages/Despesas").then((m) => ({ default: m.Despesas })));
const Licitacoes = lazy(() => import("./pages/Licitacoes").then((m) => ({ default: m.Licitacoes })));
const TerceiroSetor = lazy(() => import("./pages/TerceiroSetor").then((m) => ({ default: m.TerceiroSetor })));
const Relatorios = lazy(() => import("./pages/Relatorios").then((m) => ({ default: m.Relatorios })));
const RelatorioDetalhes = lazy(() => import("./pages/RelatorioDetalhes").then((m) => ({ default: m.RelatorioDetalhes })));
const DocumentoDetalhe = lazy(() => import("./pages/DocumentoDetalhe").then((m) => ({ default: m.DocumentoDetalhe })));
const DocumentosFaltantes = lazy(() => import("./pages/DocumentosFaltantes").then((m) => ({ default: m.DocumentosFaltantes })));
const Denuncia = lazy(() => import("./pages/Denuncia").then((m) => ({ default: m.Denuncia })));
const AssistenteJuridico = lazy(() => import("./pages/AssistenteJuridico").then((m) => ({ default: m.AssistenteJuridico })));
const Rastreabilidade = lazy(() => import("./pages/Rastreabilidade").then((m) => ({ default: m.Rastreabilidade })));
const PagamentosPendentes = lazy(() => import("./pages/PagamentosPendentes").then((m) => ({ default: m.PagamentosPendentes })));
const MinhaConta = lazy(() => import("./pages/MinhaConta").then((m) => ({ default: m.MinhaConta })));

// PHASE 4 - New pages
const Documents = lazy(() => import("./pages/Documents").then((m) => ({ default: m.Documents })));
const Analyses = lazy(() => import("./pages/Analyses").then((m) => ({ default: m.Analyses })));
const Complaints = lazy(() => import("./pages/Complaints").then((m) => ({ default: m.Complaints })));
const LegalAssistant = lazy(() => import("./pages/LegalAssistant").then((m) => ({ default: m.LegalAssistant })));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard").then((m) => ({ default: m.AdminDashboard })));
const Settings = lazy(() => import("./pages/Settings").then((m) => ({ default: m.Settings })));
const Help = lazy(() => import("./pages/Help").then((m) => ({ default: m.Help })));
const TransparencyReport = lazy(() => import("./pages/TransparencyReport").then((m) => ({ default: m.TransparencyReport })));

const PainelEditorial = lazy(() => import("./pages/PainelEditorial").then((m) => ({ default: m.PainelEditorial })));
const NotFound = lazy(() => import("./pages/NotFound").then((m) => ({ default: m.NotFound })));

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "entrar", Component: Entrar },
      { path: "diario-oficial", Component: DiarioOficial },
      { path: "camara", Component: CamaraLegislativa },
      { path: "camara/analises/:slug", Component: CamaraAnaliseDetalhes },
      { path: "contas-publicas", Component: ContasPublicas },
      { path: "controle-externo", Component: ControleExterno },
      { path: "repasses", Component: Repasses },
      { path: "receitas", Component: Receitas },
      { path: "despesas", Component: Despesas },
      { path: "licitacoes", Component: Licitacoes },
      { path: "pagamentos-pendentes", Component: PagamentosPendentes },
      { path: "terceiro-setor", Component: TerceiroSetor },

      { path: "relatorios", Component: Relatorios },
      { path: "relatorios/:id", Component: RelatorioDetalhes },
      { path: "documentos/:slug", Component: DocumentoDetalhe },
      { path: "documentos-faltantes", Component: DocumentosFaltantes },
      { path: "denuncia", Component: Denuncia },
      { path: "assistente", Component: AssistenteJuridico },
      
      // PHASE 4 - New routes
      { path: "documents", Component: Documents },
      { path: "analyses", Component: Analyses },
      { path: "complaints", Component: Complaints },
      { path: "legal-assistant", Component: LegalAssistant },
      { path: "help", Component: Help },
      { path: "relatorio-transparencia", Component: TransparencyReport },
      
      {
        path: "minha-conta",
        element: (
          <RequireAuth>
            <MinhaConta />
          </RequireAuth>
        ),
      },
      {
        path: "settings",
        element: (
          <RequireAuth>
            <Settings />
          </RequireAuth>
        ),
      },
      {
        path: "admin-dashboard",
        element: (
          <RequireRoles roles={["editor", "reviewer", "admin"]}>
            <AdminDashboard />
          </RequireRoles>
        ),
      },
      {
        path: "painel-editorial",
        element: (
          <RequireRoles roles={["editor", "reviewer", "admin"]}>
            <PainelEditorial />
          </RequireRoles>
        ),
      },
      {
        path: "rastreabilidade",
        element: (
          <RequireRoles roles={["editor", "reviewer", "admin"]}>
            <Rastreabilidade />
          </RequireRoles>
        ),
      },
      { path: "*", Component: NotFound },
    ],
  },
]);
