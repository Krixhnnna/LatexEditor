import React, { useState } from 'react';
import type { Resume } from '../types';
import { 
  FileText, Plus, Copy, Trash2, Download, Clipboard, EyeOff, Eye, Upload, Check, RefreshCw, X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  resumes: Resume[];
  activeId: string;
  onSelectResume: (id: string) => void;
  onCreateResume: (name: string) => void;
  onDuplicateResume: (id: string) => void;
  onDeleteResume: (id: string) => void;
  onDownloadPdf: () => void;
  onDownloadTex: () => void;
  onCopyPlainText: () => void;
  onImportJson: (jsonStr: string) => void;
  onExportJson: () => void;
  anonymizeMode: boolean;
  onToggleAnonymize: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  resumes,
  activeId,
  onSelectResume,
  onCreateResume,
  onDuplicateResume,
  onDeleteResume,
  onDownloadPdf,
  onDownloadTex,
  onCopyPlainText,
  onImportJson,
  onExportJson,
  anonymizeMode,
  onToggleAnonymize,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newResumeName, setNewResumeName] = useState('');
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResumeName.trim()) return;
    onCreateResume(newResumeName.trim());
    setNewResumeName('');
    setShowAddForm(false);
  };

  const triggerDownloadPdf = async () => {
    setPdfGenerating(true);
    try {
      await onDownloadPdf();
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleCopyText = () => {
    onCopyPlainText();
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        onImportJson(result);
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      {/* Drawer backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-64 border-r border-zinc-800 bg-zinc-900 flex flex-col h-screen overflow-hidden transition-transform duration-300 ease-in-out shadow-2xl text-zinc-100 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* App Header branding */}
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold flex items-center gap-2 text-zinc-100">
              <FileText className="text-zinc-400 w-5 h-5" />
              <span className="font-display tracking-tight text-zinc-50">TeXCraft</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">v1.0</span>
            </h1>
            <p className="text-xs text-zinc-500">Private Browser LaTeX Editor</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer self-start border border-zinc-800"
            title="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Resumes List section */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div className="flex justify-between items-center px-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">My Resumes</span>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="p-1 hover:bg-zinc-850 rounded text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer border border-zinc-850"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleCreate} className="px-2 space-y-2">
              <input
                type="text"
                placeholder="Resume name (e.g. Front-End Dev)"
                value={newResumeName}
                onChange={(e) => setNewResumeName(e.target.value)}
                className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded p-2 focus:outline-none focus:border-zinc-550 text-zinc-100 placeholder-zinc-500 shadow-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <button 
                  type="submit" 
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-bold py-1.5 px-3 rounded transition-all cursor-pointer shadow-sm"
                >
                  Create
                </button>
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold py-1.5 px-3 rounded transition-all cursor-pointer border border-zinc-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-1">
            {resumes.map((resume) => {
              const isActive = resume.id === activeId;
              return (
                <div 
                  key={resume.id}
                  className={`group flex items-center justify-between p-2.5 rounded-lg text-xs transition-all cursor-pointer border ${
                    isActive 
                      ? 'bg-zinc-850 border-zinc-750 text-zinc-50 font-semibold' 
                      : 'text-zinc-400 hover:bg-zinc-850/50 hover:text-zinc-200 border-transparent'
                  }`}
                  onClick={() => onSelectResume(resume.id)}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-zinc-200' : 'text-zinc-500'}`} />
                    <span className="truncate">{resume.name}</span>
                  </div>

                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateResume(resume.id);
                      }}
                      title="Duplicate version"
                      className="p-0.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-200 border border-zinc-800/40"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {resumes.length > 1 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this resume version?')) {
                            onDeleteResume(resume.id);
                          }
                        }}
                        title="Delete version"
                        className="p-0.5 hover:bg-red-950/30 rounded text-zinc-500 hover:text-red-400 border border-transparent"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Anonymize bias-reduction switcher */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
            <div className="flex items-center gap-2">
              {anonymizeMode ? (
                <EyeOff className="text-zinc-400 w-4 h-4" />
              ) : (
                <Eye className="text-zinc-500 w-4 h-4" />
              )}
              <div>
                <p className="text-xs font-semibold text-zinc-200">Anonymize Profile</p>
                <p className="text-[10px] text-zinc-500">Bias-free review mode</p>
              </div>
            </div>
            <button
              onClick={onToggleAnonymize}
              className={`w-9 h-5 rounded-full p-0.5 transition-all cursor-pointer ${
                anonymizeMode ? 'bg-zinc-100' : 'bg-zinc-800'
              }`}
            >
              <div className={`w-4 h-4 rounded-full shadow-sm transition-all transform ${
                anonymizeMode ? 'bg-zinc-950 translate-x-4' : 'bg-zinc-350 translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* Export / Sync Options section */}
        <div className="p-6 border-t border-zinc-800 space-y-3 bg-zinc-900">
          <button
            onClick={triggerDownloadPdf}
            disabled={pdfGenerating}
            className="w-full flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold py-2 px-4 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50 text-xs"
          >
            {pdfGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onDownloadTex}
              className="flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-zinc-300 text-xs font-semibold py-2 px-3 rounded-lg transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              LaTeX (.tex)
            </button>
            <button
              onClick={handleCopyText}
              className="flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-zinc-300 text-xs font-semibold py-2 px-3 rounded-lg transition-all cursor-pointer"
            >
              {copiedText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Clipboard className="w-3.5 h-3.5 text-zinc-400" />
                  Plain Text
                </>
              )}
            </button>
          </div>

          {/* Local import/export configuration backup */}
          <div className="flex gap-2 border-t border-zinc-800 pt-3 text-[11px] text-zinc-500">
            <label className="flex-1 flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 py-1.5 rounded cursor-pointer transition-all">
              <Upload className="w-3 h-3 text-zinc-400" />
              Import Backup
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
            <button
              onClick={onExportJson}
              className="flex-1 flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 py-1.5 rounded cursor-pointer transition-all"
            >
              <Download className="w-3 h-3 text-zinc-400" />
              Export Backup
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
export default Sidebar;
