import React, { useRef, useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { CompilingLoader } from './CompilingLoader';

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
  onLocateText?: (text: string) => void;
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
      className="shadow-sm border border-slate-300 bg-white rounded-xs select-none cursor-pointer"
    />
  );
};

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ 
  pdfUrl, 
  pdfError, 
  isDragging: _isDragging,
  compiling,
  pageCount,
  onLocateText
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 800 });
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const handleCanvasDoubleClick = async (e: React.MouseEvent<HTMLDivElement>, pageNum: number) => {
    if (!pdfDoc || !onLocateText) {
      console.warn("[Synctex] Double-click ignored: pdfDoc or onLocateText is falsy.", { hasDoc: !!pdfDoc, hasCallback: !!onLocateText });
      return;
    }

    // Extract event details synchronously before any asynchronous operations,
    // preventing React from recycling/nullifying event properties.
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.0 });

      // Get click coordinates relative to the container element
      const clickX = clientX - rect.left;
      const clickY = clientY - rect.top;

      // Calculate percentage coordinates
      const pctX = clickX / rect.width;
      const pctY = clickY / rect.height;

      // Translate coordinates to PDF space (Y starts from bottom in PDF)
      const pdfX = pctX * viewport.width;
      const pdfY = (1.0 - pctY) * viewport.height;

      console.log(`[Synctex] Click on Page ${pageNum}:`, {
        click: { x: clickX.toFixed(1), y: clickY.toFixed(1) },
        percent: { x: (pctX * 100).toFixed(1) + "%", y: (pctY * 100).toFixed(1) + "%" },
        pdfPoints: { x: pdfX.toFixed(1), y: pdfY.toFixed(1) },
        pageSize: { width: viewport.width, height: viewport.height }
      });

      // Extract text content
      const textContent = await page.getTextContent();
      let closestItem: any = null;
      let minDistance = Infinity;

      for (const item of textContent.items) {
        if (!item.str || item.str.trim() === '') continue;

        const itemX = item.transform[4];
        const itemY = item.transform[5];
        const itemWidth = item.width || 0;
        const itemHeight = item.height || Math.abs(item.transform[3]) || 10;

        // Bounding box check
        const isWithinX = pdfX >= itemX - 5 && pdfX <= itemX + itemWidth + 5;
        const isWithinY = pdfY >= itemY - 2 && pdfY <= itemY + itemHeight + 5;

        if (isWithinX && isWithinY) {
          closestItem = item;
          console.log(`[Synctex] Exact hit text item:`, { text: item.str, bounds: { x: itemX, y: itemY, w: itemWidth, h: itemHeight } });
          break;
        }

        // Distance check
        const dx = pdfX - (itemX + itemWidth / 2);
        const dy = pdfY - (itemY + itemHeight / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < minDistance) {
          minDistance = dist;
          closestItem = item;
        }
      }

      if (closestItem && closestItem.str.trim()) {
        const targetText = closestItem.str.trim();
        console.log(`[Synctex] Target text selected (minDist: ${minDistance.toFixed(1)}): "${targetText}"`);
        onLocateText(targetText);
      } else {
        console.warn("[Synctex] No text items found on page.");
      }
    } catch (err) {
      console.error('[Synctex] Error during double click text lookup:', err);
    }
  };

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
        {pageCount > 1 && !compiling && (
          <span className="text-[9px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-250 px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3 text-amber-500" /> Overflows Page ({pageCount} pgs)
          </span>
        )}
      </div>

      {/* Premium Full-Screen Loading Overlay */}
      {(compiling || loadingPdf) && <CompilingLoader />}

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
        <div className="w-full h-full overflow-hidden flex items-center justify-center p-0">
          <div className="flex flex-col gap-0 items-center justify-center">
            {Array.from({ length: pdfDoc.numPages }).map((_, idx) => (
              <div
                key={`${pdfUrl}-page-${idx + 1}`}
                onDoubleClick={(e) => handleCanvasDoubleClick(e, idx + 1)}
                className="relative cursor-pointer select-text border border-slate-200 bg-white rounded-sm shadow-xs mb-4"
              >
                <PdfPageCanvas
                  pdf={pdfDoc}
                  pageNum={idx + 1}
                  width={wrapperW}
                  height={wrapperH}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <CompilingLoader />
      )}
    </div>
  );
};
export default PreviewPanel;
