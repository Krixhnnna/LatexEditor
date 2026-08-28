import React, { useState, useEffect, useRef } from 'react';
import type { Resume } from './types';
import { Sidebar } from './components/Sidebar';
import { LatexCodeEditor } from './components/LatexCodeEditor';
import { AtsPanel } from './components/AtsPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { 
  loadResumes, saveResumes, getActiveResumeId, setActiveResumeId, 
  loadJdText, saveJdText, DEFAULT_TYPOGRAPHY 
} from './utils/db';
import { generateLatex } from './utils/latexTemplates';
import { stripLatexToPlainText, parseLatexToResume } from './utils/latexParser';
import { generatePdf } from './utils/pdfGenerator';
import { 
  Undo2, Redo2, Menu
} from 'lucide-react';

export const App: React.FC = () => {
  // --- Core State ---
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'latex' | 'ats'>('latex');
  const [jdText, setJdText] = useState<string>('');
  const [anonymizeMode, setAnonymizeMode] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  
  // --- Resizable Split Pane State ---
  const [leftWidth, setLeftWidth] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // --- History (Undo/Redo) State ---
  const [history, setHistory] = useState<Resume[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isUndoRedoAction = useRef<boolean>(false);

  // --- PDF preview URL, status and error logs ---
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfError, setPdfError] = useState<string>('');
  const [compiling, setCompiling] = useState<boolean>(false);
  const [pageCount, setPageCount] = useState<number>(1);

  // --- 1. Load Initial State from Local Database on mount ---
  useEffect(() => {
    const loadedResumes = loadResumes();
    const active = getActiveResumeId();
    const savedJd = loadJdText();
    
    // Fallback in case active ID doesn't exist
    const finalActive = loadedResumes.find(r => r.id === active) 
      ? active 
      : (loadedResumes[0]?.id || '');

    // Initialize state
    setResumes(loadedResumes);
    setActiveId(finalActive);
    setJdText(savedJd);

    // Initialize history stack
    setHistory([loadedResumes]);
    setHistoryIndex(0);
  }, []);

  const activeResume = resumes.find(r => r.id === activeId) || resumes[0];

  // --- 2. Populate LaTeX code if empty (on load or template change) ---
  useEffect(() => {
    if (!activeResume || activeResume.latexCode) return;
    
    const nextCode = generateLatex(activeResume);
    const updated = { ...activeResume, latexCode: nextCode };
    const nextResumes = resumes.map(r => r.id === activeResume.id ? updated : r);
    updateResumesState(nextResumes, false);
  }, [activeResume, resumes]);

  // --- 3. Compile LaTeX to PDF on change (Debounced) ---
  useEffect(() => {
    if (!activeResume || !activeResume.latexCode) return;
    let active = true;

    const compile = async () => {
      setCompiling(true);
      setPdfError('');
      try {
        const result = await generatePdf(activeResume.latexCode);
        
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
  }, [activeResume?.latexCode]);

  // --- 4. Database Persistence Helper ---
  const updateResumesState = (nextResumes: Resume[], shouldRecordHistory = true) => {
    setResumes(nextResumes);
    saveResumes(nextResumes);

    if (shouldRecordHistory && !isUndoRedoAction.current) {
      const nextHistory = history.slice(0, historyIndex + 1);
      setHistory([...nextHistory, nextResumes]);
      setHistoryIndex(nextHistory.length);
    }
    isUndoRedoAction.current = false;
  };

  // --- 5. Undo & Redo logic ---
  const handleUndo = () => {
    if (historyIndex <= 0) return;
    isUndoRedoAction.current = true;
    const nextIdx = historyIndex - 1;
    setHistoryIndex(nextIdx);
    setResumes(history[nextIdx]);
    saveResumes(history[nextIdx]);
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    isUndoRedoAction.current = true;
    const nextIdx = historyIndex + 1;
    setHistoryIndex(nextIdx);
    setResumes(history[nextIdx]);
    saveResumes(history[nextIdx]);
  };

  // Listen for keyboard undo/redo shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      
      if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  // --- 6. Resume Version Management CRUD Handlers ---
  const handleSelectResume = (id: string) => {
    setActiveId(id);
    setActiveResumeId(id);
    setSidebarOpen(false);
  };

  const handleCreateResume = () => {
    const newId = `resume-${Date.now()}`;
    const newResume: Resume = {
      id: newId,
      name: `Untitled Resume (${resumes.length + 1})`,
      templateId: 'classic-latex',
      personalDetails: { name: '', email: '', phone: '', linkedin: '', github: '', website: '', location: '' },
      summary: '',
      experience: [],
      education: [],
      projects: [],
      skills: [],
      certifications: [],
      customSections: [],
      typography: DEFAULT_TYPOGRAPHY,
      latexCode: '',
      activeTab: 'latex',
      lastSaved: Date.now(),
    };

    const nextResumes = [...resumes, newResume];
    updateResumesState(nextResumes);
    handleSelectResume(newId);
  };

  const handleDuplicateResume = (id: string) => {
    const original = resumes.find(r => r.id === id);
    if (!original) return;

    const dupId = `resume-dup-${Date.now()}`;
    const duplicate: Resume = {
      ...JSON.parse(JSON.stringify(original)),
      id: dupId,
      name: `${original.name} (Copy)`,
      lastSaved: Date.now(),
    };

    const nextResumes = [...resumes, duplicate];
    updateResumesState(nextResumes);
    handleSelectResume(dupId);
  };

  const handleDeleteResume = (id: string) => {
    if (resumes.length <= 1) {
      alert("You must keep at least one resume version in your editor workspace!");
      return;
    }
    if (!confirm("Are you sure you want to delete this resume version? This action cannot be undone.")) return;

    const nextResumes = resumes.filter(r => r.id !== id);
    updateResumesState(nextResumes);

    if (activeId === id) {
      const fallback = nextResumes[0].id;
      handleSelectResume(fallback);
    }
  };

  // --- 7. Sidebar Download / Export Actions ---
  const handleDownloadPdf = async () => {
    if (!activeResume) return;
    try {
      const result = await generatePdf(activeResume.latexCode);
      const blob = new Blob([result.pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeResume.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to generate PDF. Make sure your LaTeX code compiles without syntax errors.");
    }
  };

  const handleDownloadTex = () => {
    if (!activeResume) return;
    const blob = new Blob([activeResume.latexCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeResume.name.replace(/\s+/g, '_')}.tex`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyPlainText = () => {
    if (!activeResume) return;
    const plainText = stripLatexToPlainText(activeResume.latexCode);
    navigator.clipboard.writeText(plainText)
      .then(() => alert("Plain text copy successful!"))
      .catch(() => alert("Failed to copy plain text to clipboard."));
  };

  const handleExportJson = () => {
    if (!activeResume) return;
    const jsonStr = JSON.stringify(activeResume, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeResume.name.replace(/\s+/g, '_')}_backup.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.id || !parsed.name || typeof parsed.latexCode !== 'string') {
        throw new Error("Invalid TeXCraft JSON backup structure.");
      }
      
      // Assign a new unique ID to avoid overwrites
      const imported: Resume = {
        ...parsed,
        id: `resume-imported-${Date.now()}`,
        name: `${parsed.name} (Imported)`,
        lastSaved: Date.now()
      };

      const nextResumes = [...resumes, imported];
      updateResumesState(nextResumes);
      handleSelectResume(imported.id);
      alert("JSON Backup import successful!");
    } catch (err) {
      alert("Failed to parse JSON backup. Make sure the file was exported from TeXCraft.");
    }
  };

  // --- 8. Code & Local Field Updates Synchronization ---
  const handleLatexCodeChange = (updatedCode: string) => {
    let updated = {
      ...activeResume,
      latexCode: updatedCode,
      lastSaved: Date.now()
    };

    try {
      if (updatedCode.trim()) {
        const parsed = parseLatexToResume(updatedCode, activeResume);
        updated = {
          ...updated,
          ...parsed,
          latexCode: updatedCode
        };
      }
    } catch (err) {
      console.warn("Failed to reverse-parse LaTeX back to details form fields (gracefully ignored):", err);
    }

    const nextResumes = resumes.map(r => r.id === activeResume.id ? updated : r);
    updateResumesState(nextResumes, false);
  };

  const handleResumeChange = (updatedResume: Resume) => {
    const nextResumes = resumes.map(r => r.id === updatedResume.id ? updatedResume : r);
    updateResumesState(nextResumes);
  };

  const handleJdTextChange = (text: string) => {
    setJdText(text);
    saveJdText(text);
  };

  // --- 9. Resizable Split Pane Mouse Resizers ---
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

  if (!activeResume) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0e1117] text-slate-300 font-semibold">
        Loading TeXCraft workspace...
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#0e1117] text-slate-100 overflow-hidden relative">
      
      {/* Sidebar Overlay Drawer */}
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        resumes={resumes}
        activeId={activeId}
        onSelectResume={handleSelectResume}
        onCreateResume={handleCreateResume}
        onDuplicateResume={handleDuplicateResume}
        onDeleteResume={handleDeleteResume}
        onDownloadPdf={handleDownloadPdf}
        onDownloadTex={handleDownloadTex}
        onCopyPlainText={handleCopyPlainText}
        onImportJson={handleImportJson}
        onExportJson={handleExportJson}
        anonymizeMode={anonymizeMode}
        onToggleAnonymize={() => setAnonymizeMode(!anonymizeMode)}
      />

      {/* Main Workspace Dashboard */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Dashboard Split Panes Editor vs Preview */}
        <div 
          className={`flex-1 flex flex-col lg:flex-row p-3 gap-0 overflow-hidden ${isDragging ? 'select-none' : ''}`}
          style={{ 
            '--left-width': `${leftWidth}%`, 
            '--right-width': `${100 - leftWidth}%` 
          } as React.CSSProperties}
        >
          
          {/* Left Edit Pane */}
          <div className="w-full lg:w-[var(--left-width)] flex flex-col overflow-hidden h-full pr-0 lg:pr-3 shrink-0">
            {/* Left Edit Pane Header Tabs & Controls */}
            <div className="flex border-b border-[#212836] pb-2 mb-3.5 items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {/* Menu hamburger trigger */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-1 hover:bg-[#1f2635] rounded text-slate-400 hover:text-slate-200 transition-colors duration-150 cursor-pointer border border-[#212836] mr-1"
                  title="Open resumes and settings"
                >
                  <Menu className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setActiveTab('latex')}
                  className={`pb-1 text-[10px] font-bold uppercase tracking-wider transition-colors duration-150 cursor-pointer border-b-2 ${
                    activeTab === 'latex' 
                      ? 'border-[#38bdf8] text-slate-100' 
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Raw LaTeX
                </button>
                <button
                  onClick={() => setActiveTab('ats')}
                  className={`pb-1 text-[10px] font-bold uppercase tracking-wider transition-colors duration-150 cursor-pointer border-b-2 ${
                    activeTab === 'ats' 
                      ? 'border-[#38bdf8] text-slate-100' 
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  ATS Score
                </button>
              </div>

              {/* Undo / Redo controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="p-1 bg-[#161b24] border border-[#212836] hover:bg-[#1f2635] text-slate-400 hover:text-slate-100 rounded disabled:opacity-30 transition-colors duration-150 cursor-pointer"
                  title="Undo edit (Cmd+Z)"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="p-1 bg-[#161b24] border border-[#212836] hover:bg-[#1f2635] text-slate-400 hover:text-slate-100 rounded disabled:opacity-30 transition-colors duration-150 cursor-pointer"
                  title="Redo edit (Cmd+Shift+Z)"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Pane Content */}
            <div className="flex-1 overflow-hidden h-full">
              {activeTab === 'latex' && (
                <LatexCodeEditor 
                  code={activeResume.latexCode} 
                  onChange={handleLatexCodeChange} 
                />
              )}
              {activeTab === 'ats' && (
                <AtsPanel 
                  resume={activeResume} 
                  onChange={handleResumeChange}
                  jdText={jdText}
                  onChangeJdText={handleJdTextChange}
                />
              )}
            </div>
          </div>

          {/* Resizable Divider line */}
          <div 
            onMouseDown={startResizing}
            className={`hidden lg:flex w-2.5 hover:bg-[#212836] active:bg-[#2a3345] cursor-col-resize shrink-0 transition-colors duration-150 select-none h-full items-center justify-center relative group ${
              isDragging ? 'bg-[#212836]' : 'bg-transparent'
            }`}
            title="Drag to resize panes"
            style={{ margin: '0 -4px' }}
          >
            <div className="w-0.5 h-8 bg-[#2a3345] group-hover:bg-slate-500 rounded"></div>
          </div>

          {/* Right Live Preview Pane */}
          <div className="w-full lg:w-[var(--right-width)] flex flex-col overflow-hidden h-full pl-0 lg:pl-3 shrink-0">
            <PreviewPanel 
              pdfUrl={pdfUrl}
              pdfError={pdfError}
              isDragging={isDragging} 
              compiling={compiling}
              pageCount={pageCount}
            />
          </div>
        </div>

      </main>

    </div>
  );
};
export default App;
