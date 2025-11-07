/**
 * Document Generator Service
 * Generates DOCX and PDF files from CV content
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface CVSections {
  summary?: string;
  experience: string[];
  education: string[];
  skills: string[];
}

/**
 * Generate a DOCX file from CV sections
 */
export async function generateCVDocx(
  name: string,
  email: string,
  sections: CVSections
): Promise<Buffer> {
  const children: Paragraph[] = [];

  // Header
  children.push(
    new Paragraph({
      text: name,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: email,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    })
  );

  // Summary
  if (sections.summary) {
    children.push(
      new Paragraph({
        text: 'Professional Summary',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        text: sections.summary,
        spacing: { after: 300 },
      })
    );
  }

  // Experience
  if (sections.experience?.length) {
    children.push(
      new Paragraph({
        text: 'Experience',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 100 },
      })
    );

    sections.experience.forEach((exp) => {
      children.push(
        new Paragraph({
          text: exp,
          spacing: { after: 200 },
          bullet: { level: 0 },
        })
      );
    });
  }

  // Education
  if (sections.education?.length) {
    children.push(
      new Paragraph({
        text: 'Education',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 100 },
      })
    );

    sections.education.forEach((edu) => {
      children.push(
        new Paragraph({
          text: edu,
          spacing: { after: 100 },
        })
      );
    });
  }

  // Skills
  if (sections.skills?.length) {
    children.push(
      new Paragraph({
        text: 'Skills',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        text: sections.skills.join(', '),
        spacing: { after: 200 },
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

/**
 * Generate a PDF file from CV text
 */
export async function generateCVPdf(
  name: string,
  email: string,
  cvText: string
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 50;
  const margin = 50;
  const maxWidth = width - 2 * margin;

  // Draw name (title)
  page.drawText(name, {
    x: margin,
    y,
    size: 20,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  y -= 30;

  // Draw email
  page.drawText(email, {
    x: margin,
    y,
    size: 12,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 40;

  // Draw CV content
  const lines = cvText.split('\n');
  const fontSize = 11;
  const lineHeight = fontSize + 4;

  for (const line of lines) {
    if (y < margin + 20) {
      // Need a new page
      const newPage = pdfDoc.addPage([595.28, 841.89]);
      y = height - 50;
    }

    const trimmedLine = line.trim();
    if (!trimmedLine) {
      y -= lineHeight / 2;
      continue;
    }

    // Check if line is a heading (all caps or starts with specific words)
    const isHeading =
      trimmedLine === trimmedLine.toUpperCase() &&
      trimmedLine.length < 50 &&
      /^[A-Z\s]+$/.test(trimmedLine);

    const currentFont = isHeading ? boldFont : font;
    const currentSize = isHeading ? 14 : fontSize;

    // Wrap text if needed
    const words = trimmedLine.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const textWidth = currentFont.widthOfTextAtSize(testLine, currentSize);

      if (textWidth > maxWidth && currentLine) {
        page.drawText(currentLine, {
          x: margin,
          y,
          size: currentSize,
          font: currentFont,
          color: rgb(0, 0, 0),
        });
        y -= lineHeight;
        currentLine = word;

        if (y < margin + 20) {
          const newPage = pdfDoc.addPage([595.28, 841.89]);
          y = height - 50;
        }
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      page.drawText(currentLine, {
        x: margin,
        y,
        size: currentSize,
        font: currentFont,
        color: rgb(0, 0, 0),
      });
      y -= lineHeight;
    }

    if (isHeading) {
      y -= lineHeight / 2;
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Generate cover letter as plain text with formatting
 */
export function generateCoverLetterText(
  name: string,
  email: string,
  company: string,
  jobTitle: string,
  coverLetterContent: string
): string {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `${name}
${email}
${date}

Re: ${jobTitle} at ${company}

${coverLetterContent}

Best regards,
${name}`;
}

