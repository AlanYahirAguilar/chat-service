// @ts-nocheck
import { Injectable, Logger, Inject } from '@nestjs/common';
import { CreateReportDto } from './model/create.report.dto';
import { ReportFiltersDto } from './model/report.filters.dto';
export class CreateReportDto {}
export class ReportFiltersDto {
  month?: number;
  year?: number;
  resourceId?: number;
}
import { stringConstants, parseMonthYearToDateRange, formatDateRange, generateRandomCode } from '@syncslot/shared';
import { ReportPdfTemplates } from './templates/report.pdf.templates';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

type ResourceStats = {
  resourceId: number;
  resourceName: string;
  totalReservations: number;
  completedReservations: number;
  noShows: number;
  revenue: number;
};

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    @Inject('RESERVATION_SERVICE')
    private readonly reservationService: ClientProxy,
  ) {}

  async generatePerformanceReport(filters: ReportFiltersDto): Promise<string> {
    try {
      this.logger.log(
        `Generating performance report for: ${JSON.stringify(filters)}`,
      );

      const monthStr = String(filters.month || new Date().getMonth() + 1).padStart(2, '0');
      const yearStr = String(filters.year || new Date().getFullYear());
      const dateRange = parseMonthYearToDateRange(`${yearStr}-${monthStr}`);

      // Query reservations and resources via TCP client
      const remoteData = await firstValueFrom(
        this.reservationService.send(
          { cmd: 'getReportData' },
          {
            startDate: dateRange.startDate.toISOString(),
            endDate: dateRange.endDate.toISOString(),
            resourceId: filters.resourceId,
          },
        ),
      );

      const reservations = remoteData?.reservations || [];
      const resources = remoteData?.resources || [];

      const totalScheduled = reservations.length;
      const totalCancelled = reservations.filter(
        (r: any) => r.status === ReservationStatus.CANCELLED,
      ).length;
      const totalCompleted = reservations.filter(
        (r: any) => r.status === ReservationStatus.CONFIRMED,
      ).length;
      const totalNoShows = reservations.filter(
        (r: any) => r.status === ReservationStatus.PENDING,
      ).length;

      const resourceStats: ResourceStats[] = resources.map((res: any) => {
        const resReservations = reservations.filter(
          (r: any) => r.resourceId === res.id,
        );
        const resCompleted = resReservations.filter(
          (r: any) => r.status === ReservationStatus.CONFIRMED,
        );
        const resNoShows = resReservations.filter(
          (r: any) => r.status === ReservationStatus.PENDING,
        );
        
        // Simulación de ganancia: 50 por cada reservación confirmada
        const revenue = resCompleted.length * 50;

        return {
          resourceId: parseInt(res.id, 10),
          resourceName: res.name,
          totalReservations: resReservations.length,
          completedReservations: resCompleted.length,
          noShows: resNoShows.length,
          revenue,
        };
      });

      const totalRevenue = resourceStats.reduce(
        (sum: number, stat: any) => sum + stat.revenue,
        0,
      );

      const reportData = {
        title: 'Monthly Performance Report',
        generatedAt: new Date().toISOString(),
        filters,
        dateRangeStr: formatDateRange
          ? formatDateRange(dateRange.startDate, dateRange.endDate)
          : '',
        totalScheduled,
        totalCompleted,
        totalCancelled,
        totalNoShows,
        totalRevenue,
        resourceStats,
      };

      const pdfBuffer = await this.buildPdfBuffer(reportData);

      const reportId = this.generateReportId(filters);
      return reportId;
    } catch (error) {
      this.logger.error(`Error generating report: ${error.message}`);
      throw error;
    }
  }

  private async buildPdfBuffer(reportData: any): Promise<Buffer> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const PdfPrinter = require('pdfmake/src/printer');

    const fonts = {
      Roboto: {
        normal: Buffer.from(
          require('pdfmake/build/vfs_fonts').pdfMake.vfs['Roboto-Regular.ttf'],
          'base64',
        ),
        bold: Buffer.from(
          require('pdfmake/build/vfs_fonts').pdfMake.vfs['Roboto-Medium.ttf'],
          'base64',
        ),
        italics: Buffer.from(
          require('pdfmake/build/vfs_fonts').pdfMake.vfs['Roboto-Italic.ttf'],
          'base64',
        ),
        bolditalics: Buffer.from(
          require('pdfmake/build/vfs_fonts').pdfMake.vfs[
            'Roboto-MediumItalic.ttf'
          ],
          'base64',
        ),
      },
    };

    const printer = new PdfPrinter(fonts);

    const content = [
      ReportPdfTemplates.buildHeader(reportData.title),
      ReportPdfTemplates.buildPeriod(reportData.dateRangeStr),
      ...ReportPdfTemplates.buildGeneralSummary({
        totalScheduled: reportData.totalScheduled,
        totalCompleted: reportData.totalCompleted,
        totalNoShows: reportData.totalNoShows,
        totalCancelled: reportData.totalCancelled,
      }),
      ...ReportPdfTemplates.buildResourceStatsSection(reportData.resourceStats),
      ...ReportPdfTemplates.buildTotalRevenue(reportData.totalRevenue),
      ReportPdfTemplates.buildFooter(new Date(reportData.generatedAt)),
    ];

    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60] as [number, number, number, number],
      content,
      styles: {
        header: { fontSize: 22, bold: true, color: '#2c3e50' },
        subheader: { fontSize: 14, color: '#7f8c8d' },
        sectionHeader: { fontSize: 13, bold: true, color: '#2980b9' },
        footer: { fontSize: 9, color: '#95a5a6', italics: true },
      },
      defaultStyle: { font: 'Roboto', fontSize: 10 },
    };

    return new Promise<Buffer>((resolve, reject) => {
      try {
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        const chunks: Buffer[] = [];
        pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.on('error', reject);
        pdfDoc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  private generateReportId(filters: ReportFiltersDto): string {
    const parts = ['REP'];
    if (filters.month && filters.year) {
      parts.push(`${filters.year}${filters.month}`);
    }
    if (filters.resourceId) {
      parts.push(`RES${filters.resourceId}`);
    }
    parts.push(generateRandomCode(6));
    return parts.join('-');
  }
}
