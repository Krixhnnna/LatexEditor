import React, { useEffect, useState } from 'react';
import { validateLatex } from '../utils/latexParser';
import type { LatexError } from '../utils/latexParser';
import { AlertCircle, AlertTriangle, Play, Sparkles, ChevronUp } from 'lucide-react';

interface LatexCodeEditorProps {
  code: string;
  onChange: (updatedCode: string) => void;
}

export const LatexCodeEditor: React.FC<LatexCodeEditorProps> = ({ code, onChange }) => {
  const [errors, setErrors] = useState<LatexError[]>([]);
  const [editorVal, setEditorVal] = useState(code);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    setEditorVal(code);
    const newErrors = validateLatex(code);
    setErrors(newErrors);
    
    // Automatically expand diagnostics if compile errors are found
    if (newErrors.length > 0) {
      setCollapsed(false);
    } else {
      setCollapsed(true);
    }
  }, [code]);

  const handleTextChange = (val: string) => {
    setEditorVal(val);
    onChange(val);
  };

  const handleCompile = () => {
    const newErrors = validateLatex(editorVal);
    setErrors(newErrors);
    if (newErrors.length > 0) {
      setCollapsed(false);
    }
    onChange(editorVal); // Notify parent component to compile the PDF!
  };

  return (
    <div className="flex flex-col h-full border border-zinc-800 bg-zinc-900 rounded-xl overflow-hidden shadow-sm">
      
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-950 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">source.tex</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 font-mono">UTF-8</span>
          <button
            onClick={handleCompile}
            className="flex items-center gap-1 bg-[#38bdf8] hover:bg-[#0ea5e9] text-[#0e1117] text-[10px] font-bold py-1 px-3 rounded shadow-sm transition-all cursor-pointer"
          >
            <Play className="w-3 h-3 text-[#0e1117]" /> Recompile
          </button>
        </div>
      </div>

      {/* Main text area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Line Numbers Simulation */}
        <div className="w-12 bg-zinc-950/55 border-r border-zinc-800 text-right pr-2 py-2 select-none font-mono text-xs text-zinc-655 space-y-0.5">
          {Array.from({ length: Math.max(30, editorVal.split('\n').length) }).map((_, idx) => (
            <div key={idx}>{idx + 1}</div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          value={editorVal}
          onChange={(e) => handleTextChange(e.target.value)}
          className="flex-1 bg-transparent p-2 font-mono text-xs text-zinc-250 leading-relaxed outline-none border-none resize-none overflow-y-auto whitespace-pre focus:ring-0"
          spellCheck={false}
          placeholder="% Enter your LaTeX source code here..."
        />
      </div>

      {/* Compiler Diagnostic Panel - Collapsible */}
      <div className={`border-t border-zinc-800 bg-zinc-950 flex flex-col transition-all duration-200 ${
        collapsed ? 'h-9' : 'h-44'
      }`}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-950 cursor-pointer w-full text-left"
        >
          <div className="flex items-center gap-1.5">
            <span>LaTeX Diagnostics ({errors.length})</span>
            <ChevronUp className={`w-3.5 h-3.5 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`} />
          </div>
          {errors.length === 0 ? (
            <span className="text-green-400 flex items-center gap-1 font-semibold normal-case">
              <Sparkles className="w-3.5 h-3.5 text-green-400" /> No errors detected
            </span>
          ) : (
            <span className="text-red-400 font-semibold normal-case">
              {errors.length} issues found
            </span>
          )}
        </button>

        {!collapsed && (
          <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1.5 bg-zinc-950">
            {errors.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-500 italic text-[11px]">
                Code is valid. The client-side compiler generated standard output.
              </div>
            ) : (
              errors.map((err, idx) => (
                <div 
                  key={idx} 
                  className={`flex gap-2 p-2 rounded border text-[11px] ${
                    err.severity === 'error' 
                      ? 'bg-red-950/20 border-red-900/30 text-red-400' 
                      : 'bg-yellow-950/20 border-yellow-900/30 text-yellow-400'
                  }`}
                >
                  {err.severity === 'error' ? (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-yellow-500 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold">Line {err.line}:</span> {err.message}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

    </div>
  );
};
export default LatexCodeEditor;
