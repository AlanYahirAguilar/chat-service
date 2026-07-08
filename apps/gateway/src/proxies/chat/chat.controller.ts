import { Controller, Post, Body, Inject } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { firstValueFrom, catchError, throwError } from 'rxjs';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(
    @Inject('USER_SERVICE') private readonly userServiceClient: ClientProxy,
  ) {}

  @Post('send')
  @ApiOperation({ summary: 'Despacha un mensaje a un contacto utilizando IA para adaptar su tono' })
  async sendMessage(@Body() body: { contactId: string; prompt: string }) {
    if (!body.contactId || !body.prompt) {
      throw new RpcException('Faltan parámetros requeridos: contactId y prompt');
    }

    return await firstValueFrom(
      this.userServiceClient.send({ cmd: 'dispatchMessage' }, body).pipe(
        catchError((error) => {
          return throwError(() => new RpcException(error.message || 'Error en microservicio'));
        }),
      ),
    );
  }
}
