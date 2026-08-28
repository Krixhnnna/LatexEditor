export interface LatexError {
  line: number;
  message: string;
  severity: 'error' | 'warning';
}

export const validateLatex = (code: string): LatexError[] => {
  const errors: LatexError[] = [];
  const lines = code.split('\n');

  // Simple stack-based checking for braces {} and brackets []
  const braceStack: { char: string; line: number; index: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Parse characters to find unmatched brackets
    for (let j = 0; j < line.length; j++) {
      const char = line[j];

      // Ignore commented out characters
      if (char === '%' && (j === 0 || line[j - 1] !== '\\')) {
        break; // skip rest of the line
      }

      if (char === '{') {
        braceStack.push({ char: '{', line: lineNumber, index: j });
      } else if (char === '}') {
        const top = braceStack.pop();
        if (!top || top.char !== '{') {
          errors.push({
            line: lineNumber,
            message: `Extra closing brace '}' found.`,
            severity: 'error',
          });
          // Push back to try and align future ones
          if (top) braceStack.push(top);
        }
      } else if (char === '[') {
        braceStack.push({ char: '[', line: lineNumber, index: j });
      } else if (char === ']') {
        const top = braceStack.pop();
        if (!top || top.char !== '[') {
          errors.push({
            line: lineNumber,
            message: `Extra closing bracket ']' found.`,
            severity: 'error',
          });
          if (top) braceStack.push(top);
        }
      }
    }

    // Common command typos
    if (line.includes('\\begin') && !line.includes('{')) {
      errors.push({
        line: lineNumber,
        message: `Malformed \\begin command. Missing environment in braces, e.g., \\begin{itemize}.`,
        severity: 'error',
      });
    }
  }

  // Check for any unclosed braces
  while (braceStack.length > 0) {
    const unclosed = braceStack.pop();
    if (unclosed) {
      errors.push({
        line: unclosed.line,
        message: `Unclosed open '${unclosed.char}' character.`,
        severity: 'error',
      });
    }
  }

  // Warn if document tags are missing
  const codeHasBegin = code.includes('\\begin{document}');
  const codeHasEnd = code.includes('\\end{document}');
  if (!codeHasBegin) {
    errors.push({
      line: 1,
      message: `Missing '\\begin{document}' command in source.`,
      severity: 'warning',
    });
  }
  if (codeHasBegin && !codeHasEnd) {
    errors.push({
      line: lines.length,
      message: `Missing '\\end{document}' command at the end of the file.`,
      severity: 'warning',
    });
  }

  return errors;
};

