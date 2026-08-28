import React, { useState } from 'react';
import type { Resume } from '../types';
import { calculateAtsScore } from '../utils/atsEngine';
import { getBulletSuggestions } from '../utils/suggestions';
import type { BulletSuggestion } from '../utils/suggestions';
import { 
  Sparkles, CheckCircle2, AlertTriangle, XCircle, Search, 
  HelpCircle, CornerDownRight, Check
} from 'lucide-react';

interface AtsPanelProps {
  resume: Resume;
  onChange: (updatedResume: Resume) => void;
  jdText: string;
  onChangeJdText: (text: string) => void;
}

export const AtsPanel: React.FC<AtsPanelProps> = ({ 
  resume, 
  onChange, 
  jdText, 
  onChangeJdText 
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [optimizerBullet, setOptimizerBullet] = useState<string>('');
  const [optimizerExpId, setOptimizerExpId] = useState<string>('');
  const [optimizerProjId, setOptimizerProjId] = useState<string>('');
  const [optimizerBulletIdx, setOptimizerBulletIdx] = useState<number>(-1);
  const [suggestions, setSuggestions] = useState<BulletSuggestion[]>([]);

  // Calculate ATS Report
  const report = calculateAtsScore(resume, jdText);

  const getFilteredChecks = () => {
    if (activeCategory === 'all') return report.checks;
    return report.checks.filter(c => c.category === activeCategory);
  };

  // Setup bullet optimizer workspace
  const handleSelectBullet = (expId: string, projId: string, idx: number, text: string) => {
    setOptimizerExpId(expId);
    setOptimizerProjId(projId);
    setOptimizerBulletIdx(idx);
    setOptimizerBullet(text);
    
    // Generate suggestions locally
    const suggs = getBulletSuggestions(text);
    setSuggestions(suggs);
  };

  const handleApplySuggestion = (suggestedText: string) => {
    if (optimizerBulletIdx === -1) return;

    let updatedResume = { ...resume };

    if (optimizerExpId) {
      updatedResume.experience = updatedResume.experience.map(exp => {
        if (exp.id === optimizerExpId) {
          const newBullets = [...exp.bullets];
          newBullets[optimizerBulletIdx] = suggestedText;
          return { ...exp, bullets: newBullets };
        }
        return exp;
      });
    } else if (optimizerProjId) {
      updatedResume.projects = updatedResume.projects.map(proj => {
        if (proj.id === optimizerProjId) {
          const newBullets = [...proj.bullets];
          newBullets[optimizerBulletIdx] = suggestedText;
          return { ...proj, bullets: newBullets };
        }
        return proj;
      });
    }

    onChange(updatedResume);
    setOptimizerBullet(suggestedText);
    setSuggestions([]);
    setOptimizerBulletIdx(-1);
  };

  // Score Badge Styling
  const getScoreBadgeStyle = (score: number) => {
    if (score >= 90) return 'bg-green-950/20 text-green-400 border-green-900/30';
    if (score >= 75) return 'bg-blue-950/20 text-blue-400 border-blue-900/30';
    if (score >= 50) return 'bg-yellow-950/20 text-yellow-400 border-yellow-900/30';
    return 'bg-red-950/20 text-red-400 border-red-900/30';
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-blue-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-4 h-full overflow-y-auto pr-2 pb-4 text-zinc-200 text-xs">
      
      {/* ATS Header Score Summary Dashboard */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider">ATS Readiness Score</span>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-extrabold font-display ${getScoreTextColor(report.overallScore)}`}>
              {report.overallScore}
            </span>
            <span className="text-zinc-500 font-semibold text-sm">/ 100</span>
          </div>
          <div className="pt-1">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getScoreBadgeStyle(report.overallScore)}`}>
              {report.readinessLabel}
            </span>
          </div>
        </div>

        <div className="w-1/2 space-y-2 border-l border-zinc-800 pl-6">
          <h4 className="font-bold text-zinc-100 text-sm flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-zinc-400" /> ATS Audit Summary
          </h4>
          <p className="text-zinc-400 leading-normal text-[11px]">
            Your profile has been assessed against parsing heuristics. Improve checked items below to optimize keyword extraction.
          </p>
        </div>
      </div>

      {/* Audit checks filters and list */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <span className="font-bold text-zinc-100 text-sm">Itemized Checklist</span>
          
          {/* Filters */}
          <div className="flex gap-1">
            {['all', 'contact', 'summary', 'experience', 'formatting'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-[9px] font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${
                  activeCategory === cat 
                    ? 'bg-zinc-100 border-zinc-100 text-zinc-950 font-bold' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Audit checks rows */}
        <div className="space-y-2">
          {getFilteredChecks().map((check) => (
            <div key={check.id} className="p-3 bg-zinc-950/40 rounded-lg border border-zinc-800/80 flex gap-3">
              <div className="shrink-0 mt-0.5">
                {check.status === 'pass' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                {check.status === 'warn' && <AlertTriangle className="w-4 h-4 text-yellow-450" />}
                {check.status === 'fail' && <XCircle className="w-4 h-4 text-red-400" />}
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-bold text-zinc-200 text-[13px]">{check.title}</span>
                  <span className="text-[10px] font-mono text-zinc-550">
                    {check.points}/{check.maxPoints} pts
                  </span>
                </div>
                <div>
                  <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">
                    Detected: <span className="text-zinc-250 font-semibold">{check.detectedValue}</span>
                  </span>
                </div>
                <p className="text-[11px] text-zinc-450 leading-relaxed mt-1">{check.rationale}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Job description comparison and matching keyword optimizer */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 space-y-4 shadow-sm">
        <div>
          <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-1.5">
            <Search className="w-4 h-4 text-zinc-400" /> Job Description Matcher
          </h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">Paste a job posting to extract and check candidate keywords gaps.</p>
        </div>
        
        <textarea
          rows={4}
          value={jdText}
          onChange={(e) => onChangeJdText(e.target.value)}
          placeholder="Paste Job Description here (e.g. Looking for a React Developer with TypeScript, Docker...)"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 text-xs placeholder-zinc-500 focus:outline-none focus:border-zinc-550 font-mono shadow-sm"
        />

        {jdText && (
          <div className="space-y-3.5 pt-2 border-t border-zinc-800">
            {/* Match percentage */}
            <div className="flex items-center justify-between bg-zinc-950/45 p-3 rounded-lg border border-zinc-850/80">
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Keyword Match Rate</p>
                <p className="text-xl font-extrabold text-zinc-100 font-display">{report.keywordMatch.score}%</p>
              </div>
              <div className="w-2/3 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-zinc-300 h-full transition-all"
                  style={{ width: `${report.keywordMatch.score}%` }}
                ></div>
              </div>
            </div>

            {/* Keyword gaps list */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <span className="text-green-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Matched ({report.keywordMatch.matched.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {report.keywordMatch.matched.length === 0 ? (
                    <span className="text-zinc-500 italic">None matched yet</span>
                  ) : (
                    report.keywordMatch.matched.map(kw => (
                      <span key={kw} className="bg-green-950/20 text-green-400 border border-green-900/30 px-2 py-0.5 rounded text-[9px] font-mono">
                        {kw}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-zinc-400 font-bold flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Missing ({report.keywordMatch.missing.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {report.keywordMatch.missing.length === 0 ? (
                    <span className="text-zinc-500 italic">No missing keywords found!</span>
                  ) : (
                    report.keywordMatch.missing.map(kw => (
                      <span key={kw} className="bg-zinc-950 border border-zinc-850 text-zinc-400 px-2 py-0.5 rounded text-[9px] font-mono">
                        {kw}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bullet point rewrite assistant */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 space-y-4 shadow-sm">
        <div>
          <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-zinc-400" /> One-Click Bullet Optimizer
          </h3>
          <p className="text-[11px] text-zinc-550 mt-0.5">Select a bullet point to inject metrics and action verb improvements.</p>
        </div>

        {/* Selection picker of bullets */}
        <div className="space-y-2 max-h-48 overflow-y-auto border border-zinc-850 rounded-lg p-2 bg-zinc-950/45">
          {/* Experiences list */}
          {resume.experience.filter(e => !e.isHidden).map((exp) => (
            <div key={exp.id} className="space-y-1">
              <span className="text-[9px] font-bold uppercase text-zinc-500 px-1">{exp.company}</span>
              {exp.bullets.map((bullet, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleSelectBullet(exp.id, '', idx, bullet)}
                  className={`p-2 rounded text-[11px] cursor-pointer transition-all border ${
                    optimizerBulletIdx === idx && optimizerExpId === exp.id
                      ? 'bg-zinc-800 border-zinc-600 text-zinc-100 font-medium' 
                      : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <p className="truncate">{bullet || '[Empty bullet point]'}</p>
                </div>
              ))}
            </div>
          ))}

          {/* Projects list */}
          {resume.projects.filter(p => !p.isHidden).map((proj) => (
            <div key={proj.id} className="space-y-1">
              <span className="text-[9px] font-bold uppercase text-zinc-500 px-1">{proj.title}</span>
              {proj.bullets.map((bullet, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleSelectBullet('', proj.id, idx, bullet)}
                  className={`p-2 rounded text-[11px] cursor-pointer transition-all border ${
                    optimizerBulletIdx === idx && optimizerProjId === proj.id
                      ? 'bg-zinc-800 border-zinc-600 text-zinc-100 font-medium' 
                      : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <p className="truncate">{bullet || '[Empty bullet point]'}</p>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Suggestion box */}
        {optimizerBulletIdx !== -1 && (
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg space-y-3.5">
            <div>
              <p className="text-[9px] uppercase font-bold text-zinc-500">Original Bullet</p>
              <p className="text-[11px] text-zinc-300 italic mt-1 bg-zinc-900 p-2 rounded border border-zinc-850">&quot;{optimizerBullet}&quot;</p>
            </div>

            <div className="space-y-2 border-t border-zinc-800 pt-3">
              <p className="text-[9px] uppercase font-bold text-zinc-550">Suggestions</p>
              
              <div className="space-y-2.5">
                {suggestions.map((sugg, idx) => (
                  <div key={idx} className="p-3 bg-zinc-900 border border-zinc-800 rounded-md space-y-2">
                    <p className="text-zinc-100 font-semibold flex items-center gap-1.5">
                      <CornerDownRight className="w-3.5 h-3.5 text-zinc-500" />
                      {sugg.suggested}
                    </p>
                    <p className="text-[11px] text-zinc-400 flex items-start gap-1 leading-normal">
                      <HelpCircle className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-0.5" />
                      <span>{sugg.explanation}</span>
                    </p>
                    
                    {sugg.metricSuggested && (
                      <div className="p-1 px-2 bg-yellow-950/20 text-yellow-400 border border-yellow-900/30 rounded text-[9px] font-medium inline-block">
                        Substitute standard metrics: swap [number] or [percentage] for your actual figures.
                      </div>
                    )}
                    
                    <div className="pt-1">
                      <button
                        onClick={() => handleApplySuggestion(sugg.suggested)}
                        className="flex items-center gap-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold py-1 px-2.5 rounded text-[10px] transition-all cursor-pointer shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5 text-zinc-955" /> Apply Optimize
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
export default AtsPanel;
