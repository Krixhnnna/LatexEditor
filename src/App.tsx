import React, { useState, useEffect, useRef } from 'react';
import type { Resume } from './types';
import { Sidebar } from './components/Sidebar';
import { ResumeFormEditor } from './components/ResumeFormEditor';
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
  Undo2, Redo2, RefreshCw, Menu
} from 'lucide-react';

export const App: React.FC = () => {
  // --- Core State ---
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'form' | 'latex' | 'ats'>('form');
  const [jdText, setJdText] = useState<string>('');
  const [anonymizeMode, setAnonymizeMode] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  
  // --- Resizable Split Pane State ---
  const [leftWidth, setLeftWidth] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // --- Background PDF compile states ---
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pageCount, setPageCount] = useState<number>(1);
  const [compiling, setCompiling] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string>('');

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = (e.clientX / window.innerWidth) * 100;
      setLeftWidth(Math.max(30, Math.min(70, newWidth)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // --- History Stack State (Undo/Redo) ---
  const [history, setHistory] = useState<Resume[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isHistoryAction = useRef<boolean>(false);

  // Initialize DB
  useEffect(() => {
    const loadedResumes = loadResumes();
    const activeResumeId = getActiveResumeId();
    
    // Auto-generate LaTeX if empty on load
    const updated = loadedResumes.map(r => {
      if (!r.latexCode) {
        return { ...r, latexCode: generateLatex(r) };
      }
      return r;
    });

    setResumes(updated);
    setActiveId(activeResumeId);
    setJdText(loadJdText());

    // Initialize history
    setHistory([updated]);
    setHistoryIndex(0);
  }, []);

  const activeResume = resumes.find(r => r.id === activeId) || resumes[0];

  const anonymizeResumeData = (res: Resume): Resume => {
    return {
      ...res,
      personalDetails: {
        name: 'ANONYMOUS CANDIDATE',
        email: 'candidate@anonymized.org',
        phone: '+1 (XXX) XXX-XXXX',
        linkedin: 'linkedin.com/in/anonymized',
        github: 'github.com/anonymized',
        website: 'portfolio.anonymized.dev',
        location: 'Remote / United States',
      },
      summary: res.summary.replace(new RegExp(res.personalDetails.name, 'gi'), 'Candidate'),
    };
  };

  // Compile PDF on change
  useEffect(() => {
    if (!activeResume) return;
    let active = true;
    const compile = async () => {
      setCompiling(true);
      setPdfError('');
      try {
        const resumeToCompile = anonymizeMode ? anonymizeResumeData(activeResume) : activeResume;
        const result = await generatePdf(resumeToCompile);
        
        if (!active) return;
        
        const blob = new Blob([result.pdfBytes as BlobPart], { type: 'application/pdf' });
        
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        
        setPdfUrl(URL.createObjectURL(blob));
        setPageCount(result.pageCount);
      } catch (err) {
        console.error('PDF Compilation Error:', err);
        setPdfError('Failed to compile PDF. Check your LaTeX diagnostics.');
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
  }, [activeResume, anonymizeMode]);

  // Sync to local storage and update history when resumes list changes
  const updateResumesState = (newResumes: Resume[], shouldRecordHistory = true) => {
    setResumes(newResumes);
    saveResumes(newResumes);

    if (shouldRecordHistory && !isHistoryAction.current) {
      const nextHistory = history.slice(0, historyIndex + 1);
      nextHistory.push(newResumes);
      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
    }
    isHistoryAction.current = false;
  };

  // --- Undo / Redo Handlers ---
  const handleUndo = () => {
    if (historyIndex > 0) {
      isHistoryAction.current = true;
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setResumes(history[prevIndex]);
      saveResumes(history[prevIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isHistoryAction.current = true;
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setResumes(history[nextIndex]);
      saveResumes(history[nextIndex]);
    }
  };

  // Keyboard shortcut listeners (Ctrl/Cmd + Z, Ctrl/Cmd + Shift + Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  // --- Resume CRUD Handlers ---
  const handleSelectResume = (id: string) => {
    setActiveId(id);
    setActiveResumeId(id);
  };

  const handleCreateResume = (name: string) => {
    const newResume: Resume = {
      id: `resume-${Date.now()}`,
      name,
      templateId: 'classic-latex',
      personalDetails: {
        name: '',
        email: '',
        phone: '',
        linkedin: '',
        github: '',
        website: '',
        location: '',
      },
      summary: '',
      experience: [],
      education: [],
      projects: [],
      skills: [],
      certifications: [],
      customSections: [],
      typography: DEFAULT_TYPOGRAPHY,
      latexCode: '',
      activeTab: 'form',
      lastSaved: Date.now()
    };
    newResume.latexCode = generateLatex(newResume);

    const updated = [...resumes, newResume];
    updateResumesState(updated);
    setActiveId(newResume.id);
    setActiveResumeId(newResume.id);
  };

  const handleDuplicateResume = (id: string) => {
    const source = resumes.find(r => r.id === id);
    if (!source) return;

    const copy: Resume = {
      ...JSON.parse(JSON.stringify(source)),
      id: `resume-${Date.now()}`,
      name: `${source.name} (Copy)`,
      lastSaved: Date.now()
    };

    const updated = [...resumes, copy];
    updateResumesState(updated);
    setActiveId(copy.id);
    setActiveResumeId(copy.id);
  };

  const handleDeleteResume = (id: string) => {
    if (resumes.length <= 1) return;
    const remaining = resumes.filter(r => r.id !== id);
    updateResumesState(remaining);
    
    // Switch to first remaining
    setActiveId(remaining[0].id);
    setActiveResumeId(remaining[0].id);
  };

  // --- Editor Pane Update Listener ---
  const handleResumeChange = (updatedResume: Resume) => {
    // Regenerate LaTeX code automatically if the user is editing the Form
    const updated = {
      ...updatedResume,
      latexCode: generateLatex(updatedResume),
      lastSaved: Date.now()
    };

    const nextResumes = resumes.map(r => r.id === updatedResume.id ? updated : r);
    updateResumesState(nextResumes);
  };

  const handleLatexCodeChange = (updatedCode: string) => {
    // Parse the new LaTeX code back into structured JSON to update the form editor fields in real-time.
    const parsed = parseLatexToResume(updatedCode, activeResume);
    const updated = {
      ...parsed,
      latexCode: updatedCode,
      lastSaved: Date.now()
    };

    const nextResumes = resumes.map(r => r.id === activeResume.id ? updated : r);
    // Don't clutter history stack with every single key stroke, but persist
    updateResumesState(nextResumes, false);
  };

  const handleJdTextChange = (text: string) => {
    setJdText(text);
    saveJdText(text);
  };

  // --- Export download triggers ---
  const handleDownloadPdf = async () => {
    if (!activeResume) return;
    try {
      const resumeToCompile = anonymizeMode ? {
        ...activeResume,
        personalDetails: {
          name: 'ANONYMOUS CANDIDATE',
          email: 'candidate@anonymized.org',
          phone: '+1 (XXX) XXX-XXXX',
          linkedin: 'linkedin.com/in/anonymized',
          github: 'github.com/anonymized',
          website: 'portfolio.anonymized.dev',
          location: 'Remote / United States',
        },
        summary: activeResume.summary.replace(new RegExp(activeResume.personalDetails.name, 'gi'), 'Candidate')
      } : activeResume;

      const result = await generatePdf(resumeToCompile);
      const blob = new Blob([result.pdfBytes as BlobPart], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const safeName = activeResume.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `${safeName}_resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export PDF file:', err);
    }
  };

  const handleDownloadTex = () => {
    if (!activeResume) return;
    const blob = new Blob([activeResume.latexCode], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const safeName = activeResume.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${safeName}_resume.tex`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyPlainText = () => {
    if (!activeResume) return;
    const plain = stripLatexToPlainText(activeResume.latexCode);
    navigator.clipboard.writeText(plain);
  };

  // Backup configuration states
  const handleImportJson = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].personalDetails) {
        updateResumesState(parsed);
        setActiveId(parsed[0].id);
        setActiveResumeId(parsed[0].id);
        alert('Resumes imported successfully!');
      } else {
        alert('Invalid backup structure.');
      }
    } catch (err) {
      alert('Failed to parse backup JSON.');
    }
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(resumes, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `texcraft_resumes_backup.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (resumes.length === 0 || !activeId) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0e1117]">
        <RefreshCw className="w-6 h-6 text-slate-600 animate-spin" />
        <p className="text-slate-550 text-xs font-semibold mt-4">Setting up local workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0e1117] text-slate-100">
      
      {/* Sidebar navigation overlay */}
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
                  onClick={() => setActiveTab('form')}
                  className={`pb-1 text-[10px] font-bold uppercase tracking-wider transition-colors duration-150 cursor-pointer border-b-2 ${
                    activeTab === 'form' 
                      ? 'border-[#38bdf8] text-slate-100' 
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Details Form
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
              {activeTab === 'form' && (
                <ResumeFormEditor 
                  resume={activeResume} 
                  onChange={handleResumeChange} 
                />
              )}
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
