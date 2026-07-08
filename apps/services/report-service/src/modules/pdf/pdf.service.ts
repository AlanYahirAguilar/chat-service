import { Injectable } from '@nestjs/common';
import pdfmake from 'pdfmake';
import { TDocumentDefinitions, Content } from 'pdfmake';
import { PdfStyles } from './pdf.styles';

@Injectable()
export class PdfService {
  constructor() {
    // En pdfmake 0.3.x, configuramos las fuentes en la instancia global
    pdfmake.setFonts(PdfStyles.getFonts());
  }

  async generatePdf(docDefinition: TDocumentDefinitions): Promise<Buffer> {
    // El nuevo API de pdfmake simplifica la generación y obtención del buffer
    const pdfDoc = pdfmake.createPdf(docDefinition);
    return await pdfDoc.getBuffer();
  }

  async generatePdfFromContent(content: Content[]): Promise<Buffer> {
    const docDefinition: TDocumentDefinitions = {
      content,
      styles: PdfStyles.getStyles(),
      defaultStyle: PdfStyles.getDefaultStyle(),
      pageMargins: PdfStyles.getPageMargins(),
    };
    return this.generatePdf(docDefinition);
  }

  getPrinter() {
    return pdfmake;
  }
}
