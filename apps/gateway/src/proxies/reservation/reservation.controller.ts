import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Delete,
  Param,
  Inject,
  ParseIntPipe,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePrivilege } from '../auth/decorators/require.privilege.decorator';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/model/auth.interfaces';
import { firstValueFrom } from 'rxjs';

@ApiTags('Reservations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reservations')
export class ReservationController {
  constructor(
    @Inject('RESERVATION_SERVICE')
    private readonly reservationClient: ClientProxy,
  ) {}

  @Post()
  @RequirePrivilege('reservations:create')
  @ApiOperation({
    summary: 'Create a new reservation',
    description:
      'Creates a reservation and locks the resource to avoid overlaps.',
  })
  @ApiResponse({
    status: 201,
    description: 'Reservation successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'Overlapping reservation or invalid times.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient privileges.',
  })
  async create(
    @Body() dto: any,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    const userId = req.user.id;
    return firstValueFrom(
      this.reservationClient.send(
        { cmd: 'createReservation' },
        { dto, userId },
      ),
    );
  }

  @Delete(':id')
  @RequirePrivilege('reservations:delete')
  @ApiOperation({
    summary: 'Cancel a reservation',
    description: 'Sets reservation status to CANCELLED and emits event.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reservation successfully cancelled.',
  })
  @ApiResponse({ status: 404, description: 'Reservation not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient privileges.',
  })
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    const userId = req.user.id;
    return firstValueFrom(
      this.reservationClient.send(
        { cmd: 'cancelReservation' },
        { id: id.toString(), userId: userId.toString() },
      ),
    );
  }
}
