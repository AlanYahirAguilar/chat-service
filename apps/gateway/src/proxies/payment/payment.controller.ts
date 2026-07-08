import { Controller, Post, Body, UseGuards, Req, Inject } from '@nestjs/common';
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

@ApiTags('Payments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('payments')
export class PaymentController {
  constructor(
    @Inject('PAYMENT_SERVICE')
    private readonly paymentClient: ClientProxy,
  ) {}

  @Post('process')
  @RequirePrivilege('payments:create')
  @ApiOperation({
    summary: 'Process a simulated payment',
    description:
      'Simulates processing a payment and confirming the reservation if successful.',
  })
  @ApiResponse({ status: 201, description: 'Payment processed successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or reservation not found/not pending',
  })
  async processPayment(
    @Req() req: Request & { user: AuthenticatedUser },
    @Body() processPaymentDto: any,
  ) {
    const userId = req.user.id;
    return firstValueFrom(
      this.paymentClient.send(
        { cmd: 'processPayment' },
        { dto: processPaymentDto, userId: userId.toString() },
      ),
    );
  }
}
