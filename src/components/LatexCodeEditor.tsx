import React, { useEffect, useState, useRef } from 'react';
import { validateLatex } from '../utils/latexParser';
import type { LatexError } from '../utils/latexParser';
import { AlertCircle, AlertTriangle, Play, Sparkles, ChevronUp } from 'lucide-react';

interface LatexCodeEditorProps {
  code: string;
  onChange: (updatedCode: string) => void;
  targetScrollLine?: { line: number; timestamp: number } | null;
}

export const LatexCodeEditor: React.FC<LatexCodeEditorProps> = ({ code, onChange, targetScrollLine }) => {
  const [errors, setErrors] = useState<LatexError[]>([]);
  const [editorVal, setEditorVal] = useState(code);
  const [collapsed, setCollapsed] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync scrolling/highlighting when double-clicked in PDF Preview
  useEffect(() => {
    if (targetScrollLine && textareaRef.current) {
      const textarea = textareaRef.current;
      const lines = editorVal.split('\n');
      const targetLine = targetScrollLine.line;

      console.log(`[Synctex Editor] targetScrollLine received line: ${targetLine}`, {
        totalLines: lines.length,
        hasTextarea: !!textarea
      });

      if (targetLine >= 0 && targetLine < lines.length) {
        let startChar = 0;
        for (let i = 0; i < targetLine; i++) {
          startChar += lines[i].length + 1; // +1 for the newline character
        }

        const endChar = startChar + lines[targetLine].length;

        console.log(`[Synctex Editor] Highlighting text selection range:`, {
          lineText: lines[targetLine],
          startChar,
          endChar
        });

        // Focus and select range to highlight the line
        textarea.focus();
        textarea.setSelectionRange(startChar, endChar);

        // Center the selected line in viewport
        const computedLineHeight = parseFloat(window.getComputedStyle(textarea).lineHeight);
        const lineHeight = isNaN(computedLineHeight) ? 18 : computedLineHeight;
        
        const targetScrollTop = targetLine * lineHeight - textarea.clientHeight / 2;
        textarea.scrollTop = Math.max(0, targetScrollTop);

        console.log(`[Synctex Editor] Scrolled textarea to scrollTop: ${textarea.scrollTop} (targetScrollTop calculated: ${targetScrollTop.toFixed(1)}, lineHeight: ${lineHeight})`);
      } else {
        console.warn(`[Synctex Editor] Target line index ${targetLine} is out of bounds [0, ${lines.length}).`);
      }
    }
  }, [targetScrollLine]);

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
    <div className="flex flex-col h-full border border-slate-200 bg-white rounded-xl overflow-hidden shadow-sm">
      
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200 select-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">source.tex</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-mono">UTF-8</span>
          <button
            onClick={handleCompile}
            className="flex items-center gap-1.5 bg-[#0284c7] text-white text-[10px] font-bold py-1 px-3.5 rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none cursor-pointer"
          >
            <Play className="w-3 h-3 text-white fill-current" /> Recompile
          </button>
        </div>
      </div>

      {/* Main text area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Line Numbers Simulation */}
        <div className="w-12 bg-slate-50 border-r border-slate-200 text-right pr-2 py-2 select-none font-mono text-xs text-slate-400 space-y-0.5">
          {Array.from({ length: Math.max(30, editorVal.split('\n').length) }).map((_, idx) => (
            <div key={idx}>{idx + 1}</div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={editorVal}
          onChange={(e) => handleTextChange(e.target.value)}
          className="flex-1 bg-transparent p-2 font-mono text-xs text-slate-800 leading-relaxed outline-none border-none resize-none overflow-y-auto whitespace-pre focus:ring-0 select-text"
          spellCheck={false}
          placeholder="% Enter your LaTeX source code here..."
        />
      </div>

      {/* Compiler Diagnostic Panel - Collapsible */}
      <div className={`border-t border-slate-200 bg-slate-50 flex flex-col transition-all duration-200 select-none ${
        collapsed ? 'h-9' : 'h-44'
      }`}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="px-4 py-2 border-b border-slate-200 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 cursor-pointer w-full text-left"
        >
          <div className="flex items-center gap-1.5">
            <span>LaTeX Diagnostics ({errors.length})</span>
            <ChevronUp className={`w-3.5 h-3.5 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`} />
          </div>
          {errors.length === 0 ? (
            <span className="text-green-600 flex items-center gap-1 font-semibold normal-case">
              <Sparkles className="w-3.5 h-3.5 text-green-600" /> No errors detected
            </span>
          ) : (
            <span className="text-red-600 font-semibold normal-case">
              {errors.length} issues found
            </span>
          )}
        </button>

        {!collapsed && (
          <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1.5 bg-slate-50">
            {errors.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 italic text-[11px]">
                Code is valid. The client-side compiler generated standard output.
              </div>
            ) : (
              errors.map((err, idx) => (
                <div 
                  key={idx} 
                  className={`flex gap-2 p-2 rounded border text-[11px] ${
                    err.severity === 'error' 
                      ? 'bg-red-50 border-red-200 text-red-700' 
                      : 'bg-yellow-50 border-yellow-200 text-yellow-700'
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
