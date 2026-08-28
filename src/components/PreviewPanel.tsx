import React, { useRef, useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface PreviewPanelProps {
  pdfUrl: string;
  pdfError: string;
  isDragging: boolean;
  compiling: boolean;
  pageCount: number;
}

interface PdfPageCanvasProps {
  pdf: any;
  pageNum: number;
  width: number;
  height: number;
}

// Sub-component to render a single PDF page onto a canvas with high-DPI support
const PdfPageCanvas: React.FC<PdfPageCanvasProps> = ({ pdf, pageNum, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let isCurrent = true;
    const renderPage = async () => {
      try {
        const page = await pdf.getPage(pageNum);
        if (!isCurrent) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // Calculate scale to match target page width
        const viewport = page.getViewport({ scale: 1.0 });
        const scaleFactor = width / viewport.width;
        const scaledViewport = page.getViewport({ scale: scaleFactor });

        // Account for Retina / High-DPI screens
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        context.scale(dpr, dpr);

        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
        };
        await page.render(renderContext).promise;
      } catch (err) {
        console.error(`Page ${pageNum} render error:`, err);
      }
    };

    renderPage();
    return () => {
      isCurrent = false;
    };
  }, [pdf, pageNum, width, height]);

  return (
    <canvas 
      ref={canvasRef} 
      className="shadow-sm border border-slate-300 bg-white rounded-xs select-none pointer-events-none"
    />
  );
};

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ 
  pdfUrl, 
  pdfError, 
  isDragging: _isDragging,
  compiling,
  pageCount
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 800 });
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  // Measure container dimensions dynamically
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width || 600,
          height: entry.contentRect.height || 800,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Fetch and load the PDF document using PDF.js
  useEffect(() => {
    if (!pdfUrl || !window.pdfjsLib) return;

    let isCurrent = true;
    setLoadingPdf(true);

    const loadDoc = async () => {
      try {
        const loadingTask = window.pdfjsLib.getDocument(pdfUrl);
        const doc = await loadingTask.promise;
        if (isCurrent) {
          setPdfDoc(doc);
        }
      } catch (err) {
        console.error('Error loading PDF document:', err);
      } finally {
        if (isCurrent) {
          setLoadingPdf(false);
        }
      }
    };

    loadDoc();
    return () => {
      isCurrent = false;
    };
  }, [pdfUrl]);

  // Standard US Letter page aspect ratio parameters
  const targetW = 612;
  const targetH = 792;
  const availableW = dimensions.width;
  const availableH = dimensions.height;

  // Optimal scale factor to fit a single page inside the container window (zoomed to 102%)
  const scale = Math.min(availableW / targetW, availableH / targetH) * 1.02;
  const wrapperW = targetW * scale;
  const wrapperH = targetH * scale;

  return (
    <div 
      ref={containerRef}
      className="h-full border border-slate-200 bg-white rounded-xl overflow-hidden shadow-xs relative flex flex-col items-center justify-center p-0"
    >
      
      {/* Floating compilation indicator status overlay */}
      <div className="absolute top-3 right-3 z-10 flex gap-2 pointer-events-none select-none">
        {(compiling || loadingPdf) && (
          <span className="text-[9px] font-bold uppercase bg-white/95 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1.5 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0284c7]" /> Compiling
          </span>
        )}
        {pageCount > 1 && !compiling && (
          <span className="text-[9px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-250 px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3 text-amber-500" /> Overflows Page ({pageCount} pgs)
          </span>
        )}
      </div>

      {pdfError ? (
        <div className="w-full h-full flex flex-col p-4 bg-[#f8fafc] overflow-y-auto">
          <div className="flex items-center gap-2 text-red-500 font-semibold text-xs mb-3 select-none">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>LaTeX Compilation Failed</span>
          </div>
          <pre className="flex-1 overflow-auto bg-white p-4 text-left font-mono text-[10px] leading-relaxed text-red-600 rounded-lg border border-red-200 whitespace-pre-wrap select-text shadow-xs">
            {pdfError}
          </pre>
        </div>
      ) : pdfUrl && pdfDoc ? (
        <div className="w-full h-full overflow-y-auto flex items-start justify-center p-0">
          <div className="flex flex-col gap-0 items-center justify-start min-h-full">
            {Array.from({ length: pdfDoc.numPages }).map((_, idx) => (
              <PdfPageCanvas
                key={`${pdfUrl}-page-${idx + 1}`}
                pdf={pdfDoc}
                pageNum={idx + 1}
                width={wrapperW}
                height={wrapperH}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center bg-transparent select-none">
          <RefreshCw className="w-6 h-6 text-[#0284c7] animate-spin mb-2" />
          <p className="text-slate-500 text-[11px] font-semibold">Compiling LaTeX Engine...</p>
        </div>
      )}
    </div>
  );
};
export default PreviewPanel;
