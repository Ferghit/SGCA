import { Response } from 'express';
import * as PDFDocument from 'pdfkit';

export const A4_PRINT_LAYOUT = {
  margin: 50,
  left: 50,
  right: 545,
  width: 495,
  tableWidth: 495,
  contentBottomY: 745,
  footerLineY: 770,
  footerTextY: 778,
};

export function createA4PdfDocument(options: PDFKit.PDFDocumentOptions = {}) {
  return new PDFDocument({
    size: 'A4',
    margin: A4_PRINT_LAYOUT.margin,
    autoFirstPage: true,
    ...options,
  });
}

export function setPdfDownloadHeaders(res: Response, filename: string, contentLength?: number) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  if (contentLength !== undefined) {
    res.setHeader('Content-Length', contentLength);
  }
}

export function drawPdfFooter(
  doc: PDFKit.PDFDocument,
  leftText: string,
  rightText?: string,
) {
  doc
    .strokeColor('#E9ECEF')
    .lineWidth(1)
    .moveTo(A4_PRINT_LAYOUT.left, A4_PRINT_LAYOUT.footerLineY)
    .lineTo(A4_PRINT_LAYOUT.right, A4_PRINT_LAYOUT.footerLineY)
    .stroke();

  doc
    .fillColor('#6C757D')
    .fontSize(9)
    .text(leftText, A4_PRINT_LAYOUT.left, A4_PRINT_LAYOUT.footerTextY, {
      width: A4_PRINT_LAYOUT.width,
      align: 'left',
      lineBreak: false,
    });

  if (rightText) {
    doc.text(rightText, A4_PRINT_LAYOUT.left, A4_PRINT_LAYOUT.footerTextY, {
      width: A4_PRINT_LAYOUT.width,
      align: 'right',
      lineBreak: false,
    });
  }
}
