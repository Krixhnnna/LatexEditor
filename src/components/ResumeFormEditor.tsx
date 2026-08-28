import React, { useState } from 'react';
import type { Resume, ExperienceItem, EducationItem, ProjectItem, SkillItem, CertificationItem } from '../types';
import { 
  User, FileText, Briefcase, FolderGit2, Wrench, GraduationCap, Award, Settings, 
  Plus, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, ChevronRight, Check
} from 'lucide-react';

interface ResumeFormEditorProps {
  resume: Resume;
  onChange: (updatedResume: Resume) => void;
}

export const ResumeFormEditor: React.FC<ResumeFormEditorProps> = ({ resume, onChange }) => {
  const [activeSection, setActiveSection] = useState<string>('personal');

  const updatePersonal = (field: keyof Resume['personalDetails'], value: string) => {
    onChange({
      ...resume,
      personalDetails: {
        ...resume.personalDetails,
        [field]: value
      }
    });
  };

  const updateSummary = (value: string) => {
    onChange({
      ...resume,
      summary: value
    });
  };

  const swapItems = <T,>(arr: T[], indexA: number, indexB: number): T[] => {
    const newArr = [...arr];
    const temp = newArr[indexA];
    newArr[indexA] = newArr[indexB];
    newArr[indexB] = temp;
    return newArr;
  };

  // --- Experience Handlers ---
  const addExperience = () => {
    const newItem: ExperienceItem = {
      id: `exp-${Date.now()}`,
      company: '',
      role: '',
      location: '',
      startDate: '',
      endDate: '',
      bullets: [''],
      isHidden: false
    };
    onChange({
      ...resume,
      experience: [...resume.experience, newItem]
    });
  };

  const updateExperience = (id: string, field: keyof ExperienceItem, value: any) => {
    onChange({
      ...resume,
      experience: resume.experience.map(item => item.id === id ? { ...item, [field]: value } : item)
    });
  };

  const deleteExperience = (id: string) => {
    onChange({
      ...resume,
      experience: resume.experience.filter(item => item.id !== id)
    });
  };

  const addExperienceBullet = (expId: string) => {
    onChange({
      ...resume,
      experience: resume.experience.map(item => 
        item.id === expId ? { ...item, bullets: [...item.bullets, ''] } : item
      )
    });
  };

  const updateExperienceBullet = (expId: string, bulletIndex: number, value: string) => {
    onChange({
      ...resume,
      experience: resume.experience.map(item => 
        item.id === expId 
          ? { ...item, bullets: item.bullets.map((b, idx) => idx === bulletIndex ? value : b) } 
          : item
      )
    });
  };

  const deleteExperienceBullet = (expId: string, bulletIndex: number) => {
    onChange({
      ...resume,
      experience: resume.experience.map(item => 
        item.id === expId 
          ? { ...item, bullets: item.bullets.filter((_, idx) => idx !== bulletIndex) } 
          : item
      )
    });
  };

  // --- Projects Handlers ---
  const addProject = () => {
    const newItem: ProjectItem = {
      id: `proj-${Date.now()}`,
      title: '',
      roleOrTech: '',
      link: '',
      bullets: [''],
      isHidden: false
    };
    onChange({
      ...resume,
      projects: [...resume.projects, newItem]
    });
  };

  const updateProject = (id: string, field: keyof ProjectItem, value: any) => {
    onChange({
      ...resume,
      projects: resume.projects.map(item => item.id === id ? { ...item, [field]: value } : item)
    });
  };

  const deleteProject = (id: string) => {
    onChange({
      ...resume,
      projects: resume.projects.filter(item => item.id !== id)
    });
  };

  const addProjectBullet = (projId: string) => {
    onChange({
      ...resume,
      projects: resume.projects.map(item => 
        item.id === projId ? { ...item, bullets: [...item.bullets, ''] } : item
      )
    });
  };

  const updateProjectBullet = (projId: string, bulletIndex: number, value: string) => {
    onChange({
      ...resume,
      projects: resume.projects.map(item => 
        item.id === projId 
          ? { ...item, bullets: item.bullets.map((b, idx) => idx === bulletIndex ? value : b) } 
          : item
      )
    });
  };

  const deleteProjectBullet = (projId: string, bulletIndex: number) => {
    onChange({
      ...resume,
      projects: resume.projects.map(item => 
        item.id === projId 
          ? { ...item, bullets: item.bullets.filter((_, idx) => idx !== bulletIndex) } 
          : item
      )
    });
  };

  // --- Education Handlers ---
  const addEducation = () => {
    const newItem: EducationItem = {
      id: `edu-${Date.now()}`,
      institution: '',
      degree: '',
      major: '',
      location: '',
      graduationDate: '',
      gpa: '',
      isHidden: false
    };
    onChange({
      ...resume,
      education: [...resume.education, newItem]
    });
  };

  const updateEducation = (id: string, field: keyof EducationItem, value: any) => {
    onChange({
      ...resume,
      education: resume.education.map(item => item.id === id ? { ...item, [field]: value } : item)
    });
  };

  const deleteEducation = (id: string) => {
    onChange({
      ...resume,
      education: resume.education.filter(item => item.id !== id)
    });
  };

  // --- Skills Handlers ---
  const addSkill = () => {
    const newItem: SkillItem = {
      id: `skill-${Date.now()}`,
      category: '',
      items: [],
      isHidden: false
    };
    onChange({
      ...resume,
      skills: [...resume.skills, newItem]
    });
  };

  const updateSkill = (id: string, field: keyof SkillItem, value: any) => {
    onChange({
      ...resume,
      skills: resume.skills.map(item => item.id === id ? { ...item, [field]: value } : item)
    });
  };

  const deleteSkill = (id: string) => {
    onChange({
      ...resume,
      skills: resume.skills.filter(item => item.id !== id)
    });
  };

  // --- Certifications Handlers ---
  const addCertification = () => {
    const newItem: CertificationItem = {
      id: `cert-${Date.now()}`,
      name: '',
      issuer: '',
      date: '',
      link: '',
      isHidden: false
    };
    onChange({
      ...resume,
      certifications: [...resume.certifications, newItem]
    });
  };

  const updateCertification = (id: string, field: keyof CertificationItem, value: any) => {
    onChange({
      ...resume,
      certifications: resume.certifications.map(item => item.id === id ? { ...item, [field]: value } : item)
    });
  };

  const deleteCertification = (id: string) => {
    onChange({
      ...resume,
      certifications: resume.certifications.filter(item => item.id !== id)
    });
  };

  // --- Styling Handlers ---
  const updateStyle = (key: keyof Resume['typography'], value: any) => {
    onChange({
      ...resume,
      typography: {
        ...resume.typography,
        [key]: value
      }
    });
  };

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? '' : section);
  };

  return (
    <div className="space-y-2 h-full overflow-y-auto pr-2 pb-4">
      
      {/* 1. PERSONAL DETAILS */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
        <button 
          onClick={() => toggleSection('personal')}
          className="w-full flex items-center justify-between p-4 font-semibold text-zinc-100 bg-zinc-900 hover:bg-zinc-850 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-zinc-400" />
            <span className="text-sm">Personal Details</span>
          </div>
          <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${activeSection === 'personal' ? 'rotate-90' : ''}`} />
        </button>

        {activeSection === 'personal' && (
          <div className="p-4 grid grid-cols-2 gap-4 border-t border-zinc-800 text-xs bg-zinc-900">
            <div className="space-y-1">
              <label className="text-zinc-400 font-medium">Full Name</label>
              <input
                type="text"
                value={resume.personalDetails.name}
                onChange={(e) => updatePersonal('name', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 focus:outline-none focus:border-zinc-550 text-zinc-100 shadow-sm"
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-1">
              <label className="text-zinc-400 font-medium">Email Address</label>
              <input
                type="email"
                value={resume.personalDetails.email}
                onChange={(e) => updatePersonal('email', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 focus:outline-none focus:border-zinc-550 text-zinc-100 shadow-sm"
                placeholder="john.doe@example.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-zinc-400 font-medium">Phone Number</label>
              <input
                type="text"
                value={resume.personalDetails.phone}
                onChange={(e) => updatePersonal('phone', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 focus:outline-none focus:border-zinc-550 text-zinc-100 shadow-sm"
                placeholder="+1 (555) 019-2834"
              />
            </div>
            <div className="space-y-1">
              <label className="text-zinc-400 font-medium">Location</label>
              <input
                type="text"
                value={resume.personalDetails.location}
                onChange={(e) => updatePersonal('location', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 focus:outline-none focus:border-zinc-550 text-zinc-100 shadow-sm"
                placeholder="New York, NY"
              />
            </div>
            <div className="space-y-1">
              <label className="text-zinc-400 font-medium">LinkedIn Link</label>
              <input
                type="text"
                value={resume.personalDetails.linkedin}
                onChange={(e) => updatePersonal('linkedin', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 focus:outline-none focus:border-zinc-550 text-zinc-100 shadow-sm"
                placeholder="linkedin.com/in/johndoe"
              />
            </div>
            <div className="space-y-1">
              <label className="text-zinc-400 font-medium">GitHub Link</label>
              <input
                type="text"
                value={resume.personalDetails.github}
                onChange={(e) => updatePersonal('github', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 focus:outline-none focus:border-zinc-550 text-zinc-100 shadow-sm"
                placeholder="github.com/johndoe"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <label className="text-zinc-400 font-medium">Personal Website</label>
              <input
                type="text"
                value={resume.personalDetails.website}
                onChange={(e) => updatePersonal('website', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 focus:outline-none focus:border-zinc-550 text-zinc-100 shadow-sm"
                placeholder="johndoe.com"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. SUMMARY */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
        <button 
          onClick={() => toggleSection('summary')}
          className="w-full flex items-center justify-between p-4 font-semibold text-zinc-100 bg-zinc-900 hover:bg-zinc-850 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-zinc-400" />
            <span className="text-sm">Professional Summary</span>
          </div>
          <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${activeSection === 'summary' ? 'rotate-90' : ''}`} />
        </button>

        {activeSection === 'summary' && (
          <div className="p-4 border-t border-zinc-800 bg-zinc-900">
            <textarea
              rows={4}
              value={resume.summary}
              onChange={(e) => updateSummary(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 focus:outline-none focus:border-zinc-550 text-zinc-100 text-xs shadow-sm placeholder-zinc-500"
              placeholder="Provide a brief summary of your achievements and skills..."
            />
          </div>
        )}
      </div>

      {/* 3. EXPERIENCE */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
        <button 
          onClick={() => toggleSection('experience')}
          className="w-full flex items-center justify-between p-4 font-semibold text-zinc-100 bg-zinc-900 hover:bg-zinc-850 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Briefcase className="w-4 h-4 text-zinc-400" />
            <span className="text-sm">Work Experience</span>
          </div>
          <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${activeSection === 'experience' ? 'rotate-90' : ''}`} />
        </button>

        {activeSection === 'experience' && (
          <div className="p-4 border-t border-zinc-800 space-y-4 text-xs bg-zinc-900">
            {resume.experience.map((exp, expIdx) => (
              <div key={exp.id} className="p-4 bg-zinc-950/40 rounded-lg border border-zinc-800/80 space-y-4 relative">
                {/* Controls */}
                <div className="absolute right-4 top-4 flex gap-1 bg-zinc-900 p-1 rounded border border-zinc-800 shadow-sm">
                  <button
                    disabled={expIdx === 0}
                    onClick={() => onChange({
                      ...resume,
                      experience: swapItems(resume.experience, expIdx, expIdx - 1)
                    })}
                    className="p-0.5 hover:bg-zinc-800 rounded disabled:opacity-20 text-zinc-500 hover:text-zinc-200 cursor-pointer"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={expIdx === resume.experience.length - 1}
                    onClick={() => onChange({
                      ...resume,
                      experience: swapItems(resume.experience, expIdx, expIdx + 1)
                    })}
                    className="p-0.5 hover:bg-zinc-800 rounded disabled:opacity-20 text-zinc-500 hover:text-zinc-200 cursor-pointer"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => updateExperience(exp.id, 'isHidden', !exp.isHidden)}
                    className="p-0.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-200 cursor-pointer"
                  >
                    {exp.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => deleteExperience(exp.id)}
                    className="p-0.5 hover:bg-red-950/40 rounded text-zinc-500 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <div className="space-y-1">
                    <label className="text-zinc-400 font-medium">Company</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100 focus:outline-none focus:border-zinc-550 shadow-sm"
                      placeholder="TechCorp Inc."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-400 font-medium">Role</label>
                    <input
                      type="text"
                      value={exp.role}
                      onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100 focus:outline-none focus:border-zinc-550 shadow-sm"
                      placeholder="Software Engineer II"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-400 font-medium">Location</label>
                    <input
                      type="text"
                      value={exp.location}
                      onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100 focus:outline-none focus:border-zinc-550 shadow-sm"
                      placeholder="Remote / New York"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-zinc-400 font-medium">Start Date</label>
                      <input
                        type="text"
                        value={exp.startDate}
                        onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100 focus:outline-none focus:border-zinc-550 shadow-sm"
                        placeholder="2021-06"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-400 font-medium">End Date</label>
                      <input
                        type="text"
                        value={exp.endDate}
                        onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100 focus:outline-none focus:border-zinc-550 shadow-sm"
                        placeholder="Present"
                      />
                    </div>
                  </div>
                </div>

                {/* Bullets List */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-zinc-450">Achievements & Responsibilities</span>
                  <div className="space-y-2">
                    {exp.bullets.map((bullet, bulletIdx) => (
                      <div key={bulletIdx} className="flex gap-2 items-center">
                        <textarea
                          rows={1}
                          value={bullet}
                          onChange={(e) => updateExperienceBullet(exp.id, bulletIdx, e.target.value)}
                          className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100 text-xs resize-none focus:outline-none focus:border-zinc-550 shadow-sm"
                          placeholder="Designed a system that achieved..."
                        />
                        <div className="flex flex-col gap-0.5">
                          <button
                            disabled={bulletIdx === 0}
                            onClick={() => {
                              const newBullets = swapItems(exp.bullets, bulletIdx, bulletIdx - 1);
                              updateExperience(exp.id, 'bullets', newBullets);
                            }}
                            className="p-0.5 hover:bg-zinc-800 rounded disabled:opacity-20 text-zinc-500 cursor-pointer"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={bulletIdx === exp.bullets.length - 1}
                            onClick={() => {
                              const newBullets = swapItems(exp.bullets, bulletIdx, bulletIdx + 1);
                              updateExperience(exp.id, 'bullets', newBullets);
                            }}
                            className="p-0.5 hover:bg-zinc-800 rounded disabled:opacity-20 text-zinc-500 cursor-pointer"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => deleteExperienceBullet(exp.id, bulletIdx)}
                          className="p-1 hover:bg-red-950/40 rounded text-zinc-500 hover:text-red-400 self-center cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => addExperienceBullet(exp.id)}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-250 font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Bullet Point
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={addExperience}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-zinc-850 hover:border-zinc-650 bg-zinc-900 hover:bg-zinc-850 rounded-lg p-3 text-zinc-400 hover:text-zinc-200 font-semibold transition-all cursor-pointer shadow-sm text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Experience Block
            </button>
          </div>
        )}
      </div>

      {/* 4. PROJECTS */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
        <button 
          onClick={() => toggleSection('projects')}
          className="w-full flex items-center justify-between p-4 font-semibold text-zinc-100 bg-zinc-900 hover:bg-zinc-850 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <FolderGit2 className="w-4 h-4 text-zinc-400" />
            <span className="text-sm">Projects</span>
          </div>
          <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${activeSection === 'projects' ? 'rotate-90' : ''}`} />
        </button>

        {activeSection === 'projects' && (
          <div className="p-4 border-t border-zinc-800 space-y-4 text-xs bg-zinc-900">
            {resume.projects.map((proj, projIdx) => (
              <div key={proj.id} className="p-4 bg-zinc-950/40 rounded-lg border border-zinc-800/80 space-y-4 relative">
                {/* Controls */}
                <div className="absolute right-4 top-4 flex gap-1 bg-zinc-900 p-1 rounded border border-zinc-800 shadow-sm">
                  <button
                    disabled={projIdx === 0}
                    onClick={() => onChange({
                      ...resume,
                      projects: swapItems(resume.projects, projIdx, projIdx - 1)
                    })}
                    className="p-0.5 hover:bg-zinc-800 rounded disabled:opacity-20 text-zinc-500 hover:text-zinc-200 cursor-pointer"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={projIdx === resume.projects.length - 1}
                    onClick={() => onChange({
                      ...resume,
                      projects: swapItems(resume.projects, projIdx, projIdx + 1)
                    })}
                    className="p-0.5 hover:bg-zinc-800 rounded disabled:opacity-20 text-zinc-500 hover:text-zinc-200 cursor-pointer"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => updateProject(proj.id, 'isHidden', !proj.isHidden)}
                    className="p-0.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-200 cursor-pointer"
                  >
                    {proj.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => deleteProject(proj.id)}
                    className="p-0.5 hover:bg-red-955/30 rounded text-zinc-500 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <div className="space-y-1">
                    <label className="text-zinc-400 font-medium">Project Title</label>
                    <input
                      type="text"
                      value={proj.title}
                      onChange={(e) => updateProject(proj.id, 'title', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100 focus:outline-none focus:border-zinc-550 shadow-sm"
                      placeholder="My SaaS App"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-400 font-medium">Role / Technologies</label>
                    <input
                      type="text"
                      value={proj.roleOrTech}
                      onChange={(e) => updateProject(proj.id, 'roleOrTech', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100 focus:outline-none focus:border-zinc-550 shadow-sm"
                      placeholder="React, AWS, Node.js"
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-zinc-400 font-medium">Link (e.g. GitHub, live URL)</label>
                    <input
                      type="text"
                      value={proj.link}
                      onChange={(e) => updateProject(proj.id, 'link', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100 focus:outline-none focus:border-zinc-550 shadow-sm"
                      placeholder="github.com/myname/project"
                    />
                  </div>
                </div>

                {/* Bullets List */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-zinc-450">Project Highlights</span>
                  <div className="space-y-2">
                    {proj.bullets.map((bullet, bulletIdx) => (
                      <div key={bulletIdx} className="flex gap-2 items-center">
                        <textarea
                          rows={1}
                          value={bullet}
                          onChange={(e) => updateProjectBullet(proj.id, bulletIdx, e.target.value)}
                          className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100 text-xs resize-none focus:outline-none focus:border-zinc-550 shadow-sm"
                          placeholder="Launched project that was used by..."
                        />
                        <div className="flex flex-col gap-0.5">
                          <button
                            disabled={bulletIdx === 0}
                            onClick={() => {
                              const newBullets = swapItems(proj.bullets, bulletIdx, bulletIdx - 1);
                              updateProject(proj.id, 'bullets', newBullets);
                            }}
                            className="p-0.5 hover:bg-zinc-800 rounded disabled:opacity-20 text-zinc-500 cursor-pointer"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={bulletIdx === proj.bullets.length - 1}
                            onClick={() => {
                              const newBullets = swapItems(proj.bullets, bulletIdx, bulletIdx + 1);
                              updateProject(proj.id, 'bullets', newBullets);
                            }}
                            className="p-0.5 hover:bg-zinc-800 rounded disabled:opacity-20 text-zinc-500 cursor-pointer"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => deleteProjectBullet(proj.id, bulletIdx)}
                          className="p-1 hover:bg-red-955/30 rounded text-zinc-500 hover:text-red-400 self-center cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => addProjectBullet(proj.id)}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-250 font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Project Bullet
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={addProject}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-zinc-850 hover:border-zinc-650 bg-zinc-900 hover:bg-zinc-850 rounded-lg p-3 text-zinc-400 hover:text-zinc-200 font-semibold transition-all cursor-pointer shadow-sm text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Project Block
            </button>
          </div>
        )}
      </div>

      {/* 5. SKILLS */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
        <button 
          onClick={() => toggleSection('skills')}
          className="w-full flex items-center justify-between p-4 font-semibold text-zinc-100 bg-zinc-900 hover:bg-zinc-850 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Wrench className="w-4 h-4 text-zinc-400" />
            <span className="text-sm">Technical Skills</span>
          </div>
          <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${activeSection === 'skills' ? 'rotate-90' : ''}`} />
        </button>

        {activeSection === 'skills' && (
          <div className="p-4 border-t border-zinc-800 space-y-4 text-xs bg-zinc-900">
            {resume.skills.map((skill) => (
              <div key={skill.id} className="p-3 bg-zinc-950/40 rounded-lg border border-zinc-800 space-y-3 relative">
                <div className="absolute right-3 top-3 flex gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800 shadow-sm">
                  <button
                    onClick={() => updateSkill(skill.id, 'isHidden', !skill.isHidden)}
                    className="p-0.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-200 cursor-pointer"
                  >
                    {skill.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => deleteSkill(skill.id)}
                    className="p-0.5 hover:bg-red-955/30 rounded text-zinc-500 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="space-y-1">
                    <label className="text-zinc-400 font-medium">Category</label>
                    <input
                      type="text"
                      value={skill.category}
                      onChange={(e) => updateSkill(skill.id, 'category', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100 focus:outline-none focus:border-zinc-550 shadow-sm"
                      placeholder="Languages, Dev Tools"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-400 font-medium">Items (comma-separated)</label>
                    <input
                      type="text"
                      value={skill.items.join(', ')}
                      onChange={(e) => updateSkill(skill.id, 'items', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100 focus:outline-none focus:border-zinc-550 shadow-sm"
                      placeholder="TypeScript, Python, Go"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addSkill}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-zinc-850 hover:border-zinc-650 bg-zinc-900 hover:bg-zinc-850 rounded-lg p-3 text-zinc-400 hover:text-zinc-200 font-semibold transition-all cursor-pointer shadow-sm text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Skill Category
            </button>
          </div>
        )}
      </div>

      {/* 6. EDUCATION */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
        <button 
          onClick={() => toggleSection('education')}
          className="w-full flex items-center justify-between p-4 font-semibold text-zinc-100 bg-zinc-900 hover:bg-zinc-850 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-4 h-4 text-zinc-400" />
            <span className="text-sm">Education</span>
          </div>
          <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${activeSection === 'education' ? 'rotate-90' : ''}`} />
        </button>

        {activeSection === 'education' && (
          <div className="p-4 border-t border-zinc-800 space-y-4 text-xs bg-zinc-900">
            {resume.education.map((edu) => (
              <div key={edu.id} className="p-4 bg-zinc-950/40 rounded-lg border border-zinc-800/80 space-y-4 relative">
                <div className="absolute right-4 top-4 flex gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800 shadow-sm">
                  <button
                    onClick={() => updateEducation(edu.id, 'isHidden', !edu.isHidden)}
                    className="p-0.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-200 cursor-pointer"
                  >
                    {edu.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => deleteEducation(edu.id)}
                    className="p-0.5 hover:bg-red-955/30 rounded text-zinc-500 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <div className="space-y-1">
                    <label className="text-zinc-400 font-medium">Institution</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100 focus:outline-none focus:border-zinc-550 shadow-sm"
                      placeholder="University of California, Berkeley"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-400 font-medium">Location</label>
                    <input
                      type="text"
                      value={edu.location}
                      onChange={(e) => updateEducation(edu.id, 'location', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100 focus:outline-none focus:border-zinc-550 shadow-sm"
                      placeholder="Berkeley, CA"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-400 font-medium">Degree</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100 focus:outline-none focus:border-zinc-550 shadow-sm"
                      placeholder="B.S. / B.A."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-400 font-medium">Major</label>
                    <input
                      type="text"
                      value={edu.major}
                      onChange={(e) => updateEducation(edu.id, 'major', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100 focus:outline-none focus:border-zinc-550 shadow-sm"
                      placeholder="Computer Science"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-400 font-medium">Graduation Date</label>
                    <input
                      type="text"
                      value={edu.graduationDate}
                      onChange={(e) => updateEducation(edu.id, 'graduationDate', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100 focus:outline-none focus:border-zinc-550 shadow-sm"
                      placeholder="2021-05"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-400 font-medium">GPA (Optional)</label>
                    <input
                      type="text"
                      value={edu.gpa}
                      onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100 focus:outline-none focus:border-zinc-550 shadow-sm"
                      placeholder="3.75"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addEducation}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-zinc-850 hover:border-zinc-650 bg-zinc-900 hover:bg-zinc-850 rounded-lg p-3 text-zinc-400 hover:text-zinc-200 font-semibold transition-all cursor-pointer shadow-sm text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Education
            </button>
          </div>
        )}
      </div>

      {/* 7. CERTIFICATIONS */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
        <button 
          onClick={() => toggleSection('certifications')}
          className="w-full flex items-center justify-between p-4 font-semibold text-zinc-100 bg-zinc-900 hover:bg-zinc-850 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Award className="w-4 h-4 text-zinc-400" />
            <span className="text-sm">Certifications</span>
          </div>
          <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${activeSection === 'certifications' ? 'rotate-90' : ''}`} />
        </button>

        {activeSection === 'certifications' && (
          <div className="p-4 border-t border-zinc-800 space-y-4 text-xs bg-zinc-900">
            {resume.certifications.map((cert) => (
              <div key={cert.id} className="p-4 bg-zinc-950/40 rounded-lg border border-zinc-800/80 space-y-4 relative">
                <div className="absolute right-4 top-4 flex gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800 shadow-sm">
                  <button
                    onClick={() => updateCertification(cert.id, 'isHidden', !cert.isHidden)}
                    className="p-0.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-200 cursor-pointer"
                  >
                    {cert.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => deleteCertification(cert.id)}
                    className="p-0.5 hover:bg-red-955/30 rounded text-zinc-500 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <div className="space-y-1">
                    <label className="text-zinc-400 font-medium">Certification Name</label>
                    <input
                      type="text"
                      value={cert.name}
                      onChange={(e) => updateCertification(cert.id, 'name', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100 focus:outline-none focus:border-zinc-550 shadow-sm"
                      placeholder="AWS Certified Developer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-400 font-medium">Issuer</label>
                    <input
                      type="text"
                      value={cert.issuer}
                      onChange={(e) => updateCertification(cert.id, 'issuer', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100 focus:outline-none focus:border-zinc-550 shadow-sm"
                      placeholder="Amazon Web Services"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-400 font-medium">Date Received</label>
                    <input
                      type="text"
                      value={cert.date}
                      onChange={(e) => updateCertification(cert.id, 'date', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100 focus:outline-none focus:border-zinc-550 shadow-sm"
                      placeholder="2023-08"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-400 font-medium">Verification Link</label>
                    <input
                      type="text"
                      value={cert.link}
                      onChange={(e) => updateCertification(cert.id, 'link', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100 focus:outline-none focus:border-zinc-550 shadow-sm"
                      placeholder="credly.com/..."
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addCertification}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-zinc-850 hover:border-zinc-650 bg-zinc-900 hover:bg-zinc-850 rounded-lg p-3 text-zinc-400 hover:text-zinc-200 font-semibold transition-all cursor-pointer shadow-sm text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Certification
            </button>
          </div>
        )}
      </div>

      {/* 8. TYPOGRAPHY & DESIGN CONTROLS */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
        <button 
          onClick={() => toggleSection('design')}
          className="w-full flex items-center justify-between p-4 font-semibold text-zinc-100 bg-zinc-900 hover:bg-zinc-850 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Settings className="w-4 h-4 text-zinc-400" />
            <span className="text-sm">Typography & Design</span>
          </div>
          <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${activeSection === 'design' ? 'rotate-90' : ''}`} />
        </button>

        {activeSection === 'design' && (
          <div className="p-4 border-t border-zinc-800 space-y-4 text-xs bg-zinc-900">
            
            {/* Font family */}
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-medium">Font Family</label>
              <select
                value={resume.typography.fontFamily}
                onChange={(e) => updateStyle('fontFamily', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100 focus:outline-none focus:border-zinc-550 shadow-sm"
              >
                <option value="serif-garamond">EB Garamond (Elegant Serif)</option>
                <option value="serif-baskerville">Charter / Baskerville (Executive Serif)</option>
                <option value="sans-inter">Inter (Clean Modern Sans)</option>
                <option value="sans-system">System Sans (ATS Standard)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Font size */}
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium">Font Size</label>
                <select
                  value={resume.typography.fontSize}
                  onChange={(e) => updateStyle('fontSize', Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100 focus:outline-none focus:border-zinc-550 shadow-sm"
                >
                  <option value={10}>10 pt (Compact)</option>
                  <option value={11}>11 pt (Standard)</option>
                  <option value={12}>12 pt (Large)</option>
                </select>
              </div>

              {/* Page margins */}
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium">Margins (inches)</label>
                <select
                  value={resume.typography.margins}
                  onChange={(e) => updateStyle('margins', Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100 focus:outline-none focus:border-zinc-550 shadow-sm"
                >
                  <option value={0.5}>0.5 in (Narrow)</option>
                  <option value={0.75}>0.75 in (Standard)</option>
                  <option value={1.0}>1.0 in (Wide)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Line spacing */}
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium">Line Spacing</label>
                <select
                  value={resume.typography.spacing}
                  onChange={(e) => updateStyle('spacing', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100 focus:outline-none focus:border-zinc-550 shadow-sm"
                >
                  <option value="compact">Compact (Dense)</option>
                  <option value="normal">Normal (Standard)</option>
                  <option value="relaxed">Relaxed (Spacious)</option>
                </select>
              </div>

              {/* Paper Format */}
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium">Paper Format</label>
                <select
                  value={resume.typography.paperSize}
                  onChange={(e) => updateStyle('paperSize', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100 focus:outline-none focus:border-zinc-550 shadow-sm"
                >
                  <option value="letter">US Letter (8.5&quot; x 11&quot;)</option>
                  <option value="a4">A4 (210mm x 297mm)</option>
                </select>
              </div>
            </div>

            {/* Color accent selection */}
            <div className="space-y-2">
              <label className="text-zinc-400 font-medium">Accent Color (for printing accents)</label>
              <div className="flex gap-2 items-center">
                {['#0f172a', '#1e3a8a', '#14532d', '#701a75', '#7c2d12'].map((color) => (
                  <button
                    key={color}
                    onClick={() => updateStyle('colorAccent', color)}
                    className="w-6 h-6 rounded-full border border-zinc-700 cursor-pointer relative"
                    style={{ backgroundColor: color }}
                  >
                    {resume.typography.colorAccent === color && (
                      <Check className="w-3.5 h-3.5 text-white absolute inset-0 m-auto" />
                    )}
                  </button>
                ))}
                <input
                  type="color"
                  value={resume.typography.colorAccent}
                  onChange={(e) => updateStyle('colorAccent', e.target.value)}
                  className="w-8 h-8 rounded border border-zinc-800 bg-transparent cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
export default ResumeFormEditor;
