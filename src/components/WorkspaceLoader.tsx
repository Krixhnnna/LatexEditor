import React from 'react';

interface WorkspaceLoaderProps {
  isFading: boolean;
}

export const WorkspaceLoader: React.FC<WorkspaceLoaderProps> = ({ isFading }) => {
  return (
    <div 
      className={`absolute inset-0 bg-[#f8fafc] flex flex-col items-center justify-center z-50 transition-opacity duration-300 ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-3">
        {/* Brand Name */}
        <span className="text-xl font-medium tracking-widest text-slate-800 font-display select-none">
          texcraft
        </span>
        
        {/* Horizontal Indeterminate Minimal Loading Bar */}
        <div className="w-20 h-[2px] bg-slate-250/70 rounded-full overflow-hidden relative">
          <div className="absolute w-8 h-full bg-slate-700 rounded-full animate-minimal-slide"></div>
        </div>
      </div>
    </div>
  );
};
