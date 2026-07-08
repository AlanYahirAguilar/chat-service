import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { JwtAuthGuard } from '@/proxies/auth/guards/jwt.auth.guard';
import { CurrentUser } from '@/proxies/auth/decorators/current-user.decorator';
import { CreateContactDto } from './dto/create.contact.dto';
import { UpdateContactDto } from './dto/update.contact.dto';

@ApiTags('Contacts')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactController {
  constructor(
    @Inject('USER_SERVICE') private readonly userServiceClient: ClientProxy,
  ) {}

  private forward<T>(cmd: string, payload: T) {
    return firstValueFrom(
      this.userServiceClient.send({ cmd }, payload).pipe(
        catchError((error) =>
          throwError(
            () => new RpcException(error.message || 'Error en microservicio'),
          ),
        ),
      ),
    );
  }

  @Post()
  @ApiOperation({ summary: 'Registrar un contacto con su tono de voz' })
  async create(
    @CurrentUser('id') userId: bigint,
    @Body() dto: CreateContactDto,
  ) {
    return this.forward('create_contact', { userId, dto });
  }

  @Get()
  @ApiOperation({ summary: 'Listar mis contactos' })
  async findAll(@CurrentUser('id') userId: bigint) {
    return this.forward('find_contacts', { userId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un contacto propio' })
  async findOne(
    @CurrentUser('id') userId: bigint,
    @Param('id') contactId: string,
  ) {
    return this.forward('find_contact', { userId, contactId });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un contacto propio (nombre, tono, etc.)' })
  async update(
    @CurrentUser('id') userId: bigint,
    @Param('id') contactId: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.forward('update_contact', { userId, contactId, dto });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un contacto propio' })
  async remove(
    @CurrentUser('id') userId: bigint,
    @Param('id') contactId: string,
  ) {
    return this.forward('delete_contact', { userId, contactId });
  }
}
