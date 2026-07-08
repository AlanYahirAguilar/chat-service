import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ReportService } from './report.service';

@Controller()
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @MessagePattern({ cmd: 'generatePerformanceReport' })
  async generatePerformanceReport(@Payload() filters: any) {
    return this.reportService.generatePerformanceReport(filters);
  }
}
