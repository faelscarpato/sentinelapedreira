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
  const [isLoading, setIsLoading] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
    setPageNumber(1);
    setPdfDocument(null);

    const loadingTask = pdfjsLib.getDocument({
      url: pdfUrl,
      withCredentials: false,
    });

    loadingTask.promise
      .then((document: any) => {
        if (!isMounted) return;
        setPdfDocument(document);
        setNumPages(document.numPages || 0);
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Nao foi possivel carregar este PDF no visualizador interno.");
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
    if (!pdfDocument || !canvasRef.current || containerWidth <= 0) return;

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
        if (isMounted) {
          setError("Falha ao renderizar a pagina do PDF neste dispositivo.");
        }
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
  }, [containerWidth, pageNumber, pdfDocument]);

  const disablePrevious = pageNumber <= 1 || isLoading || isRendering;
  const disableNext = pageNumber >= numPages || isLoading || isRendering;

  const statusText = useMemo(() => {
    if (isLoading) return "Carregando PDF...";
    if (error) return error;
    if (!numPages) return "PDF sem paginas para visualizacao.";
    return `Pagina ${pageNumber} de ${numPages}`;
  }, [error, isLoading, numPages, pageNumber]);

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
        <p className="text-sm text-neutral-700">{statusText}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 bg-white">
        <p className="text-xs font-mono text-neutral-600">{statusText}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
            disabled={disablePrevious}
            className="px-3 py-1 border border-neutral-300 text-xs font-mono disabled:text-neutral-400 disabled:border-neutral-200"
          >
            ANTERIOR
          </button>
          <button
            type="button"
            onClick={() => setPageNumber((prev) => Math.min(numPages, prev + 1))}
            disabled={disableNext}
            className="px-3 py-1 border border-neutral-300 text-xs font-mono disabled:text-neutral-400 disabled:border-neutral-200"
          >
            PROXIMA
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-neutral-100 p-3">
        <div className="min-h-full flex items-center justify-center">
          {isLoading ? (
            <p className="text-sm text-neutral-600">Carregando PDF...</p>
          ) : (
            <canvas ref={canvasRef} className="shadow-sm border border-neutral-200 bg-white" />
          )}
        </div>
      </div>
    </div>
  );
}
