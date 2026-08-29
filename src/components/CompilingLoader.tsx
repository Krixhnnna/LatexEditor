import React from 'react';

export const CompilingLoader: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-[#f8fafc]/30 backdrop-blur-[0.5px] flex items-center justify-center z-20 select-none transition-all duration-300">
      <div className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200/80 rounded-full shadow-sm">
        {/* Thin minimalist spinner */}
        <div className="w-3.5 h-3.5 border-[1.5px] border-slate-200 border-t-slate-700 rounded-full animate-spin"></div>
        {/* Minimal compilation text */}
        <span className="text-[10px] font-mono tracking-wider text-slate-500 lowercase select-none">
          compiling...
        </span>
      </div>
    </div>
  );
};
