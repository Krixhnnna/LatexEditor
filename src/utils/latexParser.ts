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

// Strips LaTeX commands to compile a clean, plain text resume (for easy copy-pasting into plain text boxes)
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
  // \resumeSubheading{Company}{Location}{Role}{Dates}
  text = text.replace(
    /\\resumeSubheading\s*\{([^}]+)\}\s*\{([^}]+)\}\s*\{([^}]+)\}\s*\{([^}]+)\}/g,
    '\n$1 ($2)\n$3 | $4\n'
  );

  // \resumeProjectHeading{\textbf{Title} | \emph{Tech}}{Link}
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
