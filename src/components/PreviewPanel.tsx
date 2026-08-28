import React from 'react';
import { AlertCircle, RefreshCw, Check } from 'lucide-react';

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
  return (
    <div className="h-full border border-zinc-800 bg-zinc-900 rounded-xl overflow-hidden shadow-sm relative">
      
      {/* Floating compilation indicator status overlay */}
      <div className="absolute top-3 right-3 z-10 flex gap-2 pointer-events-none">
        {compiling && (
          <span className="text-[9px] font-bold uppercase bg-zinc-950/90 text-zinc-400 border border-zinc-800 px-2.5 py-1 rounded shadow-md backdrop-blur-xs flex items-center gap-1.5 animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin text-zinc-500" /> Compiling
          </span>
        )}
        {pageCount > 1 && !compiling && (
          <span className="text-[9px] font-bold uppercase bg-yellow-950/95 text-yellow-450 border border-yellow-900/30 px-2.5 py-1 rounded shadow-md backdrop-blur-xs flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3 text-yellow-500" /> Overflows Page ({pageCount} pgs)
          </span>
        )}
        {pageCount === 1 && !compiling && (
          <span className="text-[9px] font-bold uppercase bg-green-950/95 text-green-400 border border-green-900/30 px-2.5 py-1 rounded shadow-md backdrop-blur-xs flex items-center gap-1.5">
            <Check className="w-3 h-3 text-green-500" /> Fits 1 Page
          </span>
        )}
      </div>

      {pdfError ? (
        <div className="h-full flex flex-col p-4 bg-[#0e1117] overflow-y-auto">
          <div className="flex items-center gap-2 text-red-400 font-semibold text-xs mb-3 select-none">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>LaTeX Compilation Failed</span>
          </div>
          <pre className="flex-1 overflow-auto bg-black/45 p-4 text-left font-mono text-[10px] leading-relaxed text-red-400 rounded-lg border border-red-950/20 whitespace-pre-wrap select-text">
            {pdfError}
          </pre>
        </div>
      ) : pdfUrl ? (
        <iframe
          src={`${pdfUrl}#view=Fit&toolbar=0&navpanes=0&scrollbar=0`}
          className={`w-full h-full border-none bg-white ${isDragging ? 'pointer-events-none' : ''}`}
          title="LaTeX PDF Preview"
        />
      ) : (
        <div className="h-full flex flex-col items-center justify-center bg-zinc-950">
          <RefreshCw className="w-6 h-6 text-zinc-550 animate-spin mb-2" />
          <p className="text-zinc-500 text-[11px] font-semibold">Compiling LaTeX Engine...</p>
        </div>
      )}
    </div>
  );
};
export default PreviewPanel;
