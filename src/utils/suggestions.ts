export interface BulletSuggestion {
  original: string;
  suggested: string;
  explanation: string;
  metricSuggested: boolean;
}

const WEAK_REWRITES: { weak: string; strong: string; context: string }[] = [
  { weak: 'responsible for managing team', strong: 'Led a high-performing team of [number] engineers', context: 'Add team size and mention leadership impact' },
  { weak: 'responsible for managing', strong: 'Spearheaded the development and management of', context: 'Replace passive responsibility with active ownership' },
  { weak: 'duties included writing code', strong: 'Engineered clean, scalable code architectures', context: 'Use engineering verbs to specify value' },
  { weak: 'helped with database query speed', strong: 'Optimized PostgreSQL execution plans, reducing query latencies by [percentage]%', context: 'Suggest metric and exact action' },
  { weak: 'helped with', strong: 'Collaborated on the design and execution of', context: 'Replace "helped" with collaborative descriptors' },
  { weak: 'worked on front-end', strong: 'Developed responsive user interfaces using React and TypeScript, boosting engagement by [percentage]%', context: 'Define tech stack and user engagement metrics' },
  { weak: 'worked on', strong: 'Designed and deployed core modules for', context: 'Use action verbs' },
  { weak: 'assisted in writing tests', strong: 'Authored and automated [number]+ comprehensive unit tests', context: 'Highlight code reliability and volume' },
  { weak: 'assisted in', strong: 'Contributed key enhancements to', context: 'Show active contribution' },
  { weak: 'handled deployment', strong: 'Streamlined containerized deployment pipelines using Docker and CI/CD', context: 'Use DevOps terminology' },
  { weak: 'handled', strong: 'Managed and streamlined operations for', context: 'Show managerial ownership' },
];

const STRONG_VERBS = [
  'Architected', 'Spearheaded', 'Optimized', 'Engineered', 'Streamlined',
  'Automated', 'Collaborated', 'Designed', 'Launched', 'Pioneered',
  'Facilitated', 'Consolidated', 'Formulated', 'Conceptualized'
];

const METRIC_NUDGES = [
  'boosting deployment velocity by [X]%',
  'reducing service latencies by [X]%',
  'saving $[X] in monthly server costs',
  'supporting a user base of [X]+ active monthly users',
  'accelerating feature delivery timelines by [X]%',
  'cutting support ticket volume by [X]%'
];

export const getBulletSuggestions = (bullet: string): BulletSuggestion[] => {
  const suggestions: BulletSuggestion[] = [];
  const lowerBullet = bullet.trim().toLowerCase();

  if (!bullet.trim()) return [];

  // 1. Check for specific weak phrase replacements
  for (const rewrite of WEAK_REWRITES) {
    if (lowerBullet.includes(rewrite.weak)) {
      // Find where the weak phrase is and splice in the strong phrase
      const index = lowerBullet.indexOf(rewrite.weak);
      const remainder = bullet.substring(index + rewrite.weak.length).trim();
      const capitalizedStrong = rewrite.strong.charAt(0).toUpperCase() + rewrite.strong.slice(1);
      
      suggestions.push({
        original: bullet,
        suggested: `${capitalizedStrong} ${remainder}`,
        explanation: `${rewrite.context}. Replaced weak phrase "${rewrite.weak}" with "${rewrite.strong}".`,
        metricSuggested: rewrite.strong.includes('[')
      });
      break;
    }
  }

  // 2. If no specific rewrite, but starts with a weak phrase generally
  if (suggestions.length === 0) {
    const weakVerbs = ['managed', 'led', 'built', 'created', 'made', 'ran', 'did', 'improved', 'helped', 'assisted'];
    const firstWord = lowerBullet.split(/\s+/)[0];
    
    if (weakVerbs.includes(firstWord)) {
      const remainder = bullet.substring(bullet.indexOf(' ') + 1).trim();
      const suggestedVerb = STRONG_VERBS[Math.floor(Math.random() * STRONG_VERBS.length)];
      
      suggestions.push({
        original: bullet,
        suggested: `${suggestedVerb} ${remainder}`,
        explanation: `Replaced common verb "${firstWord}" with a stronger impact verb "${suggestedVerb}".`,
        metricSuggested: false
      });
    }
  }

  // 3. Nudge for metrics if no numbers/metrics detected
  const hasNumbers = /\b\d+%?|\$\d+\b/g.test(bullet);
  if (!hasNumbers) {
    const randomNudge = METRIC_NUDGES[Math.floor(Math.random() * METRIC_NUDGES.length)];
    const cleanBullet = bullet.endsWith('.') ? bullet.slice(0, -1) : bullet;
    
    suggestions.push({
      original: bullet,
      suggested: `${cleanBullet}, ${randomNudge}.`,
      explanation: 'Nudge: Add a quantified metric to show the scale and success of this achievement.',
      metricSuggested: true
    });
  }

  // Fallback default suggestion if nothing else generated
  if (suggestions.length === 0) {
    suggestions.push({
      original: bullet,
      suggested: `Spearheaded execution of: ${bullet}`,
      explanation: 'Prepend a strong leadership verb to convey ownership.',
      metricSuggested: false
    });
  }

  return suggestions;
};
