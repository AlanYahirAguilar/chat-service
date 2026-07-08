import { Controller, Get, Query, UseGuards, Inject } from '@nestjs/common';
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

@ApiTags('Availability')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('availability')
export class AvailabilityController {
  constructor(
    @Inject('RESERVATION_SERVICE')
    private readonly reservationClient: ClientProxy,
  ) {}

  @Get()
  @RequirePrivilege('availability:read')
  @ApiOperation({
    summary: 'Check resource availability',
    description: 'Returns base schedules and busy slots for a resource.',
  })
  @ApiResponse({
    status: 200,
    description: 'Resource availability retrieved successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad request (validation error).' })
  @ApiResponse({ status: 404, description: 'Resource not found.' })
  checkAvailability(@Query() query: any) {
    // Convierte resourceId de query a número si viene
    if (query.resourceId) {
      query.resourceId = Number(query.resourceId);
    }
    return firstValueFrom(
      this.reservationClient.send({ cmd: 'checkAvailability' }, query),
    );
  }
}
