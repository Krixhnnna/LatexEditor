import React, { useState, useEffect } from 'react';
import { LatexCodeEditor } from './components/LatexCodeEditor';
import { PreviewPanel } from './components/PreviewPanel';
import { createSampleResume } from './utils/db';
import { generateLatex } from './utils/latexTemplates';
import { generatePdf } from './utils/pdfGenerator';

export const App: React.FC = () => {
  // --- Core State ---
  const [latexCode, setLatexCode] = useState<string>(() => {
    return localStorage.getItem('latex_editor_code') || generateLatex(createSampleResume());
  });
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfError, setPdfError] = useState<string>('');
  const [compiling, setCompiling] = useState<boolean>(false);
  const [pageCount, setPageCount] = useState<number>(1);
  const [leftWidth, setLeftWidth] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // --- Drag-to-Resize Pane Hook Handlers ---
  const startResizing = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const containerWidth = window.innerWidth;
      const newWidthPercent = Math.max(30, Math.min(70, (e.clientX / containerWidth) * 100));
      setLeftWidth(newWidthPercent);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // --- LaTeX Code Change Listener ---
  const handleLatexCodeChange = (updatedCode: string) => {
    setLatexCode(updatedCode);
    localStorage.setItem('latex_editor_code', updatedCode);
  };

  // --- Compile LaTeX to PDF on change ---
  useEffect(() => {
    if (!latexCode.trim()) return;
    let active = true;

    const compile = async () => {
      setCompiling(true);
      setPdfError('');
      try {
        const result = await generatePdf(latexCode);
        if (!active) return;

        const blob = new Blob([result.pdfBytes as BlobPart], { type: 'application/pdf' });
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);

        setPdfUrl(URL.createObjectURL(blob));
        setPageCount(result.pageCount);
      } catch (err: any) {
        console.error('PDF Compilation Error:', err);
        setPdfError(err.message || 'LaTeX compilation failed. Check compiler diagnostics.');
      } finally {
        setCompiling(false);
      }
    };

    const timer = setTimeout(() => {
      compile();
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [latexCode]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0e1117] text-slate-100 p-3 select-none">
      
      {/* Main Workspace Dashboard */}
      <main className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
        
        {/* Left Edit Pane (LaTeX Code Editor) */}
        <div 
          className="flex flex-col overflow-hidden h-full pr-1.5 shrink-0"
          style={{ width: `${leftWidth}%` }}
        >
          <LatexCodeEditor 
            code={latexCode} 
            onChange={handleLatexCodeChange} 
          />
        </div>

        {/* Resizable Divider line */}
        <div 
          onMouseDown={startResizing}
          className={`hidden lg:flex w-2 hover:bg-[#212836] active:bg-[#2a3345] cursor-col-resize shrink-0 transition-colors duration-150 select-none h-full items-center justify-center relative group ${
            isDragging ? 'bg-[#212836]' : 'bg-transparent'
          }`}
          title="Drag to resize panes"
          style={{ margin: '0 -4px' }}
        >
          <div className="w-0.5 h-8 bg-[#2a3345] group-hover:bg-slate-500 rounded"></div>
        </div>

        {/* Right Live Preview Pane (PDF viewer) */}
        <div 
          className="flex flex-col overflow-hidden h-full pl-1.5 shrink-0"
          style={{ width: `${100 - leftWidth}%` }}
        >
          <PreviewPanel 
            pdfUrl={pdfUrl}
            pdfError={pdfError}
            isDragging={isDragging} 
            compiling={compiling}
            pageCount={pageCount}
          />
        </div>

      </main>

    </div>
  );
};
export default App;
