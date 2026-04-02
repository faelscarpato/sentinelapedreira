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
    <div className="flex items-center justify-center gap-3 mt-8">
      <button
        type="button"
        onClick={previousPage}
        disabled={currentPage === 1}
        className="px-3 py-2 border border-neutral-300 text-sm font-mono hover:border-black disabled:text-neutral-400 disabled:border-neutral-200"
      >
        ANTERIOR
      </button>

      <span className="text-sm font-mono text-neutral-600">
        PÁGINA {currentPage} DE {totalPages}
      </span>

      <button
        type="button"
        onClick={nextPage}
        disabled={currentPage === totalPages}
        className="px-3 py-2 border border-neutral-300 text-sm font-mono hover:border-black disabled:text-neutral-400 disabled:border-neutral-200"
      >
        PRÓXIMA
      </button>
    </div>
  );
}