// Strips LaTeX commands to compile a clean, plain text resume
export const stripLatexToPlainText = (latex: string): string => {
  if (!latex) return '';

  let text = latex;

  // Remove comments
  text = text.replace(/^[ \t]*%.*$/gm, ''); // whole line comments
  text = text.replace(/([^\\])%.*$/gm, '$1'); // end of line comments

  // Remove preamble (everything before \begin{document})
  const beginIndex = text.indexOf('\\begin{document}');
  if (beginIndex !== -1) {
    text = text.substring(beginIndex + '\\begin{document}'.length);
  }

  // Remove ending
  text = text.replace(/\\end{document}/g, '');

  // Replace common layout environments
  text = text.replace(/\\begin\{itemize\}/g, '');
  text = text.replace(/\\end\{itemize\}/g, '');
  text = text.replace(/\\begin\{center\}/g, '');
  text = text.replace(/\\end\{center\}/g, '');
  text = text.replace(/\\resumeSubHeadingListStart/g, '');
  text = text.replace(/\\resumeSubHeadingListEnd/g, '');
  text = text.replace(/\\resumeItemListStart/g, '');
  text = text.replace(/\\resumeItemListEnd/g, '');

  // Replace custom heading commands
  text = text.replace(
    /\\resumeSubheading\s*\{([^}]+)\}\s*\{([^}]+)\}\s*\{([^}]+)\}\s*\{([^}]+)\}/g,
    '\n$1 ($2)\n$3 | $4\n'
  );

  text = text.replace(
    /\\resumeProjectHeading\s*\{([^}]+)\}\s*\{([^}]+)\}/g,
    '\n$1 ($2)\n'
  );

  // Replace standard item formats
  text = text.replace(/\\resumeItem\s*\{([^}]+)\}/g, '  • $1');
  text = text.replace(/\\item/g, '  •');

  // Replace text formatting
  text = text.replace(/\\textbf\s*\{([^}]+)\}/g, '$1');
  text = text.replace(/\\textit\s*\{([^}]+)\}/g, '$1');
  text = text.replace(/\\underline\s*\{([^}]+)\}/g, '$1');
  text = text.replace(/\\emph\s*\{([^}]+)\}/g, '$1');
  text = text.replace(/\\Huge/g, '');
  text = text.replace(/\\Large/g, '');
  text = text.replace(/\\large/g, '');
  text = text.replace(/\\small/g, '');
  text = text.replace(/\\scshape/g, '');

  // Replace links
  text = text.replace(/\\href\s*\{([^}]+)\}\s*\{([^}]+)\}/g, '$2 ($1)');

  // Clean up divider lines and spaces
  text = text.replace(/\\section\s*\{([^}]+)\}/g, '\n====================\n$1\n====================\n');
  text = text.replace(/\\titlerule/g, '');
  text = text.replace(/\\vspace\s*\{([^}]+)\}/g, '');
  text = text.replace(/\\addtolength\s*\{([^}]+)\}\s*\{([^}]+)\}/g, '');
  text = text.replace(/\\pagestyle\s*\{([^}]+)\}/g, '');
  text = text.replace(/\\fancyhf\{\}/g, '');
  text = text.replace(/\\fancyfoot\{\}/g, '');
  text = text.replace(/\\urlstyle\s*\{([^}]+)\}/g, '');
  text = text.replace(/\\raggedbottom/g, '');
  text = text.replace(/\\raggedright/g, '');
  text = text.replace(/\\cleanlook/g, '');
  text = text.replace(/\\pdfgentounicode=\d+/g, '');
  text = text.replace(/\\titleformat[^{]*\{[^{]*\}\{[^{]*\}\{[^{]*\}\{[^{]*\}\{[^{]*\}(\[.*\])?/g, '');

  // Escape character replacements
  text = text.replace(/\\&/g, '&');
  text = text.replace(/\\%/g, '%');
  text = text.replace(/\\\$/g, '$');
  text = text.replace(/\\#/g, '#');
  text = text.replace(/\\_/g, '_');
  text = text.replace(/\\\{/g, '{');
  text = text.replace(/\\\}/g, '}');
  text = text.replace(/\\textbackslash\{\}/g, '\\');
  text = text.replace(/\\textasciitilde\{\}/g, '~');
  text = text.replace(/\\textasciicircum\{\}/g, '^');

  // Strip math syntax
  text = text.replace(/\$\|\$/g, '|');
  text = text.replace(/\$/g, '');

  // Collapse multiple empty lines
  text = text.replace(/\n\s*\n\s*\n+/g, '\n\n');

  return text.trim();
};

// Unescapes LaTeX formatting to raw text
export const unescapeLatex = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\\textbackslash\{\}/g, '\\')
    .replace(/\\([&%$#_{}])/g, '$1')
    .replace(/\\textasciitilde\{\}/g, '~')
    .replace(/\\textasciicircum\{\}/g, '^');
};

// Helper: extracts curly braces contents considering nested braces
const extractBraces = (text: string, count: number): string[] => {
  const results: string[] = [];
  let pos = 0;
  for (let i = 0; i < count; i++) {
    const start = text.indexOf('{', pos);
    if (start === -1) break;
    let braceCount = 1;
    let end = start + 1;
    while (braceCount > 0 && end < text.length) {
      if (text[end] === '{') braceCount++;
      else if (text[end] === '}') braceCount--;
      end++;
    }
    results.push(text.substring(start + 1, end - 1));
    pos = end;
  }
  return results;
};

// Helper: extract section body text
const getSectionText = (latex: string, heading: string): string => {
  const headingEscaped = heading.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const sectionRegex = new RegExp(`\\\\section\\s*\\{${headingEscaped}\\}([\\s\S]*?)(?=\\\\section|\\\\end\\{document\\}|$)`, 'i');
  const match = latex.match(sectionRegex);
  return match ? match[1] : '';
};

// Parses raw LaTeX text string back into structured Resume JSON data fields
export const parseLatexToResume = (latex: string, baseResume: any): any => {
  const resume = JSON.parse(JSON.stringify(baseResume)); // deep clone
  
  // 1. Personal Details parsing
  const centerMatch = latex.match(/\\begin\{center\}([\s\S]*?)\\end\{center\}/i);
  const headerSearchBlock = centerMatch ? centerMatch[1] : latex.substring(0, Math.min(2500, latex.length));
  
  // Name
  const nameMatch = headerSearchBlock.match(/\\textbf\s*\{\\Huge\s*(?:\\scshape)?\s*([^{}]+)\}/i);
  if (nameMatch) {
    resume.personalDetails.name = unescapeLatex(nameMatch[1].trim());
  }

  // Location, email, phone, links
  const smallMatch = headerSearchBlock.match(/\\small\s*([^\n]+)/i);
  if (smallMatch) {
    const detailsLine = smallMatch[1];
    const segments = detailsLine.split(/(?:\$\|\$|\||\\cdot|\\bullet)/).map(s => s.trim());
    
    for (const segment of segments) {
      if (!segment) continue;
      
      // Email
      if (segment.includes('@')) {
        const emailMatch = segment.match(/(?:mailto:)?([\w.\-]+@[\w.\-]+\.[\w]+)/i);
        if (emailMatch) {
          resume.personalDetails.email = emailMatch[1];
        }
      } 
      // LinkedIn
      else if (segment.includes('linkedin.com') || segment.includes('linkedin')) {
        const lnMatch = segment.match(/href\s*\{[^{}]*linkedin\.com\/in\/([^{}]+)\}/i) || segment.match(/linkedin\.com\/in\/([^\s}]+)/i);
        resume.personalDetails.linkedin = lnMatch ? `linkedin.com/in/${lnMatch[1]}` : 'linkedin.com/in/username';
      } 
      // GitHub
      else if (segment.includes('github.com') || segment.includes('github')) {
        const ghMatch = segment.match(/href\s*\{[^{}]*github\.com\/([^{}]+)\}/i) || segment.match(/github\.com\/([^\s}]+)/i);
        resume.personalDetails.github = ghMatch ? `github.com/${ghMatch[1]}` : 'github.com/username';
      } 
      // Website
      else if (segment.includes('http') || segment.includes('.com') || segment.includes('.dev') || segment.includes('.io') || segment.includes('.me')) {
        const webMatch = segment.match(/href\s*\{https?:\/\/([^{}]+)\}/i) || segment.match(/href\s*\{([^{}]+)\}/i);
        resume.personalDetails.website = webMatch ? webMatch[1] : 'portfolio.com';
      } 
      // Phone
      else if (segment.match(/[\d+\-()\s]{7,}/)) {
        resume.personalDetails.phone = unescapeLatex(segment.replace(/\\underline\{([^}]+)\}/, '$1').trim());
      } 
      // Remaining is location
      else if (segment.length > 3 && !segment.includes('\\')) {
        resume.personalDetails.location = unescapeLatex(segment.trim());
      }
    }
  }

  // 2. Summary parsing
  const summaryText = getSectionText(latex, 'Summary');
  if (summaryText.trim()) {
    let cleanSummary = summaryText.trim();
    // Strip \small{...} if present
    if (cleanSummary.startsWith('\\small{') && cleanSummary.endsWith('}')) {
      cleanSummary = cleanSummary.substring(7, cleanSummary.length - 1);
    } else if (cleanSummary.startsWith('\\small') && cleanSummary.startsWith('\\small{')) {
      const braces = extractBraces(cleanSummary, 1);
      if (braces.length > 0) cleanSummary = braces[0];
    }
    resume.summary = unescapeLatex(cleanSummary.replace(/\\vspace\{[^}]*\}/g, '').trim());
  }

  // 3. Experience parsing
  const expText = getSectionText(latex, 'Experience');
  if (expText.trim()) {
    const expBlocks = expText.split('\\resumeSubheading').slice(1);
    const parsedExp = expBlocks.map((block, idx) => {
      const args = extractBraces(block, 4);
      const company = args.length > 0 ? unescapeLatex(args[0].trim()) : '';
      const location = args.length > 1 ? unescapeLatex(args[1].trim()) : '';
      const role = args.length > 2 ? unescapeLatex(args[2].trim()) : '';
      
      const datesRaw = args.length > 3 ? unescapeLatex(args[3].trim()) : '';
      const dateParts = datesRaw.split(/--|–|-/).map(d => d.trim());
      const startDate = dateParts.length > 0 ? dateParts[0] : '';
      const endDate = dateParts.length > 1 ? dateParts[1] : '';

      // Bullets extraction
      const bullets: string[] = [];
      let pos = 0;
      while (true) {
        const itemIdx = block.indexOf('\\resumeItem', pos);
        if (itemIdx === -1) break;
        const braces = extractBraces(block.substring(itemIdx), 1);
        if (braces.length > 0) {
          bullets.push(unescapeLatex(braces[0].trim()));
        }
        pos = itemIdx + 11;
      }

      return {
        id: `exp-${Date.now()}-${idx}`,
        company,
        role,
        location,
        startDate,
        endDate,
        bullets: bullets.length > 0 ? bullets : [''],
        isHidden: false
      };
    });

    if (parsedExp.length > 0) {
      resume.experience = parsedExp;
    }
  }

  // 4. Projects parsing
  const projText = getSectionText(latex, 'Projects');
  if (projText.trim()) {
    const projBlocks = projText.split('\\resumeProjectHeading').slice(1);
    const parsedProj = projBlocks.map((block, idx) => {
      const args = extractBraces(block, 2);
      const headerCombined = args.length > 0 ? args[0] : '';
      const link = args.length > 1 ? unescapeLatex(args[1].trim()) : '';

      // Parse title and role/tech from header
      // e.g. \textbf{Title} $|$ \emph{Tech}
      let title = '';
      let roleOrTech = '';

      const boldMatch = headerCombined.match(/\\textbf\{([^}]+)\}/);
      if (boldMatch) {
        title = unescapeLatex(boldMatch[1].trim());
      }
      const emphMatch = headerCombined.match(/\\emph\{([^}]+)\}/);
      if (emphMatch) {
        roleOrTech = unescapeLatex(emphMatch[1].trim());
      }

      if (!title && headerCombined) {
        const parts = headerCombined.split(/(?:\$\|\$|\||--)/).map(p => p.replace(/\\[\w]+/g, '').replace(/[{}]/g, '').trim());
        title = unescapeLatex(parts[0]);
        if (parts.length > 1) roleOrTech = unescapeLatex(parts[1]);
      }

      // Bullets extraction
      const bullets: string[] = [];
      let pos = 0;
      while (true) {
        const itemIdx = block.indexOf('\\resumeItem', pos);
        if (itemIdx === -1) break;
        const braces = extractBraces(block.substring(itemIdx), 1);
        if (braces.length > 0) {
          bullets.push(unescapeLatex(braces[0].trim()));
        }
        pos = itemIdx + 11;
      }

      return {
        id: `proj-${Date.now()}-${idx}`,
        title,
        roleOrTech,
        link,
        bullets: bullets.length > 0 ? bullets : [''],
        isHidden: false
      };
    });

    if (parsedProj.length > 0) {
      resume.projects = parsedProj;
    }
  }

  // 5. Skills parsing
  const skillsText = getSectionText(latex, 'Technical Skills') || getSectionText(latex, 'Skills');
  if (skillsText.trim()) {
    const skillLines = skillsText.matchAll(/\\textbf\{([^}]+)\}:\s*([^\n\\]+)/g);
    const parsedSkills = [];
    let idx = 0;
    for (const match of skillLines) {
      const category = unescapeLatex(match[1].trim());
      const items = unescapeLatex(match[2].trim())
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      
      parsedSkills.push({
        id: `skill-${Date.now()}-${idx++}`,
        category,
        items,
        isHidden: false
      });
    }

    if (parsedSkills.length > 0) {
      resume.skills = parsedSkills;
    }
  }

  // 6. Education parsing
  const eduText = getSectionText(latex, 'Education');
  if (eduText.trim()) {
    const eduBlocks = eduText.split('\\resumeSubheading').slice(1);
    const parsedEdu = eduBlocks.map((block, idx) => {
      const args = extractBraces(block, 3);
      const institution = args.length > 0 ? unescapeLatex(args[0].trim()) : '';
      const location = args.length > 1 ? unescapeLatex(args[1].trim()) : '';
      const degreeLine = args.length > 2 ? args[2] : '';
      
      // Parse degree line (e.g. B.S. in Computer Science $|$ GPA: 3.8)
      let degree = '';
      let major = '';
      let gpa = '';

      const segments = degreeLine.split(/(?:\$\|\$|\|)/).map(s => s.trim());
      
      // Degree in Major
      const degreeInMajor = segments[0] || '';
      const inIdx = degreeInMajor.toLowerCase().indexOf(' in ');
      if (inIdx !== -1) {
        degree = unescapeLatex(degreeInMajor.substring(0, inIdx).trim());
        major = unescapeLatex(degreeInMajor.substring(inIdx + 4).trim());
      } else {
        degree = unescapeLatex(degreeInMajor.trim());
      }

      // Clean up font decorators from degree/major
      degree = degree.replace(/\\[\w]+/g, '').replace(/[{}]/g, '').trim();
      major = major.replace(/\\[\w]+/g, '').replace(/[{}]/g, '').trim();

      // GPA
      const gpaSegment = segments.find(s => s.toLowerCase().includes('gpa'));
      if (gpaSegment) {
        const scoreMatch = gpaSegment.match(/(?:GPA:?\s*)?([\d.]+)/i);
        if (scoreMatch) gpa = scoreMatch[1];
      }

      const dateArgs = extractBraces(block.substring(block.indexOf(degreeLine)), 1);
      const graduationDate = dateArgs.length > 0 ? unescapeLatex(dateArgs[0].trim()) : '';

      return {
        id: `edu-${Date.now()}-${idx}`,
        institution,
        degree,
        major,
        location,
        graduationDate,
        gpa,
        isHidden: false
      };
    });

    if (parsedEdu.length > 0) {
      resume.education = parsedEdu;
    }
  }

  // 7. Certifications parsing
  const certText = getSectionText(latex, 'Certifications');
  if (certText.trim()) {
    const certBlocks = certText.split('\\resumeProjectHeading').slice(1);
    const parsedCert = certBlocks.map((block, idx) => {
      const args = extractBraces(block, 2);
      const combined = args.length > 0 ? args[0] : '';
      const date = args.length > 1 ? unescapeLatex(args[1].trim()) : '';

      // Parse \textbf{NAME} -- \emph{ISSUER}
      let name = '';
      let issuer = '';

      const boldMatch = combined.match(/\\textbf\{([^}]+)\}/);
      if (boldMatch) {
        name = unescapeLatex(boldMatch[1].trim());
      }
      const emphMatch = combined.match(/\\emph\{([^}]+)\}/);
      if (emphMatch) {
        issuer = unescapeLatex(emphMatch[1].trim());
      }

      if (!name && combined) {
        const parts = combined.split(/--|-/).map(p => p.replace(/\\[\w]+/g, '').replace(/[{}]/g, '').trim());
        name = unescapeLatex(parts[0]);
        if (parts.length > 1) issuer = unescapeLatex(parts[1]);
      }

      return {
        id: `cert-${Date.now()}-${idx}`,
        name,
        issuer,
        date,
        link: '',
        isHidden: false
      };
    });

    if (parsedCert.length > 0) {
      resume.certifications = parsedCert;
    }
  }

  // 8. Custom Sections parsing
  const allSections = [...latex.matchAll(/\\section\s*\{([^}]+)\}/g)].map(m => m[1]);
  const standardSections = ['Summary', 'Experience', 'Projects', 'Technical Skills', 'Skills', 'Education', 'Certifications'];
  const customSections = [];
  let customIdx = 0;
  for (const section of allSections) {
    if (!standardSections.includes(section)) {
      const content = getSectionText(latex, section);
      let cleanContent = content.trim();
      if (cleanContent.startsWith('\\small{') && cleanContent.endsWith('}')) {
        cleanContent = cleanContent.substring(7, cleanContent.length - 1);
      }
      customSections.push({
        id: `custom-${Date.now()}-${customIdx++}`,
        heading: section,
        content: unescapeLatex(cleanContent),
        isHidden: false
      });
    }
  }
  if (customSections.length > 0) {
    resume.customSections = customSections;
  }

  return resume;
};
