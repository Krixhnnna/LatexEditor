import type { Resume, AtsReport, AtsCheckRule } from '../types';

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'cant', 'cannot', 'could', 'couldnt', 'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont',
  'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadnt', 'has', 'hasnt', 'have',
  'havent', 'having', 'he', 'hed', 'hell', 'hes', 'her', 'here', 'heres', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'hows', 'i', 'id', 'ill', 'im', 'ive', 'if', 'in', 'into', 'is', 'isnt',
  'it', 'its', 'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself', 'no', 'nor', 'not',
  'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out',
  'over', 'own', 'same', 'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some',
  'such', 'than', 'that', 'thats', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there',
  'theres', 'these', 'they', 'theyd', 'theyll', 'theyre', 'theyve', 'this', 'those', 'through', 'to',
  'too', 'under', 'until', 'up', 'very', 'was', 'wasnt', 'we', 'wed', 'well', 'were', 'weve', 'werent',
  'what', 'whats', 'when', 'whens', 'where', 'wheres', 'which', 'while', 'who', 'whos', 'whom',
  'why', 'whys', 'with', 'wont', 'would', 'wouldnt', 'you', 'youd', 'youll', 'youre', 'youve', 'your',
  'yours', 'yourself', 'yourselves'
]);

// A pre-compiled list of common technical skills and keywords to extract from JDs
const TECH_KEYWORDS_DICTIONARY = [
  'react', 'angular', 'vue', 'typescript', 'javascript', 'python', 'go', 'golang', 'rust', 'c++', 'c#',
  'java', 'ruby', 'rails', 'php', 'laravel', 'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'graphql',
  'rest', 'api', 'node', 'nodejs', 'express', 'django', 'flask', 'spring', 'docker', 'kubernetes', 'aws',
  'azure', 'gcp', 'terraform', 'ansible', 'jenkins', 'git', 'github', 'gitlab', 'ci/cd', 'agile', 'scrum',
  'jira', 'figma', 'webpack', 'vite', 'tailwind', 'sass', 'css', 'html', 'nextjs', 'remix', 'svelte',
  'testing', 'jest', 'cypress', 'selenium', 'mocha', 'graphql', 'nosql', 'oracle', 'firebase', 'supabase',
  'microservices', 'serverless', 'lambda', 'linux', 'bash', 'hadoop', 'spark', 'kafka', 'elasticsearch'
];

