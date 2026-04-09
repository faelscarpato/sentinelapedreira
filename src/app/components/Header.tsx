import { Link, useLocation, useNavigate } from "react-router";
import { Search, Menu, X, AlertCircle, FileText, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from "react";
import {
  allDocuments,
  reports,
  documentosFaltantes,
} from "../data/realData";
import { openAssistantChat } from "../lib/assistantEvents";
import { useAuth } from "../../features/auth/useAuth";
import { searchPublicDocuments } from "../services/documentsService";
import { getDocumentDetailHref } from "../lib/documentDetailRoute";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  type: "documento" | "relatorio";
  date: string;
  source: "local" | "server";
}

interface NavigationItem {
  name: string;
  href: string;
  description?: string;
}

interface NavigationGroup {
  id: string;
  name: string;
  items: NavigationItem[];
}

export function Header() {
  const auth = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [serverSearchResults, setServerSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const closeDropdownTimeoutRef = useRef<number | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const primaryLinks: NavigationItem[] = [
    { name: "Início", href: "/" },
    { name: "Relatórios", href: "/relatorios" },
  ];

  const groupedNavigation: NavigationGroup[] = [
    {
      id: "documentos",
      name: "Documentos",
      items: [
        { name: "Diário Oficial", href: "/diario-oficial", description: "Edições e publicações" },
        { name: "Câmara Legislativa", href: "/camara", description: "Projetos e proposições" },
        { name: "Controle Externo", href: "/controle-externo", description: "TCE, TCU e fiscalização" },
        { name: "Documentos Faltantes", href: "/documentos-faltantes", description: "Radar de ausência" },
      ],
    },
    {
      id: "financas",
      name: "Finanças Públicas",
      items: [
        { name: "Panorama Contábil", href: "/contas-publicas", description: "Visão geral" },
        { name: "Receitas", href: "/contas-publicas?subtype=receita-mensal", description: "Arrecadação mensal" },
        { name: "Despesas", href: "/contas-publicas?subtype=despesa-mensal", description: "Gastos detalhados" },
        { name: "Planejamento (LOA/LDO/PPA)", href: "/contas-publicas?subtype=loa", description: "Leis e metas" },
        { name: "Repasses", href: "/repasses", description: "Transferências e destinação" },
        { name: "Pagamentos Pendentes", href: "/controle-externo?subtype=restos-a-pagar", description: "Restos a pagar" },
        { name: "Terceiro Setor", href: "/terceiro-setor", description: "Convênios e entidades" },
      ],
    },
    {
      id: "inteligencia",
      name: "Inteligência",
      items: [
        { name: "Assistente Jurídico", href: "/assistente", description: "IA via Edge Function" },
        { name: "Painel Editorial", href: "/painel-editorial", description: "Fluxo de revisão e publicação" },
      ],
    },
  ];

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const clearCloseDropdownTimer = () => {
    if (closeDropdownTimeoutRef.current !== null) {
      window.clearTimeout(closeDropdownTimeoutRef.current);
      closeDropdownTimeoutRef.current = null;
    }
  };

  const scheduleDropdownClose = () => {
    clearCloseDropdownTimer();
    closeDropdownTimeoutRef.current = window.setTimeout(() => {
      setOpenGroupId(null);
    }, 180);
  };

  useEffect(() => {
    return () => clearCloseDropdownTimer();
  }, []);

  const localSearchResults = useMemo<SearchResult[]>(() => {
    if (normalizedSearch.length < 2) return [];

    const searchableDocuments = [...allDocuments, ...documentosFaltantes];

    const documentResults = searchableDocuments
      .filter((document) => {
        const indexedFields = [
          document.title,
          document.summary,
          document.sourceEntity,
          document.category,
          ...document.tags,
        ]
          .join(" ")
          .toLowerCase();
        return indexedFields.includes(normalizedSearch);
      })
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6)
      .map((document) => ({
        id: `doc-${document.id}`,
        title: document.title,
        subtitle: `${document.category} · ${document.sourceEntity}`,
        href: getDocumentDetailHref(document),
        type: "documento" as const,
        date: document.date,
        source: "local" as const,
      }));

    const reportResults = reports
      .filter((report) => {
        const indexedFields = [report.title, report.summary, report.category, ...report.tags]
          .join(" ")
          .toLowerCase();
        return indexedFields.includes(normalizedSearch);
      })
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 4)
      .map((report) => ({
        id: `report-${report.id}`,
        title: report.title,
        subtitle: `${report.category} · Relatório`,
        href: `/relatorios/${report.id}`,
        type: "relatorio" as const,
        date: report.date,
        source: "local" as const,
      }));

    return [...documentResults, ...reportResults]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);
  }, [normalizedSearch]);

  useEffect(() => {
    if (!auth.isSupabaseEnabled || normalizedSearch.length < 2) {
      setServerSearchResults([]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    let canceled = false;

    const run = async () => {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const rows = await searchPublicDocuments(normalizedSearch, 8);
        if (canceled) return;

        const mapped: SearchResult[] = rows.map((row) => ({
          id: `server-${row.id}`,
          title: row.title,
          subtitle: `${row.category}${row.subtype ? ` · ${row.subtype}` : ""}`,
          href: `/documentos/${row.slug}`,
          type: "documento",
          date: row.published_at,
          source: "server",
        }));

        setServerSearchResults(mapped);
      } catch (error) {
        if (canceled) return;
        setSearchError(error instanceof Error ? error.message : "Falha na busca server-side.");
        setServerSearchResults([]);
      } finally {
        if (!canceled) {
          setSearchLoading(false);
        }
      }
    };

    void run();

    return () => {
      canceled = true;
    };
  }, [auth.isSupabaseEnabled, normalizedSearch]);

  const searchResults = serverSearchResults.length > 0 ? serverSearchResults : localSearchResults;

  const isActive = (href: string) => {
    const hrefPathname = href.split("?")[0];
    if (hrefPathname === "/") return location.pathname === "/";
    return location.pathname.startsWith(hrefPathname);
  };

  const groupIsActive = (group: NavigationGroup) => {
    return group.items.some((item) => isActive(item.href));
  };

  const handleSelectSearchResult = (href: string) => {
    navigate(href);
    setSearchOpen(false);
    setSearchTerm("");
    setOpenGroupId(null);
    setMobileMenuOpen(false);
  };

  const handleAssistantShortcut = () => {
    openAssistantChat();
    setOpenGroupId(null);
    setMobileMenuOpen(false);
  };

  const handleGroupedItemClick = (event: MouseEvent, item: NavigationItem) => {
    if (item.href !== "/assistente") return;
    event.preventDefault();
    handleAssistantShortcut();
  };

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    const firstResult = searchResults[0];
    if (!firstResult) return;
    handleSelectSearchResult(firstResult.href);
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate("/");
    } catch {
      // noop
    }
  };

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-black flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono tracking-tight text-lg">CIVIC_WATCH</span>
              <span className="text-xs text-neutral-600 font-mono">FISCALIZA PEDREIRA</span>
            </div>
          </Link>

          <nav className="hidden xl:flex items-center space-x-1">
            {primaryLinks.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 text-sm font-mono transition-colors ${
                  isActive(item.href)
                    ? "text-black border-b-2 border-black"
                    : "text-neutral-600 hover:text-black"
                }`}
              >
                {item.name}
              </Link>
            ))}

            {groupedNavigation.map((group) => (
              <div
                key={group.id}
                className="relative"
                onMouseEnter={() => {
                  clearCloseDropdownTimer();
                  setOpenGroupId(group.id);
                }}
                onMouseLeave={scheduleDropdownClose}
              >
                <button
                  type="button"
                  className={`px-3 py-2 text-sm font-mono transition-colors inline-flex items-center gap-1 ${
                    groupIsActive(group)
                      ? "text-black border-b-2 border-black"
                      : "text-neutral-600 hover:text-black"
                  }`}
                >
                  {group.name}
                  <ChevronDown className="w-4 h-4" />
                </button>

                {openGroupId === group.id && (
                  <div
                    className="absolute left-0 top-full pt-1 w-[320px] z-50"
                    onMouseEnter={clearCloseDropdownTimer}
                    onMouseLeave={scheduleDropdownClose}
                  >
                    <div className="border border-neutral-200 bg-white shadow-sm">
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={(event) => {
                            handleGroupedItemClick(event, item);
                            setOpenGroupId(null);
                          }}
                          className="block px-4 py-3 border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 transition-colors"
                        >
                          <p className="font-mono text-sm text-neutral-900">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-neutral-600 mt-1">{item.description}</p>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 hover:bg-neutral-100 transition-colors"
              aria-label="Buscar"
            >
              <Search className="w-5 h-5" />
            </button>

            <Link
              to="/denuncia"
              className="hidden md:block px-4 py-2 bg-black text-white text-sm font-mono hover:bg-neutral-800 transition-colors"
            >
              DENÚNCIA
            </Link>

            <button
              type="button"
              onClick={handleAssistantShortcut}
              className="hidden md:block px-4 py-2 border border-black text-black text-sm font-mono hover:bg-black hover:text-white transition-colors"
            >
              AI ASSIST
            </button>

            {auth.isAuthenticated ? (
              <>
                <Link
                  to="/minha-conta"
                  className="hidden md:block px-4 py-2 border border-neutral-300 text-sm font-mono hover:border-black"
                >
                  MINHA CONTA
                </Link>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="hidden md:block px-4 py-2 border border-neutral-300 text-sm font-mono hover:border-black"
                >
                  SAIR
                </button>
              </>
            ) : (
              <Link
                to="/entrar"
                className="hidden md:block px-4 py-2 border border-neutral-300 text-sm font-mono hover:border-black"
              >
                ENTRAR
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 hover:bg-neutral-100 transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="py-4 border-t border-neutral-200">
            <form className="relative" onSubmit={handleSearchSubmit}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar documentos, leis, projetos..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 focus:outline-none focus:border-black font-mono text-sm"
                autoFocus
              />
            </form>

            {normalizedSearch.length > 0 && (
              <div className="mt-3 border border-neutral-200 bg-white">
                {searchLoading && (
                  <div className="px-4 py-3 text-sm text-neutral-600">Buscando no servidor...</div>
                )}

                {searchError && (
                  <div className="px-4 py-3 text-sm text-red-700 bg-red-50 border-b border-red-200">
                    {searchError}
                  </div>
                )}

                {searchResults.length > 0 ? (
                  <ul className="divide-y divide-neutral-200">
                    {searchResults.map((result) => (
                      <li key={result.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectSearchResult(result.href)}
                          className="w-full text-left px-4 py-3 hover:bg-neutral-50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-mono text-sm">{result.title}</p>
                              <p className="text-xs text-neutral-600 mt-1">{result.subtitle}</p>
                            </div>
                            <span className="text-[11px] font-mono uppercase text-neutral-500 flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {result.type} · {result.source}
                            </span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  !searchLoading && (
                    <div className="px-4 py-3 text-sm text-neutral-600">
                      Nenhum resultado encontrado para "{searchTerm}".
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-neutral-200 bg-white">
          <nav className="px-4 py-4 space-y-1">
            {primaryLinks.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-sm font-mono transition-colors ${
                  isActive(item.href)
                    ? "bg-black text-white"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {item.name}
              </Link>
            ))}

            {groupedNavigation.map((group) => (
              <div key={group.id} className="pt-3 mt-3 border-t border-neutral-200">
                <p className="px-3 pb-1 text-xs text-neutral-500 font-mono uppercase">{group.name}</p>
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={(event) => {
                      handleGroupedItemClick(event, item);
                      setMobileMenuOpen(false);
                    }}
                    className={`block px-3 py-2 text-sm font-mono transition-colors ${
                      isActive(item.href)
                        ? "bg-black text-white"
                        : "text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            ))}

            <Link
              to="/denuncia"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 bg-black text-white text-sm font-mono mt-4"
            >
              FAZER DENÚNCIA
            </Link>

            {auth.isAuthenticated ? (
              <>
                <Link
                  to="/minha-conta"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 border border-neutral-300 text-sm font-mono"
                >
                  MINHA CONTA
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    void handleSignOut();
                  }}
                  className="block w-full text-left px-3 py-2 border border-neutral-300 text-sm font-mono"
                >
                  SAIR
                </button>
              </>
            ) : (
              <Link
                to="/entrar"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 border border-neutral-300 text-sm font-mono"
              >
                ENTRAR
              </Link>
            )}

            <button
              type="button"
              onClick={handleAssistantShortcut}
              className="block w-full text-left px-3 py-2 border border-black text-black text-sm font-mono"
            >
              ASSISTENTE JURÍDICO
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
