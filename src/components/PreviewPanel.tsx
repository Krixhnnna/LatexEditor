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
        <div className="h-full flex flex-col items-center justify-center p-4 text-center bg-zinc-950">
          <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
          <p className="text-red-700 font-semibold">{pdfError}</p>
        </div>
      ) : pdfUrl ? (
        <iframe
          src={`${pdfUrl}#view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
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