export const calculateAtsScore = (resume: Resume, jdText: string = ''): AtsReport => {
  const checks: AtsCheckRule[] = [];

  // Gather text for analysis
  const p = resume.personalDetails;
  const resumeText = JSON.stringify(resume).toLowerCase();
  
  // Bullets aggregator
  const allBullets: string[] = [];
  resume.experience.forEach(e => !e.isHidden && allBullets.push(...e.bullets));
  resume.projects.forEach(p => !p.isHidden && allBullets.push(...p.bullets));

  // --- Rule 1: Contact Info Completeness ---
  let contactScore = 0;
  const contactMissing: string[] = [];
  if (p.name) contactScore += 3; else contactMissing.push('Name');
  if (p.email && p.email.includes('@') && p.email.includes('.')) contactScore += 3; else contactMissing.push('Email');
  if (p.phone && p.phone.replace(/[^0-9]/g, '').length >= 7) contactScore += 3; else contactMissing.push('Phone');
  if (p.linkedin && p.linkedin.toLowerCase().includes('linkedin.com')) contactScore += 3; else contactMissing.push('LinkedIn');
  if (p.github && p.github.toLowerCase().includes('github.com')) contactScore += 3; else contactMissing.push('GitHub');

  checks.push({
    id: 'contact_completeness',
    category: 'contact',
    title: 'Contact Information Completeness',
    status: contactScore === 15 ? 'pass' : contactScore >= 9 ? 'warn' : 'fail',
    points: contactScore,
    maxPoints: 15,
    detectedValue: contactScore === 15 ? 'All core contact fields present' : `Missing: ${contactMissing.join(', ')}`,
    rationale: 'ATS parsers and recruiters require standard contact fields (Name, Email, Phone, LinkedIn, GitHub) to index and reach you.'
  });

  // --- Rule 2: Sensitive PII Leak Checks ---
  const sensitiveTerms = [
    { term: 'ssn', label: 'Social Security Number (SSN)' },
    { term: 'social security', label: 'Social Security Number (SSN)' },
    { term: 'photo', label: 'Resume Photo Reference' },
    { term: 'marital status', label: 'Marital Status' },
    { term: 'single', label: 'Marital Status' },
    { term: 'married', label: 'Marital Status' },
    { term: 'age', label: 'Age' },
    { term: 'dob', label: 'Date of Birth' },
    { term: 'date of birth', label: 'Date of Birth' }
  ];

  const leakedPii: string[] = [];
  sensitiveTerms.forEach(item => {
    const regex = new RegExp(`\\b${item.term}\\b`, 'i');
    // We check if these strings exist in personal details or summary specifically
    if (regex.test(p.location) || regex.test(resume.summary)) {
      leakedPii.push(item.label);
    }
  });

  const piiPass = leakedPii.length === 0;
  checks.push({
    id: 'pii_leak',
    category: 'contact',
    title: 'PII Protection (Anti-bias)',
    status: piiPass ? 'pass' : 'fail',
    points: piiPass ? 10 : 0,
    maxPoints: 10,
    detectedValue: piiPass ? 'No sensitive PII details detected' : `Detected potential PII: ${leakedPii.join(', ')}`,
    rationale: 'To prevent bias and comply with compliance checks, modern resumes should omit photos, marital status, age, or SSNs.'
  });

  // --- Rule 3: Summary Length Check ---
  const summaryWordCount = resume.summary ? resume.summary.trim().split(/\s+/).filter(Boolean).length : 0;
  let summaryStatus: 'pass' | 'warn' | 'fail' = 'pass';
  let summaryPoints = 10;
  
  if (summaryWordCount === 0) {
    summaryStatus = 'warn';
    summaryPoints = 5;
  } else if (summaryWordCount < 35 || summaryWordCount > 120) {
    summaryStatus = 'warn';
    summaryPoints = 7;
  }

  checks.push({
    id: 'summary_length',
    category: 'summary',
    title: 'Professional Summary Word Count',
    status: summaryStatus,
    points: summaryPoints,
    maxPoints: 10,
    detectedValue: summaryWordCount === 0 ? 'No summary present' : `${summaryWordCount} words`,
    rationale: 'An optimal professional summary should be concise yet impactful, ranging between 35 and 120 words.'
  });

  // --- Rule 4: Pronouns check (First-person tone) ---
  const personalPronouns = /\b(I|me|my|myself|we|us|our|ourselves)\b/gi;
  const pronounMatches = resumeText.match(personalPronouns) || [];
  const pronounCount = pronounMatches.length;

  let pronounStatus: 'pass' | 'warn' | 'fail' = 'pass';
  let pronounPoints = 15;
  if (pronounCount > 0) {
    pronounStatus = pronounCount <= 2 ? 'warn' : 'fail';
    pronounPoints = pronounCount <= 2 ? 10 : 0;
  }

  checks.push({
    id: 'pronoun_check',
    category: 'experience',
    title: 'Professional Tone (Third Person)',
    status: pronounStatus,
    points: pronounPoints,
    maxPoints: 15,
    detectedValue: pronounCount === 0 ? 'Written in implicit third-person' : `Found ${pronounCount} first-person pronoun(s)`,
    rationale: 'ATS resumes should avoid first-person pronouns ("I", "my", "we"). Start sentences directly with action verbs (e.g. "Developed..." instead of "I developed...").'
  });

  // --- Rule 5: Quantifiable Achievements Check ---
  const metricsRegex = /\b\d+(\.\d+)?%?|\$\d+(\.\d+)?\b|\b\d+\s*(million|billion|k|percent|members|users|engineers|developer|hours|days|months)\b/gi;
  let bulletsWithMetrics = 0;
  let totalBulletsChecked = allBullets.length;

  allBullets.forEach(bullet => {
    if (metricsRegex.test(bullet)) {
      bulletsWithMetrics++;
    }
  });

  const metricRatio = totalBulletsChecked > 0 ? bulletsWithMetrics / totalBulletsChecked : 0;
  let metricsStatus: 'pass' | 'warn' | 'fail' = 'pass';
  let metricsPoints = 20;

  if (totalBulletsChecked === 0) {
    metricsStatus = 'fail';
    metricsPoints = 0;
  } else if (metricRatio < 0.3) {
    metricsStatus = 'fail';
    metricsPoints = 5;
  } else if (metricRatio < 0.5) {
    metricsStatus = 'warn';
    metricsPoints = 12;
  }

  checks.push({
    id: 'metrics_check',
    category: 'experience',
    title: 'Quantified Achievements',
    status: metricsStatus,
    points: metricsPoints,
    maxPoints: 20,
    detectedValue: totalBulletsChecked === 0 ? 'No achievements listed' : `${bulletsWithMetrics} of ${totalBulletsChecked} bullets include metrics (${Math.round(metricRatio * 100)}%)`,
    rationale: 'Recruiters and ATS favor bullet points that quantify impact with metrics, statistics, percentage increases, or dollar valuations.'
  });

  // --- Rule 6: Action-Verb-Led Bullets ---
  const weakStarters = [
    'responsible for', 'duties included', 'worked on', 'helped with', 'assisted in',
    'handled', 'part of a team that', 'served as', 'managed', 'managed the'
  ];

  let weakBulletCount = 0;
  allBullets.forEach(bullet => {
    const cleanBullet = bullet.trim().toLowerCase();
    for (const weak of weakStarters) {
      if (cleanBullet.startsWith(weak)) {
        weakBulletCount++;
        break;
      }
    }
  });

  let verbStatus: 'pass' | 'warn' | 'fail' = 'pass';
  let verbPoints = 15;
  if (totalBulletsChecked === 0) {
    verbStatus = 'fail';
    verbPoints = 0;
  } else if (weakBulletCount > 0) {
    verbStatus = weakBulletCount <= 2 ? 'warn' : 'fail';
    verbPoints = weakBulletCount <= 2 ? 10 : 3;
  }

  checks.push({
    id: 'verb_check',
    category: 'experience',
    title: 'Strong Action Verbs',
    status: verbStatus,
    points: verbPoints,
    maxPoints: 15,
    detectedValue: weakBulletCount === 0 ? 'All bullets start strong' : `Found ${weakBulletCount} weak starting phrases`,
    rationale: 'Avoid passive starter phrases like "Responsible for". Use active, operational verbs (e.g., "Led", "Architected", "Spearheaded") to denote ownership.'
  });

  // --- Rule 7: Section Header Naming Check ---
  const standardHeaders = new Set(['summary', 'experience', 'work history', 'projects', 'technical skills', 'skills', 'education', 'certifications', 'leadership', 'honors']);
  let badHeadersCount = 0;
  const badHeaders: string[] = [];

  if (resume.experience.length > 0 && !standardHeaders.has('experience')) { /* dummy check */ }
  // Let's check sections in resume
  const headingsToCheck: string[] = [];
  if (resume.experience.length > 0) headingsToCheck.push('experience');
  if (resume.projects.length > 0) headingsToCheck.push('projects');
  if (resume.skills.length > 0) headingsToCheck.push('technical skills');
  if (resume.education.length > 0) headingsToCheck.push('education');
  if (resume.certifications.length > 0) headingsToCheck.push('certifications');
  resume.customSections.forEach(c => headingsToCheck.push(c.heading.toLowerCase()));

  headingsToCheck.forEach(h => {
    let matched = false;
    standardHeaders.forEach(sh => {
      if (h.includes(sh) || sh.includes(h)) matched = true;
    });
    if (!matched) {
      badHeadersCount++;
      badHeaders.push(h);
    }
  });

  let headerStatus: 'pass' | 'warn' | 'fail' = 'pass';
  let headerPoints = 15;
  if (badHeadersCount > 0) {
    headerStatus = 'warn';
    headerPoints = 10;
  }

  checks.push({
    id: 'header_naming',
    category: 'formatting',
    title: 'Standard Section Headers',
    status: headerStatus,
    points: headerPoints,
    maxPoints: 15,
    detectedValue: badHeadersCount === 0 ? 'All section headers standard' : `Non-standard headers: ${badHeaders.join(', ')}`,
    rationale: 'ATS parsers map sections to databases based on key headings. Cutesy or customized headings (e.g., "Where I\'ve Been") confuse parsing structures.'
  });

  // Calculate overall score from checkpoints
  const totalPoints = checks.reduce((sum, c) => sum + c.points, 0);
  const maxPossiblePoints = checks.reduce((sum, c) => sum + c.maxPoints, 0);
  const rawOverall = Math.round((totalPoints / maxPossiblePoints) * 100);

  // Readiness label
  let readinessLabel: AtsReport['readinessLabel'] = 'Needs Work';
  if (rawOverall >= 90) readinessLabel = 'Exceptional';
  else if (rawOverall >= 75) readinessLabel = 'Good';
  else if (rawOverall < 50) readinessLabel = 'Critical';

  // --- Keyword Matcher (JD Analysis) ---
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];
  let keywordScore = 0;

  if (jdText && jdText.trim() !== '') {
    const jdClean = jdText.toLowerCase();
    
    // Find tech keywords inside the JD
    const jdKeywords = new Set<string>();
    
    // Scan standard technical words dictionary
    TECH_KEYWORDS_DICTIONARY.forEach(word => {
      const regex = new RegExp(`\\b${word.replace('+', '\\+')}\\b`, 'i');
      if (regex.test(jdClean)) {
        jdKeywords.add(word);
      }
    });

    // Also parse JD text to find other potential nouns/keywords
    const jdWords = jdClean.split(/[^a-zA-Z+#]+/);
    jdWords.forEach(word => {
      if (word.length > 2 && !STOP_WORDS.has(word) && !jdKeywords.has(word)) {
        // If it starts with upper case in the original (we don't have original easily, so check common indicators)
        // For simplicity, we stick to our comprehensive dictionary and add matches of frequency
      }
    });

    if (jdKeywords.size > 0) {
      jdKeywords.forEach(kw => {
        // Escaping for regex safety
        const escapedKw = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedKw}\\b`, 'i');
        if (regex.test(resumeText)) {
          matchedKeywords.push(kw);
        } else {
          missingKeywords.push(kw);
        }
      });

      keywordScore = Math.round((matchedKeywords.length / jdKeywords.size) * 100);
    }
  }

  return {
    overallScore: rawOverall,
    readinessLabel,
    checks,
    keywordMatch: {
      score: keywordScore,
      matched: matchedKeywords,
      missing: missingKeywords
    }
  };
};
