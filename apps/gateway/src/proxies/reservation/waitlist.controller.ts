import { Controller, Post, Delete, Body, Param, Req, ParseIntPipe, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {  } from '@syncslot/shared';
import { firstValueFrom } from 'rxjs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RequirePrivilege } from '../auth/decorators/require.privilege.decorator';

@ApiTags('Waitlist')
@ApiBearerAuth()
@Controller('waitlist')
export class WaitlistController {
  constructor(
    @Inject('RESERVATION_SERVICE') private readonly reservationClient: ClientProxy,
  ) {}

  @Post()
  @RequirePrivilege('reservations:create')
  @ApiOperation({ summary: 'Join the waitlist for a resource' })
  async joinWaitlist(@Body() dto: any, @Req() req: any) {
    return firstValueFrom(
      this.reservationClient.send(
        { cmd: 'joinWaitlist' },
        { dto, userId: req.user.id }
      ),
    );
  }

  @Delete(':id')
  @RequirePrivilege('reservations:delete')
  @ApiOperation({ summary: 'Leave the waitlist' })
  async leaveWaitlist(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return firstValueFrom(
      this.reservationClient.send(
        { cmd: 'leaveWaitlist' },
        { entryId: id.toString(), userId: req.user.id }
      ),
    );
  }
}
