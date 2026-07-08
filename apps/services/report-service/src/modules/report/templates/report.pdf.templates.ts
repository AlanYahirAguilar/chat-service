import { Content } from 'pdfmake';

export class ReportPdfTemplates {
  static buildHeader(title: string = 'Reporte Administrativo'): Content {
    return {
      text: title,
      style: 'header',
      alignment: 'center',
      margin: [0, 0, 0, 20],
    };
  }

  static buildPeriod(period: string): Content {
    return {
      text: `Periodo: ${period}`,
      style: 'subheader',
      margin: [0, 0, 0, 10],
    };
  }

  static buildGeneralSummary(data: {
    totalScheduled: number;
    totalCompleted: number;
    totalNoShows: number;
    totalCancelled: number;
  }): Content[] {
    return [
      {
        text: 'Resumen General de Reservas',
        style: 'sectionHeader',
        margin: [0, 10, 0, 10],
      },
      {
        table: {
          widths: ['*', '*', '*', '*'],
          body: [
            [
              { text: 'Programadas', bold: true, fillColor: '#ecf0f1' },
              { text: 'Atendidas', bold: true, fillColor: '#ecf0f1' },
              { text: 'No Asistió', bold: true, fillColor: '#ecf0f1' },
              { text: 'Canceladas', bold: true, fillColor: '#ecf0f1' },
            ],
            [
              { text: data.totalScheduled.toString(), alignment: 'center' },
              {
                text: data.totalCompleted.toString(),
                alignment: 'center',
                color: 'green',
              },
              {
                text: data.totalNoShows.toString(),
                alignment: 'center',
                color: 'red',
              },
              {
                text: data.totalCancelled.toString(),
                alignment: 'center',
                color: 'orange',
              },
            ],
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20],
      },
    ];
  }

  static buildResourceStatsSection(
    resourceStats: Array<{
      resourceName: string;
      totalReservations: number;
      completedReservations: number;
      noShows: number;
      revenue: number;
    }>,
  ): Content[] {
    return [
      {
        text: 'Estadísticas Detalladas por Recurso',
        style: 'sectionHeader',
        margin: [0, 10, 0, 10],
      },
      {
        table: {
          widths: ['*', 'auto', 'auto', 'auto', 'auto'],
          headerRows: 1,
          body: [
            this.buildResourceTableHeader(),
            ...this.buildResourceTableRows(resourceStats),
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#bdc3c7',
          vLineColor: () => '#bdc3c7',
        },
        margin: [0, 0, 0, 20],
      },
    ];
  }

  private static buildResourceTableHeader() {
    return [
      { text: 'Recurso', bold: true, fillColor: '#3498db', color: 'white' },
      {
        text: 'Total Reservas',
        bold: true,
        fillColor: '#3498db',
        color: 'white',
      },
      { text: 'Atendidas', bold: true, fillColor: '#3498db', color: 'white' },
      { text: 'Ausencias', bold: true, fillColor: '#3498db', color: 'white' },
      { text: 'Ingresos', bold: true, fillColor: '#3498db', color: 'white' },
    ];
  }

  private static buildResourceTableRows(
    resourceStats: Array<{
      resourceName: string;
      totalReservations: number;
      completedReservations: number;
      noShows: number;
      revenue: number;
    }>,
  ) {
    return resourceStats.map((stat, index) => {
      const fillColor = index % 2 === 0 ? '#ecf0f1' : 'white';
      return [
        { text: stat.resourceName, fillColor },
        {
          text: stat.totalReservations.toString(),
          alignment: 'center',
          fillColor,
        },
        {
          text: stat.completedReservations.toString(),
          alignment: 'center',
          fillColor,
        },
        { text: stat.noShows.toString(), alignment: 'center', fillColor },
        { text: `$${stat.revenue.toFixed(2)}`, alignment: 'right', fillColor },
      ];
    });
  }

  static buildTotalRevenue(totalRevenue: number): Content[] {
    return [
      {
        canvas: [
          {
            type: 'rect',
            x: 0,
            y: 0,
            w: 515,
            h: 50,
            r: 5,
            color: '#27ae60',
          },
        ],
        margin: [0, 20, 0, 0],
      },
      {
        text: [
          {
            text: 'INGRESOS TOTALES DEL PERIODO: ',
            bold: true,
            color: 'white',
          },
          {
            text: `$${totalRevenue.toFixed(2)} MXN`,
            color: 'white',
            bold: true,
            fontSize: 18,
          },
        ],
        alignment: 'center',
        margin: [0, -40, 0, 20],
      },
    ];
  }

  static buildFooter(generatedAt: Date): Content {
    return {
      text: `Reporte generado el ${generatedAt.toLocaleString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      style: 'footer',
      alignment: 'center',
      margin: [0, 30, 0, 0],
    };
  }
}
