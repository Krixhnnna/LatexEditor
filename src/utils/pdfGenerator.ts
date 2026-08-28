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

export const generatePdf = async (resume: Resume): Promise<{ pdfBytes: Uint8Array; pageCount: number }> => {
  const pdfDoc = await PDFDocument.create();

  // Typography details
  const t = resume.typography;
  const paperWidth = t.paperSize === 'a4' ? 595.27 : 612.0; // 210mm vs 8.5in
  const paperHeight = t.paperSize === 'a4' ? 841.89 : 792.0; // 297mm vs 11in
  const marginPoints = t.margins * 72; // e.g. 0.5" -> 36pt, 0.75" -> 54pt

  // Load fonts
  const isSerif = t.fontFamily.startsWith('serif');
  const fontRegular = await pdfDoc.embedStandardFont(isSerif ? StandardFonts.TimesRoman : StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedStandardFont(isSerif ? StandardFonts.TimesRomanBold : StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedStandardFont(isSerif ? StandardFonts.TimesRomanItalic : StandardFonts.HelveticaOblique);

  // Spacing details
  let spacingFactor = 1.0;
  if (t.spacing === 'compact') spacingFactor = 0.85;
  if (t.spacing === 'relaxed') spacingFactor = 1.25;

  const baseFontSize = t.fontSize; // e.g. 10, 11, 12
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
    fontSize: baseFontSize,
    lineHeight: baseFontSize * 1.25 * spacingFactor,
    bulletSpacing: baseFontSize * 0.4,
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

  // 1. Draw Heading Block
  const p = resume.personalDetails;
  ctx.y -= ctx.lineHeight * 0.5;

  // Name
  if (p.name) {
    const nameSize = ctx.fontSize * 1.8;
    drawCenteredText(p.name, nameSize, ctx.fontBold);
    ctx.y -= nameSize * 1.1;
  }

  // Contact Info
  const contactLines: string[] = [];
  if (p.location) contactLines.push(p.location);
  if (p.phone) contactLines.push(p.phone);
  if (p.email) contactLines.push(p.email);
  const contactStr1 = contactLines.join('  |  ');

  const linkLines: string[] = [];
  if (p.linkedin) linkLines.push(p.linkedin.replace(/^(https?:\/\/)?(www\.)?/, ''));
  if (p.github) linkLines.push(p.github.replace(/^(https?:\/\/)?(www\.)?/, ''));
  if (p.website) linkLines.push(p.website.replace(/^(https?:\/\/)?(www\.)?/, ''));
  const contactStr2 = linkLines.join('  |  ');

  if (contactStr1) {
    drawCenteredText(contactStr1, ctx.fontSize * 0.85, ctx.fontRegular);
    ctx.y -= ctx.lineHeight * 0.85;
  }
  if (contactStr2) {
    drawCenteredText(contactStr2, ctx.fontSize * 0.85, ctx.fontRegular);
    ctx.y -= ctx.lineHeight * 0.85;
  }

  ctx.y -= ctx.lineHeight * 0.25;

  // 2. Summary
  if (resume.summary && resume.summary.trim() !== '') {
    drawSectionHeader('Summary');
    ensureSpace(ctx.lineHeight * 1.5);

    const maxWidth = ctx.width - ctx.margin * 2;
    const lines = wrapText(resume.summary, ctx.fontRegular, ctx.fontSize - 0.5, maxWidth);
    for (const line of lines) {
      ensureSpace(ctx.lineHeight);
      ctx.page.drawText(line, {
        x: ctx.margin,
        y: ctx.y,
        size: ctx.fontSize - 0.5,
        font: ctx.fontRegular,
        color: rgb(0.15, 0.15, 0.15),
      });
      ctx.y -= ctx.lineHeight;
    }
  }

  // 3. Experience
  const visibleExperience = resume.experience.filter(item => !item.isHidden);
  if (visibleExperience.length > 0) {
    drawSectionHeader('Experience');

    for (const exp of visibleExperience) {
      ensureSpace(ctx.lineHeight * 2.2);

      // Row 1: Company + Location
      ctx.page.drawText(exp.company, {
        x: ctx.margin,
        y: ctx.y,
        size: ctx.fontSize,
        font: ctx.fontBold,
      });

      const locWidth = ctx.fontRegular.widthOfTextAtSize(exp.location, ctx.fontSize);
      ctx.page.drawText(exp.location, {
        x: ctx.width - ctx.margin - locWidth,
        y: ctx.y,
        size: ctx.fontSize,
        font: ctx.fontRegular,
      });

      ctx.y -= ctx.lineHeight;

      // Row 2: Role + Dates
      ctx.page.drawText(exp.role, {
        x: ctx.margin,
        y: ctx.y,
        size: ctx.fontSize - 0.5,
        font: ctx.fontItalic,
      });

      const dateStr = `${exp.startDate} -- ${exp.endDate}`;
      const dateWidth = ctx.fontRegular.widthOfTextAtSize(dateStr, ctx.fontSize - 0.5);
      ctx.page.drawText(dateStr, {
        x: ctx.width - ctx.margin - dateWidth,
        y: ctx.y,
        size: ctx.fontSize - 0.5,
        font: ctx.fontRegular,
      });

      ctx.y -= ctx.lineHeight * 0.8;

      // Bullets
      const maxWidth = ctx.width - ctx.margin * 2 - 12; // indentation
      for (const bullet of exp.bullets) {
        if (!bullet.trim()) continue;

        const bulletLines = wrapText(bullet, ctx.fontRegular, ctx.fontSize - 0.5, maxWidth);
        for (let i = 0; i < bulletLines.length; i++) {
          ensureSpace(ctx.lineHeight);

          // Draw bullet point indicator on first line
          if (i === 0) {
            ctx.page.drawText('•', {
              x: ctx.margin + 4,
              y: ctx.y,
              size: ctx.fontSize - 0.5,
              font: ctx.fontRegular,
            });
          }

          ctx.page.drawText(bulletLines[i], {
            x: ctx.margin + 12,
            y: ctx.y,
            size: ctx.fontSize - 0.5,
            font: ctx.fontRegular,
            color: rgb(0.15, 0.15, 0.15),
          });
          ctx.y -= ctx.lineHeight;
        }
      }
      ctx.y -= ctx.lineHeight * 0.2; // separation between jobs
    }
  }

  // 4. Projects
  const visibleProjects = resume.projects.filter(item => !item.isHidden);
  if (visibleProjects.length > 0) {
    drawSectionHeader('Projects');

    for (const proj of visibleProjects) {
      ensureSpace(ctx.lineHeight * 2.0);

      // Title + Tech stack (bold title, italic tech stack)
      const titleStr = proj.title;
      const techStr = proj.roleOrTech ? ` | ${proj.roleOrTech}` : '';

      ctx.page.drawText(titleStr, {
        x: ctx.margin,
        y: ctx.y,
        size: ctx.fontSize,
        font: ctx.fontBold,
      });

      const titleWidth = ctx.fontBold.widthOfTextAtSize(titleStr, ctx.fontSize);
      if (techStr) {
        ctx.page.drawText(techStr, {
          x: ctx.margin + titleWidth,
          y: ctx.y,
          size: ctx.fontSize - 0.5,
          font: ctx.fontItalic,
          color: rgb(0.3, 0.3, 0.3),
        });
      }

      // Link on the right
      const linkWidth = ctx.fontRegular.widthOfTextAtSize(proj.link, ctx.fontSize - 0.5);
      ctx.page.drawText(proj.link, {
        x: ctx.width - ctx.margin - linkWidth,
        y: ctx.y,
        size: ctx.fontSize - 0.5,
        font: ctx.fontRegular,
      });

      ctx.y -= ctx.lineHeight * 0.9;

      // Bullets
      const maxWidth = ctx.width - ctx.margin * 2 - 12;
      for (const bullet of proj.bullets) {
        if (!bullet.trim()) continue;

        const bulletLines = wrapText(bullet, ctx.fontRegular, ctx.fontSize - 0.5, maxWidth);
        for (let i = 0; i < bulletLines.length; i++) {
          ensureSpace(ctx.lineHeight);

          if (i === 0) {
            ctx.page.drawText('•', {
              x: ctx.margin + 4,
              y: ctx.y,
              size: ctx.fontSize - 0.5,
              font: ctx.fontRegular,
            });
          }

          ctx.page.drawText(bulletLines[i], {
            x: ctx.margin + 12,
            y: ctx.y,
            size: ctx.fontSize - 0.5,
            font: ctx.fontRegular,
            color: rgb(0.15, 0.15, 0.15),
          });
          ctx.y -= ctx.lineHeight;
        }
      }
      ctx.y -= ctx.lineHeight * 0.2;
    }
  }

  // 5. Skills
  const visibleSkills = resume.skills.filter(item => !item.isHidden);
  if (visibleSkills.length > 0) {
    drawSectionHeader('Technical Skills');

    for (const skill of visibleSkills) {
      ensureSpace(ctx.lineHeight * 1.2);

      const catText = `${skill.category}: `;
      const catWidth = ctx.fontBold.widthOfTextAtSize(catText, ctx.fontSize - 0.5);

      ctx.page.drawText(catText, {
        x: ctx.margin,
        y: ctx.y,
        size: ctx.fontSize - 0.5,
        font: ctx.fontBold,
      });

      const itemsText = skill.items.join(', ');
      const maxWidth = ctx.width - ctx.margin * 2 - catWidth;
      const skillLines = wrapText(itemsText, ctx.fontRegular, ctx.fontSize - 0.5, maxWidth);

      for (let i = 0; i < skillLines.length; i++) {
        if (i > 0) {
          ensureSpace(ctx.lineHeight);
        }
        ctx.page.drawText(skillLines[i], {
          x: i === 0 ? ctx.margin + catWidth : ctx.margin,
          y: ctx.y,
          size: ctx.fontSize - 0.5,
          font: ctx.fontRegular,
          color: rgb(0.15, 0.15, 0.15),
        });
        ctx.y -= ctx.lineHeight;
      }
      ctx.y -= ctx.lineHeight * 0.1;
    }
  }

  // 6. Education
  const visibleEducation = resume.education.filter(item => !item.isHidden);
  if (visibleEducation.length > 0) {
    drawSectionHeader('Education');

    for (const edu of visibleEducation) {
      ensureSpace(ctx.lineHeight * 2.2);

      // Institution + Location
      ctx.page.drawText(edu.institution, {
        x: ctx.margin,
        y: ctx.y,
        size: ctx.fontSize,
        font: ctx.fontBold,
      });

      const locWidth = ctx.fontRegular.widthOfTextAtSize(edu.location, ctx.fontSize);
      ctx.page.drawText(edu.location, {
        x: ctx.width - ctx.margin - locWidth,
        y: ctx.y,
        size: ctx.fontSize,
        font: ctx.fontRegular,
      });

      ctx.y -= ctx.lineHeight;

      // Degree/Major + GPA + Graduation Date
      const degreeStr = `${edu.degree} in ${edu.major}${edu.gpa ? ` (GPA: ${edu.gpa})` : ''}`;
      ctx.page.drawText(degreeStr, {
        x: ctx.margin,
        y: ctx.y,
        size: ctx.fontSize - 0.5,
        font: ctx.fontItalic,
      });

      const gradWidth = ctx.fontRegular.widthOfTextAtSize(edu.graduationDate, ctx.fontSize - 0.5);
      ctx.page.drawText(edu.graduationDate, {
        x: ctx.width - ctx.margin - gradWidth,
        y: ctx.y,
        size: ctx.fontSize - 0.5,
        font: ctx.fontRegular,
      });

      ctx.y -= ctx.lineHeight * 1.2;
    }
  }

  // 7. Certifications
  const visibleCertifications = resume.certifications.filter(item => !item.isHidden);
  if (visibleCertifications.length > 0) {
    drawSectionHeader('Certifications');

    for (const cert of visibleCertifications) {
      ensureSpace(ctx.lineHeight * 1.5);

      const titleStr = `${cert.name} -- `;
      const issuerStr = cert.issuer;

      ctx.page.drawText(titleStr, {
        x: ctx.margin,
        y: ctx.y,
        size: ctx.fontSize - 0.5,
        font: ctx.fontBold,
      });

      const titleWidth = ctx.fontBold.widthOfTextAtSize(titleStr, ctx.fontSize - 0.5);
      ctx.page.drawText(issuerStr, {
        x: ctx.margin + titleWidth,
        y: ctx.y,
        size: ctx.fontSize - 0.5,
        font: ctx.fontItalic,
      });

      const dateWidth = ctx.fontRegular.widthOfTextAtSize(cert.date, ctx.fontSize - 0.5);
      ctx.page.drawText(cert.date, {
        x: ctx.width - ctx.margin - dateWidth,
        y: ctx.y,
        size: ctx.fontSize - 0.5,
        font: ctx.fontRegular,
      });

      ctx.y -= ctx.lineHeight * 1.1;
    }
  }

  // 8. Custom Sections
  const visibleCustom = resume.customSections.filter(item => !item.isHidden);
  if (visibleCustom.length > 0) {
    for (const custom of visibleCustom) {
      if (!custom.heading || !custom.content) continue;

      drawSectionHeader(custom.heading);
      ensureSpace(ctx.lineHeight * 1.5);

      const maxWidth = ctx.width - ctx.margin * 2;
      const lines = wrapText(custom.content, ctx.fontRegular, ctx.fontSize - 0.5, maxWidth);
      for (const line of lines) {
        ensureSpace(ctx.lineHeight);
        ctx.page.drawText(line, {
          x: ctx.margin,
          y: ctx.y,
          size: ctx.fontSize - 0.5,
          font: ctx.fontRegular,
          color: rgb(0.15, 0.15, 0.15),
        });
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
