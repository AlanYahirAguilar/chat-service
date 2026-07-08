import { Controller, Get, Param, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    @Inject('USER_SERVICE') private readonly userServiceProxy: ClientProxy,
  ) {}

  @Get(':id/profile')
  @ApiOperation({
    summary: 'Obtener perfil de usuario (Delegado al Microservicio)',
  })
  getProfile(@Param('id') id: number) {
    // Aquí el Gateway actúa como Reverse Proxy.
    // Envía el mensaje 'get_profile' por TCP al microservicio de usuarios.
    // El microservicio procesa la lógica pesada y devuelve el JSON.
    return this.userServiceProxy.send({ cmd: 'get_profile' }, id);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los usuarios' })
  findAll() {
    return this.userServiceProxy.send(
      { cmd: 'find_all_users' },
      { page: 1, limit: 10 },
    );
  }
}
