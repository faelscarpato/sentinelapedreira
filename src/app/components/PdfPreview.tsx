import { useEffect, useMemo, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface PdfPreviewProps {
  pdfUrl: string;
}

export function PdfPreview({ pdfUrl }: PdfPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [pdfDocument, setPdfDocument] = useState<any | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [viewerMode, setViewerMode] = useState<"pdf" | "web">("pdf");
  const [isLoading, setIsLoading] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateWidth = () => {
      setContainerWidth(element.clientWidth);
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setPageNumber(1);
    setPdfDocument(null);
    setNumPages(0);
    setViewerMode("pdf");

    const loadingTask = pdfjsLib.getDocument({
      url: pdfUrl,
      withCredentials: false,
      disableRange: true,
      disableStream: true,
      disableAutoFetch: true,
    });

    loadingTask.promise
      .then((document: any) => {
        if (!isMounted) return;
        setPdfDocument(document);
        setNumPages(document.numPages || 0);
        setViewerMode("pdf");
      })
      .catch(() => {
        if (!isMounted) return;
        setViewerMode("web");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      loadingTask.destroy();
    };
  }, [pdfUrl]);

  useEffect(() => {
    let isMounted = true;
    if (viewerMode !== "pdf" || !pdfDocument || !canvasRef.current || containerWidth <= 0) return;

    const renderPage = async () => {
      setIsRendering(true);
      try {
        const page = await pdfDocument.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1 });
        const maxWidth = Math.max(containerWidth - 24, 280);
        const scale = maxWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale: Math.max(scale, 0.6) });
        const outputScale = window.devicePixelRatio || 1;
        const canvas = canvasRef.current;

        if (!canvas) return;
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = Math.floor(scaledViewport.width * outputScale);
        canvas.height = Math.floor(scaledViewport.height * outputScale);
        canvas.style.width = `${Math.floor(scaledViewport.width)}px`;
        canvas.style.height = `${Math.floor(scaledViewport.height)}px`;

        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
          transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0],
        };

        await page.render(renderContext).promise;
      } catch {
        if (isMounted) setViewerMode("web");
      } finally {
        if (isMounted) {
          setIsRendering(false);
        }
      }
    };

    renderPage();

    return () => {
      isMounted = false;
    };
  }, [containerWidth, pageNumber, pdfDocument, viewerMode]);

  const disablePrevious = pageNumber <= 1 || isLoading || isRendering;
  const disableNext = pageNumber >= numPages || isLoading || isRendering;

  const statusText = useMemo(() => {
    if (viewerMode === "web") return "Visualizacao web do documento.";
    if (isLoading) return "Carregando PDF...";
    if (!numPages) return "PDF sem paginas para visualizacao.";
    return `Pagina ${pageNumber} de ${numPages}`;
  }, [isLoading, numPages, pageNumber, viewerMode]);

  return (
    <div ref={containerRef} className="h-full flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-neutral-200 bg-white">
        <p className="text-xs font-mono text-neutral-600 break-words">{statusText}</p>
        {viewerMode === "pdf" && (
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
            disabled={disablePrevious}
            className="px-2.5 py-1 border border-neutral-300 text-[11px] sm:text-xs font-mono disabled:text-neutral-400 disabled:border-neutral-200"
          >
            ANTERIOR
          </button>
          <button
            type="button"
            onClick={() => setPageNumber((prev) => Math.min(numPages, prev + 1))}
            disabled={disableNext}
            className="px-2.5 py-1 border border-neutral-300 text-[11px] sm:text-xs font-mono disabled:text-neutral-400 disabled:border-neutral-200"
          >
            PROXIMA
          </button>
        </div>
        )}
      </div>

      <div className="flex-1 overflow-auto bg-neutral-100 p-3">
        <div className="min-h-full flex items-center justify-center">
          {viewerMode === "web" ? (
            <iframe
              title="Visualizacao do documento"
              src={pdfUrl}
              className="w-full h-full min-h-[70vh] border border-neutral-200 bg-white"
            />
          ) : isLoading ? (
            <p className="text-sm text-neutral-600">Carregando PDF...</p>
          ) : (
            <canvas ref={canvasRef} className="shadow-sm border border-neutral-200 bg-white" />
          )}
        </div>
      </div>
    </div>
  );
}
