import { Link } from "react-router";
import { ShieldCheck } from "lucide-react";
import { lastUpdatedAt } from "../data/realData";

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR");
}

export function FooterLinks() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-12 sm:px-6 lg:px-10">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Coluna 1 — Identidade */}
          <div className="md:col-span-2">
            <p className="font-headline text-lg font-black tracking-tight text-slate--950">
              Sentinela Pedreira
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
              Plataforma pública de inteligência cívica municipal para transparência ativa, controle
              social e rastreabilidade editorial de documentos oficiais.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              <ShieldCheck className="h-4 w-4" />
              Base legal: LAI, LRF e legislação de transparência pública
            </div>
          </div>

          {/* Coluna 2 — Documentos */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Documentos
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link to="/diario-oficial" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Diário Oficial
                </Link>
              </li>
              <li>
                <Link to="/camara" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Câmara Legislativa
                </Link>
              </li>
              <li>
                <Link to="/controle-externo" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Controle Externo
                </Link>
              </li>
              <li>
                <Link to="/documentos-faltantes" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Documentos Faltantes
                </Link>
              </li>
              <li>
                <Link to="/relatorios" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Relatórios
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3 — Finanças */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Finanças Públicas
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link to="/contas-publicas" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Panorama Contábil
                </Link>
              </li>
              <li>
                <Link to="/receitas" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Receitas
                </Link>
              </li>
              <li>
                <Link to="/despesas" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Despesas
                </Link>
              </li>
              <li>
                <Link to="/licitacoes" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Licitações
                </Link>
              </li>
              <li>
                <Link to="/repasses" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Repasses
                </Link>
              </li>
              <li>
                <Link to="/pagamentos-pendentes" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Pagamentos Pendentes
                </Link>
              </li>
              <li>
                <Link to="/terceiro-setor" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Terceiro Setor
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Segunda linha — Institucional + Plataforma */}
        <div className="mt-10 grid gap-8 border-t border-slate-100 pt-8 md:grid-cols-4">
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Plataforma
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link to="/" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/assistente" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Assistente Jurídico
                </Link>
              </li>
              <li>
                <Link to="/denuncia" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Canal de Denúncia
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Ajuda / FAQ
                </Link>
              </li>
              <li>
                <Link to="/relatorio-transparencia" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Relatório de Transparência
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Institucional
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link to="/#sobre" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Sobre a Plataforma
                </Link>
              </li>
              <li>
                <Link to="/#base-legal" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Base Legal
                </Link>
              </li>
              <li>
                <Link to="/#privacidade" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link to="/#contato" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Contato
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-10 border-t border-slate-100 pt-6 text-xs text-slate-500">
          <p>© 2026 Sentinela Pedreira. Plataforma de interesse público e controle social.</p>
          <p className="mt-1">
            Dados atualizados em: {formatDate(lastUpdatedAt)}
          </p>
          <p className="mt-3 max-w-3xl leading-relaxed">
            Aviso: As análises automatizadas têm caráter de apoio técnico e não substituem pareceres
            jurídicos oficiais. A divulgação de nomes de agentes públicos ocorre sob interesse
            público, conforme regras de transparência e acesso à informação.
          </p>
        </div>
      </div>
    </footer>
  );
}

export const Footer = FooterLinks;