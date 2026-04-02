import { X, Download, ExternalLink } from "lucide-react";
import { useEffect } from "react";
import { PdfPreview } from "./PdfPreview";

interface PdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  date?: string;
  source?: string;
  pdfUrl?: string;
}

export function PdfModal({ isOpen, onClose, title, date, source, pdfUrl }: PdfModalProps) {
  const canOpenUrl = Boolean(pdfUrl);
  const viewerUrl = pdfUrl ?? "";

  const openInNewTab = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  };

  const downloadDocument = () => {
    if (!pdfUrl) return;

    const anchor = document.createElement("a");
    anchor.href = pdfUrl;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.download = "";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-3">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full h-[100dvh] sm:h-[min(90dvh,900px)] sm:w-[90vw] sm:max-w-6xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex flex-col gap-3 p-3 sm:p-4 border-b border-neutral-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="font-mono text-sm sm:text-lg mb-1 break-words">{title}</h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-neutral-600">
              {date && <span>{new Date(date).toLocaleDateString('pt-BR')}</span>}
              {source && <span>{source}</span>}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openInNewTab}
              disabled={!canOpenUrl}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-neutral-300 hover:bg-neutral-100 transition-colors text-[11px] sm:text-xs font-mono"
              aria-label="Abrir em nova aba"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Nova aba</span>
            </button>
            <button
              onClick={downloadDocument}
              disabled={!canOpenUrl}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-neutral-300 hover:bg-neutral-100 transition-colors text-[11px] sm:text-xs font-mono"
              aria-label="Download"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* PDF Preview */}
        <div className="flex-1 p-2 sm:p-4 overflow-auto bg-neutral-50 min-h-0">
          {viewerUrl ? (
            <div className="h-full bg-white border border-neutral-200 min-h-[40dvh] sm:min-h-[70vh]">
              <PdfPreview pdfUrl={viewerUrl} />
            </div>
          ) : (
            <div className="max-w-3xl mx-auto bg-white border border-neutral-200 p-8">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-neutral-100 flex items-center justify-center mb-4">
                  <ExternalLink className="w-8 h-8 text-neutral-400" />
                </div>
                <p className="text-neutral-700">Link do PDF indisponível para este documento.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
