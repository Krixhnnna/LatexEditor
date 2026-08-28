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
    if (score >= 90) return 'bg-green-50 text-green-700 border-green-200';
    if (score >= 75) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (score >= 50) return 'bg-yellow-50 text-yellow-700 border-yellow-250';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4 h-full overflow-y-auto pr-2 pb-4 text-slate-800 text-xs">
      
      {/* ATS Header Score Summary Dashboard */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ATS Readiness Score</span>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-extrabold font-display ${getScoreTextColor(report.overallScore)}`}>
              {report.overallScore}
            </span>
            <span className="text-slate-400 font-semibold text-sm">/ 100</span>
          </div>
          <div className="pt-1">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getScoreBadgeStyle(report.overallScore)}`}>
              {report.readinessLabel}
            </span>
          </div>
        </div>

        <div className="w-1/2 space-y-2 border-l border-slate-200 pl-6">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-slate-500" /> ATS Audit Summary
          </h4>
          <p className="text-slate-600 leading-normal text-[11px]">
            Your profile has been assessed against parsing heuristics. Improve checked items below to optimize keyword extraction.
          </p>
        </div>
      </div>

      {/* Audit checks filters and list */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <span className="font-bold text-slate-900 text-sm">Itemized Checklist</span>
          
          {/* Filters */}
          <div className="flex gap-1">
            {['all', 'contact', 'summary', 'experience', 'formatting'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-[9px] font-bold px-2 py-0.5 transition-all cursor-pointer rounded-full ${
                  activeCategory === cat 
                    ? 'bg-[#0284c7] text-white border-2 border-black px-3 py-0.5 shadow-sm' 
                    : 'bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 px-3 py-0.5'
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
            <div key={check.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex gap-3">
              <div className="shrink-0 mt-0.5">
                {check.status === 'pass' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                {check.status === 'warn' && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                {check.status === 'fail' && <XCircle className="w-4 h-4 text-red-500" />}
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-bold text-slate-800 text-[13px]">{check.title}</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {check.points}/{check.maxPoints} pts
                  </span>
                </div>
                <div>
                  <span className="text-[10px] bg-white border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                    Detected: <span className="text-slate-700 font-semibold">{check.detectedValue}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">{check.rationale}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Job description comparison and matching keyword optimizer */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Search className="w-4 h-4 text-slate-500" /> Job Description Matcher
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Paste a job posting to extract and check candidate keywords gaps.</p>
        </div>
        
        <textarea
          rows={4}
          value={jdText}
          onChange={(e) => onChangeJdText(e.target.value)}
          placeholder="Paste Job Description here (e.g. Looking for a React Developer with TypeScript, Docker...)"
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-950 text-xs placeholder-slate-400 focus:outline-none focus:border-slate-400 font-mono shadow-xs select-text"
        />

        {jdText && (
          <div className="space-y-3.5 pt-2 border-t border-slate-200">
            {/* Match percentage */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Keyword Match Rate</p>
                <p className="text-xl font-extrabold text-slate-900 font-display">{report.keywordMatch.score}%</p>
              </div>
              <div className="w-2/3 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#0284c7] h-full transition-all"
                  style={{ width: `${report.keywordMatch.score}%` }}
                ></div>
              </div>
            </div>

            {/* Keyword gaps list */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <span className="text-green-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Matched ({report.keywordMatch.matched.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {report.keywordMatch.matched.length === 0 ? (
                    <span className="text-slate-400 italic">None matched yet</span>
                  ) : (
                    report.keywordMatch.matched.map(kw => (
                      <span key={kw} className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded text-[9px] font-mono">
                        {kw}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-slate-500 font-bold flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Missing ({report.keywordMatch.missing.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {report.keywordMatch.missing.length === 0 ? (
                    <span className="text-slate-400 italic">No missing keywords found!</span>
                  ) : (
                    report.keywordMatch.missing.map(kw => (
                      <span key={kw} className="bg-slate-50 border border-slate-200 text-slate-500 px-2 py-0.5 rounded text-[9px] font-mono">
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
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-slate-500" /> One-Click Bullet Optimizer
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Select a bullet point to inject metrics and action verb improvements.</p>
        </div>

        {/* Selection picker of bullets */}
        <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50">
          {/* Experiences list */}
          {resume.experience.filter(e => !e.isHidden).map((exp) => (
            <div key={exp.id} className="space-y-1">
              <span className="text-[9px] font-bold uppercase text-slate-400 px-1">{exp.company}</span>
              {exp.bullets.map((bullet, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleSelectBullet(exp.id, '', idx, bullet)}
                  className={`p-2 rounded text-[11px] cursor-pointer transition-all border ${
                    optimizerBulletIdx === idx && optimizerExpId === exp.id
                      ? 'bg-slate-250 border-slate-350 text-slate-900 font-semibold' 
                      : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
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
              <span className="text-[9px] font-bold uppercase text-slate-400 px-1">{proj.title}</span>
              {proj.bullets.map((bullet, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleSelectBullet('', proj.id, idx, bullet)}
                  className={`p-2 rounded text-[11px] cursor-pointer transition-all border ${
                    optimizerBulletIdx === idx && optimizerProjId === proj.id
                      ? 'bg-slate-250 border-slate-350 text-slate-900 font-semibold' 
                      : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
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
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3.5">
            <div>
              <p className="text-[9px] uppercase font-bold text-slate-400">Original Bullet</p>
              <p className="text-[11px] text-slate-700 italic mt-1 bg-white p-2 rounded border border-slate-200 select-text">&quot;{optimizerBullet}&quot;</p>
            </div>

            <div className="space-y-2 border-t border-slate-200 pt-3">
              <p className="text-[9px] uppercase font-bold text-slate-400">Suggestions</p>
              
              <div className="space-y-2.5">
                {suggestions.map((sugg, idx) => (
                  <div key={idx} className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                    <p className="text-slate-900 font-semibold flex items-center gap-1.5">
                      <CornerDownRight className="w-3.5 h-3.5 text-slate-450" />
                      {sugg.suggested}
                    </p>
                    <p className="text-[11px] text-slate-600 flex items-start gap-1 leading-normal">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
                      <span>{sugg.explanation}</span>
                    </p>
                    
                    {sugg.metricSuggested && (
                      <div className="p-1 px-2 bg-yellow-50 text-yellow-700 border border-yellow-250 rounded text-[9px] font-medium inline-block">
                        Substitute standard metrics: swap [number] or [percentage] for your actual figures.
                      </div>
                    )}
                    
                    <div className="pt-1">
                      <button
                        onClick={() => handleApplySuggestion(sugg.suggested)}
                        className="flex items-center gap-1 bg-slate-100 text-slate-700 font-bold py-1 px-3 rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none cursor-pointer text-[10px]"
                      >
                        <Check className="w-3.5 h-3.5 text-slate-500" /> Apply Optimize
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
