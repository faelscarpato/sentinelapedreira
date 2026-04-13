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
{ name: "Planejamento (LOA/LDO/PPA)", href: "/contas-publicas?subtype=loa", description: "Leis e metas" },
      ],
    },
    {
      id: "financas",
      name: "Finanças Públicas",
      items: [
        { name: "Panorama Contábil", href: "/contas-publicas", description: "Visão geral" },
        { name: "Receitas", href: "/receitas", description: "Arrecadação mensal" },
        { name: "Despesas", href: "/despesas", description: "Gastos detalhados" },
        { name: "Licitações", href: "/licitacoes", description: "Compras e contratos" },
        { name: "Repasses", href: "/repasses", description: "Transferências e destinação" },
        { name: "Pagamentos Pendentes", href: "/pagamentos-pendentes", description: "Restos a pagar" },
        { name: "Terceiro Setor", href: "/terceiro-setor", description: "Convênios e entidades" },
      ],
    },
    {
      id: "inteligencia",
      name: "Inteligência",
      items: [
        { name: "Assistente Jurídico", href: "/assistente", description: "IA via Edge Function" },
        { name: "Painel Editorial", href: "/painel-editorial", description: "Fluxo de revisão e publicação" },
{ name: "Indices de Transparência", href: "/relatorio-transparencia", description: "Relatório de Transparência" },
{ name: "Ajuda / FAQ", href: "/help", description: "Ajuda / FAQ" },
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

    // Debounce server-side search by 300ms to avoid flooding on each keystroke
    const timerId = window.setTimeout(() => {
      void run();
    }, 300);

    return () => {
      canceled = true;
      window.clearTimeout(timerId);
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
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl shadow-sm">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10">
        <div className="flex h-20 items-center justify-between gap-4">
          <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="Ir para início">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <AlertCircle className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="font-headline truncate text-lg font-black tracking-tight text-slate-950">Sentinela Pedreira</p>
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Transparência Cívica
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 xl:flex" aria-label="Navegação principal">
            {primaryLinks.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive(item.href)
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
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
                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    groupIsActive(group)
                      ? "bg-slate-100 text-slate-950"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  {group.name}
                  <ChevronDown className="h-4 w-4" />
                </button>

                {openGroupId === group.id && (
                  <div
                    className="absolute left-0 top-full z-50 w-[340px] pt-2"
                    onMouseEnter={clearCloseDropdownTimer}
                    onMouseLeave={scheduleDropdownClose}
                  >
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={(event) => {
                            handleGroupedItemClick(event, item);
                            setOpenGroupId(null);
                          }}
                          className="block border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50 transition-colors"
                        >
                          <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                          {item.description ? (
                            <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.description}</p>
                          ) : null}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-950 transition-colors"
              aria-label="Buscar"
            >
              <Search className="h-5 w-5" />
            </button>

            <Link
              to="/denuncia"
              className="hidden rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 md:inline-block"
            >
              Denunciar
            </Link>

            <button
              type="button"
              onClick={handleAssistantShortcut}
              className="hidden rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-900 hover:text-slate-900 md:inline-block"
            >
              Assistente IA
            </button>

            {auth.isAuthenticated ? (
              <>
                <Link
                  to="/minha-conta"
                  className="hidden rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-900 hover:text-slate-900 md:inline-block"
                >
                  Minha conta
                </Link>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="hidden rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-900 hover:text-slate-900 md:inline-block"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link
                to="/entrar"
                className="hidden rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-900 hover:text-slate-900 md:inline-block"
              >
                Entrar
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-950 xl:hidden"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-slate-200 py-4">
            <form className="relative" onSubmit={handleSearchSubmit}>
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar documentos, leis, projetos..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-slate-800 focus:outline-none"
                autoFocus
              />
            </form>

            {normalizedSearch.length > 0 && (
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                {searchLoading && (
                  <div className="px-4 py-3 text-sm text-slate-600">Buscando no servidor...</div>
                )}

                {searchError && (
                  <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {searchError}
                  </div>
                )}

                {searchResults.length > 0 ? (
                  <ul className="divide-y divide-slate-200">
                    {searchResults.map((result) => (
                      <li key={result.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectSearchResult(result.href)}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{result.title}</p>
                              <p className="mt-1 text-xs text-slate-600">{result.subtitle}</p>
                            </div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase text-slate-500">
                              <FileText className="h-3 w-3" />
                              {result.type} · {result.source}
                            </span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  !searchLoading && (
                    <div className="px-4 py-3 text-sm text-slate-600">
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
        <div className="border-t border-slate-200 bg-white xl:hidden">
          <nav className="space-y-1 px-4 py-4">
            {primaryLinks.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive(item.href)
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item.name}
              </Link>
            ))}

            {groupedNavigation.map((group) => (
              <div key={group.id} className="mt-3 border-t border-slate-200 pt-3">
                <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {group.name}
                </p>
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={(event) => {
                      handleGroupedItemClick(event, item);
                      setMobileMenuOpen(false);
                    }}
                    className={`block rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      isActive(item.href)
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-100"
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
              className="mt-4 block rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
            >
              Fazer denúncia
            </Link>

            {auth.isAuthenticated ? (
              <>
                <Link
                  to="/minha-conta"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                >
                  Minha conta
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    void handleSignOut();
                  }}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-left text-sm font-semibold text-slate-700"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link
                to="/entrar"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
              >
                Entrar
              </Link>
            )}

            <button
              type="button"
              onClick={handleAssistantShortcut}
              className="block w-full rounded-lg border border-slate-900 px-3 py-2 text-left text-sm font-semibold text-slate-900"
            >
              Assistente Jurídico
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
