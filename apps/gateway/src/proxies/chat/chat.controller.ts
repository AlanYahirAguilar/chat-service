import { Controller, Post, Body, Inject, UseGuards } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { JwtAuthGuard } from '@/proxies/auth/guards/jwt.auth.guard';
import { CurrentUser } from '@/proxies/auth/decorators/current-user.decorator';

@ApiTags('Chat')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(
    @Inject('USER_SERVICE') private readonly userServiceClient: ClientProxy,
  ) {}

  @Post('send')
  @ApiOperation({ summary: 'Despacha un mensaje a un contacto utilizando IA para adaptar su tono' })
  async sendMessage(
    @CurrentUser('id') userId: bigint,
    @Body() body: { contactId: string; prompt: string },
  ) {
    if (!body.contactId || !body.prompt) {
      throw new RpcException('Faltan parámetros requeridos: contactId y prompt');
    }

    return await firstValueFrom(
      this.userServiceClient
        .send({ cmd: 'dispatchMessage' }, { ...body, userId })
        .pipe(
          catchError((error) => {
            return throwError(() => new RpcException(error.message || 'Error en microservicio'));
          }),
        ),
    );
  }

  @Post('draft')
  @ApiOperation({ summary: 'Genera un borrador de mensaje con IA sin enviarlo' })
  async generateDraft(
    @CurrentUser('id') userId: bigint,
    @Body() body: { contactId: string; prompt: string },
  ) {
    if (!body.contactId || !body.prompt) {
      throw new RpcException('Faltan parámetros requeridos: contactId y prompt');
    }

    return await firstValueFrom(
      this.userServiceClient
        .send({ cmd: 'generateDraft' }, { ...body, userId })
        .pipe(
          catchError((error) => {
            return throwError(() => new RpcException(error.message || 'Error en microservicio'));
          }),
        ),
    );
  }

  @Post('send-draft')
  @ApiOperation({ summary: 'Envía un borrador (texto validado) directamente a la plataforma del contacto' })
  async sendDraft(
    @CurrentUser('id') userId: bigint,
    @Body() body: { contactId: string; historyId: string; message: string; subject?: string },
  ) {
    if (!body.contactId || !body.historyId || !body.message) {
      throw new RpcException('Faltan parámetros requeridos: contactId, historyId y message');
    }

    return await firstValueFrom(
      this.userServiceClient
        .send({ cmd: 'sendDraft' }, { ...body, userId })
        .pipe(
          catchError((error) => {
            return throwError(() => new RpcException(error.message || 'Error en microservicio'));
          }),
        ),
    );
  }
}
