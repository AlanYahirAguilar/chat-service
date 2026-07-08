import { Body, Controller, Post, UseGuards, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePrivilege } from '../auth/decorators/require.privilege.decorator';
import { firstValueFrom } from 'rxjs';

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportController {
  constructor(
    @Inject('REPORT_SERVICE')
    private readonly reportClient: ClientProxy,
  ) {}

  @Post('occupancy')
  @RequirePrivilege('reports:create')
  @ApiOperation({
    summary: 'Generate occupancy report',
    description:
      'Generates a performance/occupancy report based on reservations.',
  })
  @ApiResponse({ status: 201, description: 'Report successfully generated' })
  async generateOccupancyReport(
    @Body()
    filters: {
      monthYear?: string;
      month?: number;
      year?: number;
      resourceId?: number;
    },
  ) {
    // Map backward compatibility for 'monthYear' (e.g. '2024-03') to month/year if needed
    const payload: any = { ...filters };
    if (filters.monthYear && (!filters.month || !filters.year)) {
      const parts = filters.monthYear.split('-');
      if (parts.length === 2) {
        payload.year = parseInt(parts[0], 10);
        payload.month = parseInt(parts[1], 10);
      }
    }

    return firstValueFrom(
      this.reportClient.send({ cmd: 'generatePerformanceReport' }, payload),
    );
  }
}
