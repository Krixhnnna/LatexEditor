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
import { WorkspaceLoader } from './components/WorkspaceLoader';

// Helper function to find the best matching line in LaTeX code for a clicked text snippet
const findBestLineInLatex = (latex: string, targetText: string): number => {
  const cleanTarget = targetText.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleanTarget) return -1;
  
  const lines = latex.split('\n');
  let bestLineIdx = -1;
  let maxScore = 0;

  // Split into words, filtering out only single characters (keep words of length >= 2)
  const targetWords = cleanTarget.split(' ').filter(w => w.length >= 2);

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    
    // Skip comment lines in LaTeX
    if (rawLine.trim().startsWith('%')) continue;
    
    // Clean up LaTeX line: strip backslashes, common formatting commands, braces
    const cleanLine = rawLine
      .toLowerCase()
      .replace(/\\(section|subsection|textbf|textit|role|item|skills|education|experience|project|heading)/g, ' ')
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ');

    // 1. Direct match check
    if (cleanLine.includes(cleanTarget)) {
      console.log(`[Synctex App] Exact match found on line ${i + 1}: "${rawLine.trim()}"`);
      return i;
    }

    // 2. Overlapping words check
    let score = 0;
    if (targetWords.length > 0) {
      for (const word of targetWords) {
        if (cleanLine.includes(word)) {
          score += word.length;
        }
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestLineIdx = i;
    }
  }

  if (maxScore > 0 && bestLineIdx !== -1) {
    console.log(`[Synctex App] Best word-overlap match found on line ${bestLineIdx + 1} (score: ${maxScore}): "${lines[bestLineIdx].trim()}"`);
    return bestLineIdx;
  }

  console.log(`[Synctex App] No match found in LaTeX for text: "${targetText}"`);
  return -1;
};

export const App: React.FC = () => {
  // --- Workspace Loader State ---
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [showLoader, setShowLoader] = useState<boolean>(true);
  
  // --- Synctex Scroll Highlight state ---
  const [targetScrollLine, setTargetScrollLine] = useState<{ line: number; timestamp: number } | null>(null);

  // Minimum load duration for workspace entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // --- Core State ---
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'latex' | 'ats'>('latex');
  const [jdText, setJdText] = useState<string>('');
  const [anonymizeMode, setAnonymizeMode] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  
  // --- Resizable Split Pane State ---
  const [leftWidth, setLeftWidth] = useState<number>(58);
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

  useEffect(() => {
    if (!initialLoading && activeResume) {
      const fadeTimer = setTimeout(() => {
        setShowLoader(false);
      }, 300); // match WorkspaceLoader transition duration
      return () => clearTimeout(fadeTimer);
    }
  }, [initialLoading, activeResume]);

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

  const handleLocateText = (targetText: string) => {
    if (!activeResume || !activeResume.latexCode) {
      console.warn("[Synctex App] handleLocateText ignored: activeResume or latexCode is falsy.");
      return;
    }
    console.log(`[Synctex App] Attempting to locate text: "${targetText}"`);
    const lineIndex = findBestLineInLatex(activeResume.latexCode, targetText);
    if (lineIndex !== -1) {
      console.log(`[Synctex App] Propagating targetScrollLine line index ${lineIndex} to Editor.`);
      setTargetScrollLine({ line: lineIndex, timestamp: Date.now() });
    } else {
      console.warn(`[Synctex App] Could not find matching line for "${targetText}".`);
    }
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

  if (showLoader || !activeResume) {
    return <WorkspaceLoader isFading={!initialLoading && !!activeResume} />;
  }

  return (
    <div className="flex h-screen w-screen bg-[#f8fafc] text-slate-800 overflow-hidden relative">
      
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
            <div className="flex border-b border-slate-200 pb-2 mb-3.5 items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {/* Menu hamburger trigger */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-1 bg-white border-2 border-black hover:bg-slate-50 text-slate-700 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer mr-1.5"
                  title="Open resumes and settings"
                >
                  <Menu className="w-3.5 h-3.5 text-slate-700" />
                </button>

                <button
                  onClick={() => setActiveTab('latex')}
                  className={`pb-1 text-[10px] font-bold uppercase tracking-wider transition-colors duration-150 cursor-pointer border-b-2 ${
                    activeTab === 'latex' 
                      ? 'border-[#0284c7] text-slate-900 font-bold' 
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Raw LaTeX
                </button>
                <button
                  onClick={() => setActiveTab('ats')}
                  className={`pb-1 text-[10px] font-bold uppercase tracking-wider transition-colors duration-150 cursor-pointer border-b-2 ${
                    activeTab === 'ats' 
                      ? 'border-[#0284c7] text-slate-900 font-bold' 
                      : 'border-transparent text-slate-400 hover:text-slate-600'
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
                  className="p-1 bg-white border-2 border-black hover:bg-slate-50 text-slate-700 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer disabled:opacity-30"
                  title="Undo edit (Cmd+Z)"
                >
                  <Undo2 className="w-3.5 h-3.5 text-slate-700" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="p-1 bg-white border-2 border-black hover:bg-slate-50 text-slate-700 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer disabled:opacity-30"
                  title="Redo edit (Cmd+Shift+Z)"
                >
                  <Redo2 className="w-3.5 h-3.5 text-slate-700" />
                </button>
              </div>
            </div>

            {/* Pane Content */}
            <div className="flex-1 overflow-hidden h-full">
              {activeTab === 'latex' && (
                <LatexCodeEditor 
                  code={activeResume.latexCode} 
                  onChange={handleLatexCodeChange}
                  targetScrollLine={targetScrollLine}
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
            className={`hidden lg:flex w-2.5 hover:bg-slate-200 active:bg-slate-300 cursor-col-resize shrink-0 transition-colors duration-150 select-none h-full items-center justify-center relative group ${
              isDragging ? 'bg-slate-200' : 'bg-transparent'
            }`}
            title="Drag to resize panes"
            style={{ margin: '0 -4px' }}
          >
            <div className="w-0.5 h-8 bg-slate-300 group-hover:bg-slate-500 rounded"></div>
          </div>

          {/* Right Live Preview Pane */}
          <div className="w-full lg:w-[var(--right-width)] flex flex-col overflow-hidden h-full pl-0 lg:pl-3 shrink-0">
            <PreviewPanel 
              pdfUrl={pdfUrl}
              pdfError={pdfError}
              isDragging={isDragging} 
              compiling={compiling}
              pageCount={pageCount}
              onLocateText={handleLocateText}
            />
          </div>
        </div>

      </main>

      {/* Real-time dragging percentage overlay for debugging */}
      {isDragging && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="bg-slate-900 text-white font-mono text-xs px-4 py-2 rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] select-none">
            {Math.round(leftWidth)}% / {Math.round(100 - leftWidth)}%
          </div>
        </div>
      )}

    </div>
  );
};
export default App;
