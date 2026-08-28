export interface PersonalDetails {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  website: string;
  location: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
  isHidden: boolean;
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  major: string;
  location: string;
  graduationDate: string;
  gpa: string;
  isHidden: boolean;
}

export interface ProjectItem {
  id: string;
  title: string;
  roleOrTech: string; // e.g., "React, TypeScript, Node.js"
  link: string;
  bullets: string[];
  isHidden: boolean;
}

export interface SkillItem {
  id: string;
  category: string; // e.g., "Languages", "Frameworks"
  items: string[]; // e.g., ["JavaScript", "Python"]
  isHidden: boolean;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  link: string;
  isHidden: boolean;
}

export interface CustomSectionItem {
  id: string;
  heading: string;
  content: string; // Markdown or raw text
  isHidden: boolean;
}

export interface TypographySettings {
  fontFamily: 'serif-garamond' | 'serif-baskerville' | 'sans-inter' | 'sans-system';
  fontSize: 10 | 11 | 12; // in pt
  margins: 0.5 | 0.75 | 1.0; // in inches
  spacing: 'compact' | 'normal' | 'relaxed';
  bulletStyle: 'disc' | 'circle' | 'square' | 'dash';
  colorAccent: string; // hex code
  paperSize: 'a4' | 'letter';
}

export interface Resume {
  id: string;
  name: string;
  templateId: 'classic-latex' | 'modern-minimalist' | 'executive-serif';
  personalDetails: PersonalDetails;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  skills: SkillItem[];
  certifications: CertificationItem[];
  customSections: CustomSectionItem[];
  typography: TypographySettings;
  latexCode: string;
  activeTab: 'form' | 'latex';
  lastSaved: number;
}

export interface AtsCheckRule {
  id: string;
  category: 'contact' | 'summary' | 'experience' | 'education' | 'skills' | 'formatting';
  title: string;
  status: 'pass' | 'warn' | 'fail';
  points: number;
  maxPoints: number;
  detectedValue: string;
  rationale: string;
}

export interface AtsReport {
  overallScore: number;
  readinessLabel: 'Exceptional' | 'Good' | 'Needs Work' | 'Critical';
  checks: AtsCheckRule[];
  keywordMatch: {
    score: number; // 0 - 100
    matched: string[];
    missing: string[];
  };
}
