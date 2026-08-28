import React, { useRef, useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface PreviewPanelProps {
  pdfUrl: string;
  pdfError: string;
  isDragging: boolean;
  compiling: boolean;
  pageCount: number;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ 
  pdfUrl, 
  pdfError, 
  isDragging,
  compiling,
  pageCount
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 800 });

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

  // Standard Letter page dimensions (width: 612px, height: 792px)
  // Calculate optimal scale factor to fit the full page in the container
  const padding = 16;
  const targetW = 612;
  const targetH = 792;
  const availableW = Math.max(100, dimensions.width - padding * 2);
  const availableH = Math.max(100, dimensions.height - padding * 2);

  const scale = Math.min(1, availableW / targetW, availableH / targetH);

  const iframeStyle: React.CSSProperties = {
    width: `${targetW}px`,
    height: `${availableH / scale}px`,
    transform: `scale(${scale})`,
    transformOrigin: 'top center',
    border: 'none',
    backgroundColor: '#ffffff',
    transition: isDragging ? 'none' : 'transform 0.15s ease-out',
  };

  return (
    <div 
      ref={containerRef}
      className="h-full border border-slate-200 bg-slate-50 rounded-xl overflow-hidden shadow-xs relative flex flex-col items-center justify-center p-4"
    >
      
      {/* Floating compilation indicator status overlay */}
      <div className="absolute top-3 right-3 z-10 flex gap-2 pointer-events-none select-none">
        {compiling && (
          <span className="text-[9px] font-bold uppercase bg-white/95 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1.5 animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin text-[#0284c7]" /> Compiling
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
      ) : pdfUrl ? (
        <div 
          className="w-full h-full overflow-hidden flex items-start justify-center"
          style={{ height: `${availableH}px`, width: `${availableW}px` }}
        >
          <iframe
            src={`${pdfUrl}#view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
            style={iframeStyle}
            className={isDragging ? 'pointer-events-none' : ''}
            title="LaTeX PDF Preview"
          />
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
