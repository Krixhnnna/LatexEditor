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
          className="fixed inset-0 bg-slate-900/25 backdrop-blur-xs z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-64 border-r border-slate-200 bg-white flex flex-col h-screen overflow-hidden transition-transform duration-300 ease-in-out shadow-2xl text-slate-800 select-none ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* App Header branding */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white">
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold flex items-center gap-2 text-slate-900">
              <FileText className="text-slate-500 w-5 h-5" />
              <span className="font-display tracking-tight text-slate-950">TeXCraft</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">v1.0</span>
            </h1>
            <p className="text-xs text-slate-400">Private Browser LaTeX Editor</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-600 transition-all cursor-pointer self-start border border-slate-200"
            title="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Resumes List section */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-white">
          <div className="flex justify-between items-center px-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">My Resumes</span>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-600 transition-all cursor-pointer border border-slate-200"
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
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none focus:border-slate-400 text-slate-950 placeholder-slate-400 shadow-xs select-text"
                autoFocus
              />
              <div className="flex gap-2">
                <button 
                  type="submit" 
                  className="flex-1 bg-[#0284c7] text-white text-xs font-bold py-1.5 px-3.5 rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none cursor-pointer"
                >
                  Create
                </button>
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-slate-100 text-slate-700 text-xs font-semibold py-1.5 px-3.5 rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none cursor-pointer"
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
                  className={`group flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-slate-50 border-slate-200 text-slate-900 font-semibold' 
                      : 'border-transparent text-slate-600 hover:bg-slate-50/50 hover:text-slate-800'
                  }`}
                  onClick={() => onSelectResume(resume.id)}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <FileText className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#0284c7]' : 'text-slate-400'}`} />
                    <span className="text-xs truncate">{resume.name}</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateResume(resume.id);
                      }}
                      className="p-1 hover:bg-slate-200/50 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      title="Duplicate version"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteResume(resume.id);
                      }}
                      className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Delete version"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Anonymize settings toggle in Sidebar */}
        <div className="p-4 border-t border-slate-200 space-y-2 bg-white">
          <div className="flex items-center justify-between px-2">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                {anonymizeMode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                Anonymize Data
              </span>
              <p className="text-[9px] text-slate-400">Mask personal details in PDF</p>
            </div>
            <button
              onClick={onToggleAnonymize}
              className={`w-9 h-5 rounded-full p-0.5 transition-all cursor-pointer ${
                anonymizeMode ? 'bg-[#0284c7]' : 'bg-slate-200'
              }`}
            >
              <div className={`w-4 h-4 rounded-full shadow-sm bg-white transition-all transform ${
                anonymizeMode ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* Export / Sync Options section */}
        <div className="p-6 border-t border-slate-200 space-y-3 bg-slate-50">
          <button
            onClick={triggerDownloadPdf}
            disabled={pdfGenerating}
            className="w-full flex items-center justify-center gap-2 bg-[#0284c7] text-white font-bold py-2 px-4 rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none cursor-pointer disabled:opacity-50 text-xs"
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
              className="flex items-center justify-center gap-1.5 bg-slate-100 border-2 border-black text-slate-700 text-xs font-semibold py-2 px-3.5 rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              LaTeX (.tex)
            </button>
            <button
              onClick={handleCopyText}
              className="flex items-center justify-center gap-1.5 bg-slate-100 border-2 border-black text-slate-700 text-xs font-semibold py-2 px-3.5 rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none cursor-pointer"
            >
              {copiedText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Clipboard className="w-3.5 h-3.5 text-slate-500" />
                  Plain Text
                </>
              )}
            </button>
          </div>

          {/* Local import/export configuration backup */}
          <div className="flex gap-2 border-t border-slate-200 pt-3 text-[11px] text-slate-400">
            <label className="flex-1 flex items-center justify-center gap-1 bg-slate-100 border-2 border-black py-1.5 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer text-slate-700">
              <Upload className="w-3 h-3 text-slate-500" />
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
              className="flex-1 flex items-center justify-center gap-1 bg-slate-100 border-2 border-black py-1.5 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer text-slate-700"
            >
              <Download className="w-3 h-3 text-slate-500" />
              Export Backup
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
export default Sidebar;
