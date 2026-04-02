import { Link } from "react-router";
import { Shield } from "lucide-react";
import { lastUpdatedAt } from "../data/mockData";

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR");
}

export function Footer() {
  return (
    <footer className="bg-neutral-50 border-t border-neutral-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div className="col-span-1 md:col-span-2">
            <div className="font-mono text-lg mb-4">CIVIC_WATCH</div>
            <p className="text-sm text-neutral-600 mb-4">
              Plataforma pública de inteligência cívica municipal. Organizando dados públicos
              para facilitar o controle social e a transparência.
            </p>
            <div className="flex items-center space-x-2 text-xs text-neutral-500">
              <Shield className="w-4 h-4" />
              <span>Base legal: LAI, LRF e legislação de transparência pública</span>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-mono text-sm mb-4">NAVEGAÇÃO</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-neutral-600 hover:text-black transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/diario-oficial" className="text-neutral-600 hover:text-black transition-colors">
                  Diário Oficial
                </Link>
              </li>
              <li>
                <Link to="/relatorios" className="text-neutral-600 hover:text-black transition-colors">
                  Relatórios
                </Link>
              </li>
              <li>
                <Link to="/repasses" className="text-neutral-600 hover:text-black transition-colors">
                  Repasses
                </Link>
              </li>
              <li>
                <Link to="/terceiro-setor" className="text-neutral-600 hover:text-black transition-colors">
                  Terceiro Setor
                </Link>
              </li>
              <li>
                <Link to="/documentos-faltantes" className="text-neutral-600 hover:text-black transition-colors">
                  Documentos Faltantes
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-mono text-sm mb-4">INSTITUCIONAL</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#sobre" className="text-neutral-600 hover:text-black transition-colors">
                  Sobre a Plataforma
                </a>
              </li>
              <li>
                <a href="#base-legal" className="text-neutral-600 hover:text-black transition-colors">
                  Base Legal
                </a>
              </li>
              <li>
                <a href="#privacidade" className="text-neutral-600 hover:text-black transition-colors">
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a href="#contato" className="text-neutral-600 hover:text-black transition-colors">
                  Contato
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-neutral-200">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-xs text-neutral-500 font-mono">
              © 2026 CIVIC_WATCH. Plataforma de interesse público e controle social.
            </p>
            <div className="flex items-center space-x-4 text-xs text-neutral-500">
              <span>Dados atualizados em: {formatDate(lastUpdatedAt)}</span>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-neutral-500 italic">
              Aviso: Esta plataforma tem caráter informativo e fiscalizatório. As análises automatizadas
              são apoio técnico e não constituem pareceres jurídicos oficiais. A divulgação de nomes
              de agentes públicos ocorre no contexto de transparência e controle social, conforme LAI.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
