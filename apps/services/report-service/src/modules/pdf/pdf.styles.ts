import { StyleDictionary, TFontDictionary } from 'pdfmake';

export class PdfStyles {
  static getFonts(): TFontDictionary {
    return {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    };
  }

  static getStyles(): StyleDictionary {
    return {
      header: {
        fontSize: 24,
        bold: true,
        color: '#2c3e50',
      },
      subheader: {
        fontSize: 16,
        color: '#34495e',
        bold: true,
      },
      sectionHeader: {
        fontSize: 14,
        bold: true,
        color: '#2c3e50',
      },
      footer: {
        fontSize: 9,
        italics: true,
        color: '#95a5a6',
      },
    };
  }

  static getDefaultStyle() {
    return {
      font: 'Helvetica',
      fontSize: 10,
    };
  }

  static getPageMargins(): [number, number, number, number] {
    return [40, 40, 40, 40];
  }
}
