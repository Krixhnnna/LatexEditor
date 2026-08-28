import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib';
import type { Resume } from '../types';

interface LayoutContext {
  page: PDFPage;
  pdfDoc: PDFDocument;
  fontRegular: PDFFont;
  fontBold: PDFFont;
  fontItalic: PDFFont;
  width: number;
  height: number;
  margin: number;
  y: number;
  fontSize: number;
  lineHeight: number;
  bulletSpacing: number;
  spacingFactor: number;
  pages: PDFPage[];
  overflowWarning: boolean;
}

const wrapText = (text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (testWidth > maxWidth) {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
};

// Helper: unescapes LaTeX formatting to raw text
const unescapeLatex = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\\textbackslash\{\}/g, '\\')
    .replace(/\\([&%$#_{}])/g, '$1')
    .replace(/\\textasciitilde\{\}/g, '~')
    .replace(/\\textasciicircum\{\}/g, '^')
    .replace(/\\&/g, '&')
    .replace(/\\%/g, '%')
    .replace(/\\\$/g, '$')
    .replace(/\\#/g, '#')
    .replace(/\\_/g, '_')
    .replace(/\\\{/g, '{')
    .replace(/\\\}/g, '}');
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

export const generatePdf = async (resume: Resume): Promise<{ pdfBytes: Uint8Array; pageCount: number }> => {
  const pdfDoc = await PDFDocument.create();
  const latex = resume.latexCode || '';

  // 1. Detect typography and layout sizes from the LaTeX code!
  let fontFamily = 'serif';
  if (latex.includes('inter') || latex.includes('sans')) {
    fontFamily = 'sans';
  }

  let marginSize = 0.5; // default
  const marginMatch = latex.match(/margin\s*=\s*([\d.]+)\s*in/i);
  if (marginMatch) {
    marginSize = parseFloat(marginMatch[1]);
  }

  let fontSize = 11; // default
  const fontClassMatch = latex.match(/\\documentclass\[[^\]]*?(\d+)pt[^\]]*?\]/);
  if (fontClassMatch) {
    fontSize = parseInt(fontClassMatch[1]);
  }

  const paperWidth = latex.includes('a4paper') ? 595.27 : 612.0; // A4 vs Letter
  const paperHeight = latex.includes('a4paper') ? 841.89 : 792.0;
  const marginPoints = marginSize * 72;

  const fontRegular = await pdfDoc.embedStandardFont(fontFamily === 'serif' ? StandardFonts.TimesRoman : StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedStandardFont(fontFamily === 'serif' ? StandardFonts.TimesRomanBold : StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedStandardFont(fontFamily === 'serif' ? StandardFonts.TimesRomanItalic : StandardFonts.HelveticaOblique);

  let spacingFactor = 1.0;
  if (latex.includes('spacing=compact')) spacingFactor = 0.85;
  if (latex.includes('spacing=relaxed')) spacingFactor = 1.25;

  const ctx: LayoutContext = {
    pdfDoc,
    page: pdfDoc.addPage([paperWidth, paperHeight]),
    fontRegular,
    fontBold,
    fontItalic,
    width: paperWidth,
    height: paperHeight,
    margin: marginPoints,
    y: paperHeight - marginPoints,
    fontSize: fontSize,
    lineHeight: fontSize * 1.25 * spacingFactor,
    bulletSpacing: fontSize * 0.4,
    spacingFactor,
    pages: [],
    overflowWarning: false,
  };
  ctx.pages.push(ctx.page);

  // Helper to add a new page if we run out of vertical room
  const ensureSpace = (heightNeeded: number) => {
    const bottomLimit = ctx.margin;
    if (ctx.y - heightNeeded < bottomLimit) {
      ctx.page = ctx.pdfDoc.addPage([ctx.width, ctx.height]);
      ctx.pages.push(ctx.page);
      ctx.y = ctx.height - ctx.margin;
      ctx.overflowWarning = true;
    }
  };

  // Helper to draw centered text
  const drawCenteredText = (text: string, fontSize: number, font: PDFFont, yOffset = 0) => {
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const x = (ctx.width - textWidth) / 2;
    ctx.page.drawText(text, {
      x,
      y: ctx.y + yOffset,
      size: fontSize,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
  };

  // Helper to draw section header line
  const drawSectionHeader = (title: string) => {
    ensureSpace(ctx.lineHeight * 2.5);
    ctx.y -= ctx.lineHeight * 1.5;

    ctx.page.drawText(title.toUpperCase(), {
      x: ctx.margin,
      y: ctx.y,
      size: ctx.fontSize + 1,
      font: ctx.fontBold,
      color: rgb(0, 0, 0),
    });

    const lineY = ctx.y - 3;
    ctx.page.drawLine({
      start: { x: ctx.margin, y: lineY },
      end: { x: ctx.width - ctx.margin, y: lineY },
      thickness: 0.75,
      color: rgb(0.7, 0.7, 0.7),
    });

    ctx.y -= ctx.lineHeight * 0.9;
  };

  // 2. Parse LaTeX body
  const docStart = latex.indexOf('\\begin{document}');
  const docEnd = latex.indexOf('\\end{document}');
  const bodyText = docStart !== -1 
    ? latex.substring(docStart + 16, docEnd !== -1 ? docEnd : latex.length)
    : latex;

  const lines = bodyText.split('\n');
  let inCenter = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line || line.startsWith('%')) continue; // skip comments

    // Detect center environment
    if (line.includes('\\begin{center}')) {
      inCenter = true;
      continue;
    }
    if (line.includes('\\end{center}')) {
      inCenter = false;
      continue;
    }

    // Parse section heading
    if (line.startsWith('\\section{')) {
      const sectionName = extractBraces(line, 1)[0] || '';
      drawSectionHeader(unescapeLatex(sectionName));
      continue;
    }

    // Parse resumeSubheading
    if (line.includes('\\resumeSubheading')) {
      const args = extractBraces(line, 4);
      if (args.length > 0) {
        const company = unescapeLatex(args[0]);
        const location = unescapeLatex(args[1] || '');
        const role = unescapeLatex(args[2] || '');
        const dates = unescapeLatex(args[3] || '');

        ensureSpace(ctx.lineHeight * 2.2);
        // Row 1: Company + Location
        ctx.page.drawText(company, { x: ctx.margin, y: ctx.y, size: ctx.fontSize, font: ctx.fontBold });
        const locWidth = ctx.fontRegular.widthOfTextAtSize(location, ctx.fontSize);
        ctx.page.drawText(location, { x: ctx.width - ctx.margin - locWidth, y: ctx.y, size: ctx.fontSize, font: ctx.fontRegular });
        ctx.y -= ctx.lineHeight;

        // Row 2: Role + Dates
        ctx.page.drawText(role, { x: ctx.margin, y: ctx.y, size: ctx.fontSize - 0.5, font: ctx.fontItalic });
        const dateWidth = ctx.fontRegular.widthOfTextAtSize(dates, ctx.fontSize - 0.5);
        ctx.page.drawText(dates, { x: ctx.width - ctx.margin - dateWidth, y: ctx.y, size: ctx.fontSize - 0.5, font: ctx.fontRegular });
        ctx.y -= ctx.lineHeight * 0.8;
      }
      continue;
    }

    // Parse resumeProjectHeading
    if (line.includes('\\resumeProjectHeading')) {
      const args = extractBraces(line, 2);
      if (args.length > 0) {
        const titleTechCombined = args[0];
        const link = unescapeLatex(args[1] || '');

        let title = '';
        let tech = '';
        const boldMatch = titleTechCombined.match(/\\textbf\{([^}]+)\}/);
        if (boldMatch) title = unescapeLatex(boldMatch[1]);
        const emphMatch = titleTechCombined.match(/\\emph\{([^}]+)\}/) || titleTechCombined.match(/\\textit\{([^}]+)\}/);
        if (emphMatch) tech = unescapeLatex(emphMatch[1]);

        if (!title) {
          const parts = titleTechCombined.split(/(?:\$\|\$|\||--)/).map(p => p.replace(/\\[\w]+/g, '').replace(/[{}]/g, '').trim());
          title = unescapeLatex(parts[0]);
          if (parts.length > 1) tech = unescapeLatex(parts[1]);
        }

        ensureSpace(ctx.lineHeight * 1.5);
        ctx.page.drawText(title, { x: ctx.margin, y: ctx.y, size: ctx.fontSize, font: ctx.fontBold });
        const titleWidth = ctx.fontBold.widthOfTextAtSize(title, ctx.fontSize);
        if (tech) {
          ctx.page.drawText(` | ${tech}`, { x: ctx.margin + titleWidth, y: ctx.y, size: ctx.fontSize - 0.5, font: ctx.fontItalic, color: rgb(0.3, 0.3, 0.3) });
        }
        const linkWidth = ctx.fontRegular.widthOfTextAtSize(link, ctx.fontSize - 0.5);
        ctx.page.drawText(link, { x: ctx.width - ctx.margin - linkWidth, y: ctx.y, size: ctx.fontSize - 0.5, font: ctx.fontRegular });
        ctx.y -= ctx.lineHeight * 0.9;
      }
      continue;
    }

    // Parse resumeItem
    if (line.includes('\\resumeItem') || line.startsWith('\\item')) {
      let bulletText = '';
      if (line.includes('\\resumeItem')) {
        bulletText = extractBraces(line, 1)[0] || '';
      } else {
        bulletText = line.substring(5).trim();
      }
      bulletText = unescapeLatex(bulletText);

      if (bulletText) {
        const maxWidth = ctx.width - ctx.margin * 2 - 12;
        const bulletLines = wrapText(bulletText, ctx.fontRegular, ctx.fontSize - 0.5, maxWidth);
        for (let i = 0; i < bulletLines.length; i++) {
          ensureSpace(ctx.lineHeight);
          if (i === 0) {
            ctx.page.drawText('•', { x: ctx.margin + 4, y: ctx.y, size: ctx.fontSize - 0.5, font: ctx.fontRegular });
          }
          ctx.page.drawText(bulletLines[i], { x: ctx.margin + 12, y: ctx.y, size: ctx.fontSize - 0.5, font: ctx.fontRegular, color: rgb(0.15, 0.15, 0.15) });
          ctx.y -= ctx.lineHeight;
        }
      }
      continue;
    }

    // Center header parsing
    if (inCenter) {
      let cleanLine = line.replace(/\\\\/g, '').replace(/\\vspace\{[^}]*\}/g, '').trim();

      if (cleanLine.includes('\\Huge')) {
        const nameMatch = cleanLine.match(/\\textbf\s*\{\\Huge\s*(?:\\scshape)?\s*([^{}]+)\}/i) || cleanLine.match(/\\textbf\{([^}]+)\}/);
        const name = nameMatch ? unescapeLatex(nameMatch[1].trim()) : cleanLine.replace(/\\[\w]+/g, '').replace(/[{}]/g, '').trim();
        if (name) {
          const nameSize = ctx.fontSize * 1.8;
          ensureSpace(nameSize * 1.2);
          drawCenteredText(name, nameSize, ctx.fontBold);
          ctx.y -= nameSize * 1.1;
        }
      } else {
        let formattedLine = cleanLine
          .replace(/\\href\s*\{[^}]*\}\s*\{\\underline\{([^}]+)\}\}/g, '$1')
          .replace(/\\href\s*\{[^}]*\}\s*\{([^}]+)\}/g, '$1')
          .replace(/\\underline\{([^}]+)\}/g, '$1')
          .replace(/\\small/g, '')
          .replace(/[{}]/g, '')
          .replace(/\s*\$\|\$\s*/g, '  |  ')
          .replace(/\s*\|\s*/g, '  |  ')
          .trim();
        
        formattedLine = unescapeLatex(formattedLine);
        if (formattedLine) {
          ensureSpace(ctx.lineHeight);
          drawCenteredText(formattedLine, ctx.fontSize * 0.85, ctx.fontRegular);
          ctx.y -= ctx.lineHeight * 0.85;
        }
      }
      continue;
    }

    // Parse technical skills line
    if (line.includes('\\textbf{') && line.includes('}:')) {
      const catMatch = line.match(/\\textbf\{([^}]+)\}:/);
      if (catMatch) {
        const category = unescapeLatex(catMatch[1]);
        const items = unescapeLatex(line.substring(line.indexOf('}:') + 2).trim());

        ensureSpace(ctx.lineHeight * 1.2);
        const catText = `${category}: `;
        const catWidth = ctx.fontBold.widthOfTextAtSize(catText, ctx.fontSize - 0.5);
        ctx.page.drawText(catText, { x: ctx.margin, y: ctx.y, size: ctx.fontSize - 0.5, font: ctx.fontBold });

        const maxWidth = ctx.width - ctx.margin * 2 - catWidth;
        const skillLines = wrapText(items, ctx.fontRegular, ctx.fontSize - 0.5, maxWidth);
        for (let j = 0; j < skillLines.length; j++) {
          if (j > 0) ensureSpace(ctx.lineHeight);
          ctx.page.drawText(skillLines[j], { x: j === 0 ? ctx.margin + catWidth : ctx.margin, y: ctx.y, size: ctx.fontSize - 0.5, font: ctx.fontRegular, color: rgb(0.15, 0.15, 0.15) });
          ctx.y -= ctx.lineHeight;
        }
      }
      continue;
    }

    // Parse standard text paragraph
    let plainParagraph = line
      .replace(/\\small\{([^}]+)\}/g, '$1')
      .replace(/\\small/g, '')
      .replace(/[{}]/g, '')
      .trim();

    plainParagraph = unescapeLatex(plainParagraph);
    if (plainParagraph && !plainParagraph.startsWith('\\')) {
      const maxWidth = ctx.width - ctx.margin * 2;
      const wrapLines = wrapText(plainParagraph, ctx.fontRegular, ctx.fontSize - 0.5, maxWidth);
      for (const wl of wrapLines) {
        ensureSpace(ctx.lineHeight);
        ctx.page.drawText(wl, { x: ctx.margin, y: ctx.y, size: ctx.fontSize - 0.5, font: ctx.fontRegular, color: rgb(0.15, 0.15, 0.15) });
        ctx.y -= ctx.lineHeight;
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  return {
    pdfBytes,
    pageCount: ctx.pages.length,
  };
};
