import type { Resume } from '../types';

export const escapeLatex = (text: string): string => {
  if (!text) return '';
  // Escapes LaTeX special characters: & % $ # _ { } ~ ^ \
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([&%$#_{}])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
};

const getFontFamilyLatex = (family: string): string => {
  switch (family) {
    case 'serif-garamond':
      return '\\usepackage{ebgaramond}';
    case 'serif-baskerville':
      return '\\usepackage{charter}'; // standard ATS serif
    case 'sans-inter':
      return '\\usepackage[sfdefault]{inter}';
    case 'sans-system':
      return '\\renewcommand{\\familydefault}{\\sfdefault}';
    default:
      return '\\usepackage{ebgaramond}';
  }
};

const getMarginLatex = (margin: number): string => {
  return `\\usepackage[empty]{geometry}
\\geometry{letterpaper, margin=${margin}in, top=${margin}in}`;
};

export const generateLatex = (resume: Resume): string => {
  const esc = escapeLatex;
  const p = resume.personalDetails;
  const t = resume.typography;

  // Header sections
  let latex = `%-------------------------
% Resume in LaTeX
% Author : ${p.name || 'Anonymous'}
% License : MIT
%------------------------

\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
${getMarginLatex(t.margins)}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{url}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\usepackage{xcolor}

% Font configurations
${getFontFamilyLatex(t.fontFamily)}

\\pagestyle{fancy}
\\fancyhf{} % clear all header and footer fields
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins
\\addtolength{\\oddsidemargin}{-0.15in}
\\addtolength{\\evensidemargin}{-0.15in}
\\addtolength{\\textwidth}{0.3in}
\\addtolength{\\topmargin}{-0.3in}
\\addtolength{\\textheight}{0.6in}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\cleanlook

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

% Ensure PDF is machine readable for ATS
\\pdfgentounicode=1

%-------------------------
% Custom commands
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small\\textbf{#1} & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%


\\begin{document}

%----------HEADING----------
\\begin{center}
    \\textbf{\\Huge \\scshape ${esc(p.name)}} \\\\ \\vspace{1pt}
    \\small ${esc(p.location)} $|$ ${esc(p.phone)} $|$ \\href{mailto:${esc(p.email)}}{\\underline{${esc(p.email)}}} $|$ 
    \\href{https://${esc(p.linkedin)}}{\\underline{linkedin}} $|$
    \\href{https://${esc(p.github)}}{\\underline{github}}
    ${p.website ? ` $|$ \\href{https://${esc(p.website)}}{\\underline{${esc(p.website)}}}` : ''}
\\end{center}

`;

  // Professional Summary
  if (resume.summary && resume.summary.trim() !== '') {
    latex += `%-----------SUMMARY-----------
\\section{Summary}
\\small{${esc(resume.summary)}}
\\vspace{5pt}

`;
  }

  // Experience Section
  const visibleExperience = resume.experience.filter(item => !item.isHidden);
  if (visibleExperience.length > 0) {
    latex += `%-----------EXPERIENCE-----------
\\section{Experience}
  \\resumeSubHeadingListStart
`;
    for (const exp of visibleExperience) {
      latex += `    \\resumeSubheading
      {${esc(exp.company)}}{${esc(exp.location)}}
      {${esc(exp.role)}}{${esc(exp.startDate)} -- ${esc(exp.endDate)}}
      \\resumeItemListStart
`;
      for (const bullet of exp.bullets) {
        if (bullet.trim() !== '') {
          latex += `        \\resumeItem{${esc(bullet)}}
`;
        }
      }
      latex += `      \\resumeItemListEnd

`;
    }
    latex += `  \\resumeSubHeadingListEnd
\\vspace{5pt}

`;
  }

  // Projects Section
  const visibleProjects = resume.projects.filter(item => !item.isHidden);
  if (visibleProjects.length > 0) {
    latex += `%-----------PROJECTS-----------
\\section{Projects}
  \\resumeSubHeadingListStart
`;
    for (const proj of visibleProjects) {
      latex += `    \\resumeProjectHeading
      {\\textbf{${esc(proj.title)}} $|$ \\emph{${esc(proj.roleOrTech)}}}{${esc(proj.link)}}
      \\resumeItemListStart
`;
      for (const bullet of proj.bullets) {
        if (bullet.trim() !== '') {
          latex += `        \\resumeItem{${esc(bullet)}}
`;
        }
      }
      latex += `      \\resumeItemListEnd

`;
    }
    latex += `  \\resumeSubHeadingListEnd
\\vspace{5pt}

`;
  }

  // Skills Section
  const visibleSkills = resume.skills.filter(item => !item.isHidden);
  if (visibleSkills.length > 0) {
    latex += `%-----------SKILLS-----------
\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
`;
    for (let i = 0; i < visibleSkills.length; i++) {
      const skill = visibleSkills[i];
      latex += `     \\textbf{${esc(skill.category)}}: ${esc(skill.items.join(', '))} ${i < visibleSkills.length - 1 ? '\\\\' : ''}
`;
    }
    latex += `    }}
 \\end{itemize}
\\vspace{5pt}

`;
  }

  // Education Section
  const visibleEducation = resume.education.filter(item => !item.isHidden);
  if (visibleEducation.length > 0) {
    latex += `%-----------EDUCATION-----------
\\section{Education}
  \\resumeSubHeadingListStart
`;
    for (const edu of visibleEducation) {
      const gpaStr = edu.gpa ? ` $|$ GPA: ${esc(edu.gpa)}` : '';
      latex += `    \\resumeSubheading
      {${esc(edu.institution)}}{${esc(edu.location)}}
      {${esc(edu.degree)} in ${esc(edu.major)}${gpaStr}}{${esc(edu.graduationDate)}}
`;
    }
    latex += `  \\resumeSubHeadingListEnd
\\vspace{5pt}

`;
  }

  // Certifications Section
  const visibleCertifications = resume.certifications.filter(item => !item.isHidden);
  if (visibleCertifications.length > 0) {
    latex += `%-----------CERTIFICATIONS-----------
\\section{Certifications}
  \\resumeSubHeadingListStart
`;
    for (const cert of visibleCertifications) {
      latex += `    \\resumeProjectHeading
      {\\textbf{${esc(cert.name)}} -- \\emph{${esc(cert.issuer)}}}{${esc(cert.date)}}
`;
    }
    latex += `  \\resumeSubHeadingListEnd
\\vspace{5pt}

`;
  }

  // Custom Sections
  const visibleCustom = resume.customSections.filter(item => !item.isHidden);
  if (visibleCustom.length > 0) {
    for (const custom of visibleCustom) {
      latex += `%-----------CUSTOM: ${custom.heading}-----------
\\section{${esc(custom.heading)}}
\\small{${esc(custom.content)}}
\\vspace{5pt}

`;
    }
  }

  latex += `\\end{document}
`;

  return latex;
};
