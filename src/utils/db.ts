import type { Resume } from '../types';

const STORAGE_KEY = 'latex_resume_editor_resumes';
const ACTIVE_KEY = 'latex_resume_editor_active_id';
const JD_KEY = 'latex_resume_editor_jd_text';

export const DEFAULT_TYPOGRAPHY = {
  fontFamily: 'serif-garamond' as const,
  fontSize: 11 as const,
  margins: 0.75 as const,
  spacing: 'normal' as const,
  bulletStyle: 'disc' as const,
  colorAccent: '#0f172a', // Slate 900
  paperSize: 'letter' as const,
};

export const createSampleResume = (): Resume => ({
  id: 'sample-software-engineer',
  name: 'Software Engineer Resume (Sample)',
  templateId: 'classic-latex',
  personalDetails: {
    name: 'Alex Mercer',
    email: 'alex.mercer@email.com',
    phone: '+1 (555) 019-2834',
    linkedin: 'linkedin.com/in/alex-mercer',
    github: 'github.com/alexmercer',
    website: 'alexmercer.dev',
    location: 'San Francisco, CA',
  },
  summary: 'Detail-oriented Software Engineer with 4+ years of experience designing scalable web apps and microservices. Proven track record of optimizing React rendering pipelines and migrating backend services to Go, improving API response times by 35%. Passionate about clean code, developer tools, and client-side performance.',
  experience: [
    {
      id: 'exp-1',
      company: 'TechFlow Solutions',
      role: 'Software Engineer II',
      location: 'San Francisco, CA',
      startDate: '2023-03',
      endDate: 'Present',
      bullets: [
        'Architected and implemented a high-throughput real-time data visualizer in React and TypeScript, boosting client-side dashboard rendering speeds by 42%.',
        'Led the migration of 4 legacy Node.js microservices to Go, reducing service latency by 35% and cloud infrastructure spend by $12,000 annually.',
        'Collaborated with a cross-functional team of 6 to implement OAuth2 authentication across 3 distinct product lines, reducing login support tickets by 55%.'
      ],
      isHidden: false,
    },
    {
      id: 'exp-2',
      company: 'AppForge Inc.',
      role: 'Associate Software Engineer',
      location: 'Oakland, CA',
      startDate: '2021-06',
      endDate: '2023-02',
      bullets: [
        'Built and maintained 15+ reusable UI components in Tailwind CSS and React, accelerating product feature delivery timelines by 25%.',
        'Optimized PostgreSQL query execution plans, resulting in a 20% latency reduction on high-traffic endpoints querying 2M+ database rows.',
        'Authored 80+ unit and integration tests using Jest and React Testing Library, lifting overall test coverage from 68% to 88%.'
      ],
      isHidden: false,
    }
  ],
  education: [
    {
      id: 'edu-1',
      institution: 'University of California, Berkeley',
      degree: 'Bachelor of Science',
      major: 'Computer Science',
      location: 'Berkeley, CA',
      graduationDate: '2021-05',
      gpa: '3.72',
      isHidden: false,
    }
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'DevSync IDE Extension',
      roleOrTech: 'TypeScript, VS Code API, Node.js',
      link: 'github.com/alexmercer/devsync',
      bullets: [
        'Created a VS Code extension with over 15,000+ active downloads that streamlines collaborative git commit message writing.',
        'Leveraged WebSocket connections to enable real-time co-authoring metadata sharing directly within the editor workspace.'
      ],
      isHidden: false,
    },
    {
      id: 'proj-2',
      title: 'MicroCache',
      roleOrTech: 'Go, Redis, Docker',
      link: 'github.com/alexmercer/microcache',
      bullets: [
        'Developed an in-memory key-value caching daemon in Go that manages cache invalidation in under 2 milliseconds.',
        'Configured automated CI/CD pipeline using GitHub Actions to build, scan, and deploy Docker images to Docker Hub.'
      ],
      isHidden: false,
    }
  ],
  skills: [
    {
      id: 'skill-1',
      category: 'Languages',
      items: ['TypeScript', 'JavaScript', 'Go', 'Python', 'SQL', 'HTML/CSS'],
      isHidden: false,
    },
    {
      id: 'skill-2',
      category: 'Frameworks & Tools',
      items: ['React', 'Next.js', 'Node.js', 'Vite', 'PostgreSQL', 'Redis', 'Docker', 'Git', 'AWS'],
      isHidden: false,
    }
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'AWS Certified Developer – Associate',
      issuer: 'Amazon Web Services',
      date: '2023-08',
      link: 'aws.amazon.com/verification',
      isHidden: false,
    }
  ],
  customSections: [],
  typography: DEFAULT_TYPOGRAPHY,
  latexCode: '', // Will be compiled on load if empty
  activeTab: 'form',
  lastSaved: Date.now(),
});

export const loadResumes = (): Resume[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const sample = createSampleResume();
      saveResumes([sample]);
      return [sample];
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error loading resumes:', error);
    return [createSampleResume()];
  }
};

export const saveResumes = (resumes: Resume[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resumes));
  } catch (error) {
    console.error('Error saving resumes:', error);
  }
};

export const getActiveResumeId = (): string => {
  return localStorage.getItem(ACTIVE_KEY) || 'sample-software-engineer';
};

export const setActiveResumeId = (id: string) => {
  localStorage.setItem(ACTIVE_KEY, id);
};

export const loadJdText = (): string => {
  return localStorage.getItem(JD_KEY) || '';
};

export const saveJdText = (text: string) => {
  localStorage.setItem(JD_KEY, text);
};
