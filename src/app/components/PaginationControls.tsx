interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const previousPage = () => onPageChange(Math.max(1, currentPage - 1));
  const nextPage = () => onPageChange(Math.min(totalPages, currentPage + 1));

  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Paginação">
      <button
        type="button"
        onClick={previousPage}
        disabled={currentPage === 1}
        className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 hover:border-slate-900 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-45"
      >
        Anterior
      </button>

      <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
        Página {currentPage} de {totalPages}
      </span>

      <button
        type="button"
        onClick={nextPage}
        disabled={currentPage === totalPages}
        className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 hover:border-slate-900 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-45"
      >
        Próxima
      </button>
    </nav>
  );
}
