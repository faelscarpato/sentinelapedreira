// ===================================================================
// routes.tsx — Rotas atualizadas com Rastreabilidade
// ===================================================================
import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { DiarioOficial } from "./pages/DiarioOficial";
import { CamaraLegislativa } from "./pages/CamaraLegislativa";
import { CamaraAnaliseDetalhes } from "./pages/CamaraAnaliseDetalhes";
import { ContasPublicas } from "./pages/ContasPublicas";
import { ControleExterno } from "./pages/ControleExterno";
import { Repasses } from "./pages/Repasses";
import { TerceiroSetor } from "./pages/TerceiroSetor";
import { Relatorios } from "./pages/Relatorios";
import { DocumentosFaltantes } from "./pages/DocumentosFaltantes";
import { Denuncia } from "./pages/Denuncia";
import { AssistenteJuridico } from "./pages/AssistenteJuridico";
import { Rastreabilidade } from "./pages/Rastreabilidade";
import { RelatorioDetalhes } from "./pages/RelatorioDetalhes";
import { NotFound } from "./pages/NotFound";
import { Entrar } from "./pages/Entrar";
import { MinhaConta } from "./pages/MinhaConta";
import { PainelEditorial } from "./pages/PainelEditorial";
import { Root } from "./Root";
import { RequireAuth } from "./guards/RequireAuth";
import { RequireRoles } from "./guards/RequireRoles";

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
      { path: "terceiro-setor", Component: TerceiroSetor },
      { path: "relatorios", Component: Relatorios },
      { path: "relatorios/:id", Component: RelatorioDetalhes },
      { path: "documentos-faltantes", Component: DocumentosFaltantes },
      { path: "denuncia", Component: Denuncia },
      { path: "assistente", Component: AssistenteJuridico },
      {
        path: "minha-conta",
        element: (
          <RequireAuth>
            <MinhaConta />
          </RequireAuth>
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
