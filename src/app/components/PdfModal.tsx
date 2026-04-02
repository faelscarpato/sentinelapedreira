import { X, Download, ExternalLink } from "lucide-react";
import { useEffect } from "react";

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full h-full md:w-[90vw] md:h-[90vh] md:max-w-6xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <div className="flex-1 pr-4">
            <h2 className="font-mono text-lg mb-1">{title}</h2>
            <div className="flex items-center space-x-4 text-xs text-neutral-600">
              {date && <span>{new Date(date).toLocaleDateString('pt-BR')}</span>}
              {source && <span>{source}</span>}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={openInNewTab}
              disabled={!canOpenUrl}
              className="p-2 hover:bg-neutral-100 transition-colors"
              aria-label="Abrir em nova aba"
            >
              <ExternalLink className="w-5 h-5" />
            </button>
            <button
              onClick={downloadDocument}
              disabled={!canOpenUrl}
              className="p-2 hover:bg-neutral-100 transition-colors"
              aria-label="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Preview */}
        <div className="flex-1 p-4 overflow-auto bg-neutral-50">
          {viewerUrl ? (
            <div className="h-full bg-white border border-neutral-200">
              <object
                data={viewerUrl}
                type="application/pdf"
                className="w-full h-full min-h-[70vh]"
              >
                <div className="h-full flex flex-col items-center justify-center px-8 text-center">
                  <p className="text-neutral-700 mb-4">
                    Seu navegador não conseguiu renderizar o PDF nesta visualização.
                  </p>
                  <button
                    onClick={openInNewTab}
                    className="px-5 py-2 bg-black text-white text-sm font-mono hover:bg-neutral-800 transition-colors"
                  >
                    ABRIR PDF NA FONTE OFICIAL
                  </button>
                </div>
              </object>
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
