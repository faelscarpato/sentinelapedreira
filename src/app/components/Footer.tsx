import { Link } from "react-router";
import { ShieldCheck } from "lucide-react";
import { lastUpdatedAt } from "../data/realData";

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR");
}

export function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-12 sm:px-6 lg:px-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="font-headline text-lg font-black tracking-tight text-slate-950">Sentinela Pedreira</p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
              Plataforma pública de inteligência cívica municipal para transparência ativa, controle social
              e rastreabilidade editorial de documentos oficiais.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              <ShieldCheck className="h-4 w-4" />
              Base legal: LAI, LRF e legislação de transparência pública
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Navegação</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link to="/" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/diario-oficial" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Diário Oficial
                </Link>
              </li>
              <li>
                <Link to="/contas-publicas" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Contas Públicas
                </Link>
              </li>
              <li>
                <Link to="/relatorios" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Relatórios
                </Link>
              </li>
              <li>
                <Link to="/denuncia" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Canal de Denúncia
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Institucional</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="#sobre" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Sobre a Plataforma
                </a>
              </li>
              <li>
                <a href="#base-legal" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Base Legal
                </a>
              </li>
              <li>
                <a href="#privacidade" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a href="#contato" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Contato
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6">
          <div className="flex flex-col gap-3 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
            <p>© 2026 Sentinela Pedreira. Plataforma de interesse público e controle social.</p>
            <p>Dados atualizados em: {formatDate(lastUpdatedAt)}</p>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Aviso: As análises automatizadas têm caráter de apoio técnico e não substituem pareceres
            jurídicos oficiais. A divulgação de nomes de agentes públicos ocorre sob interesse público,
            conforme regras de transparência e acesso à informação.
          </p>
        </div>
      </div>
    </footer>
  );
}
