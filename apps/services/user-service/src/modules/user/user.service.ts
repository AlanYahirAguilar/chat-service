import { CustomLoggerService } from '@syncslot/shared';
import { generateRandomCode } from '@syncslot/shared';
import { comparePasswords, hashPassword } from '@syncslot/shared';
import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { UserEntity } from './entity/user.entity';
import { CreateUserDTO } from './model/create.user.dto';
import { ResetPasswordCodeDTO } from './model/reset.password.code.dto';
import { ResetPasswordDTO } from './model/reset.password.dto';
import { UpdateUserDTO } from './model/update.user.dto';
import { UpdateProfileDto } from './model/update.profile.dto';
import { UserProfileResponseDto } from './model/user.profile.response.dto';
import { stringConstants } from '@syncslot/shared';
const ROLE_WEIGHTS: Record<string, number> = {
  CLIENT: 1,
  OPERATOR: 2,
  SUPERVISOR: 3,
  ADMIN: 4,
};
import {
  sendWelcomeNotificationMessage,
  sendCodeNotificationMessage,
} from './templates/user.email.templates';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: CustomLoggerService,
    @Inject('WHATSAPP_SERVICE') private readonly whatsappClient: ClientProxy,
    @Inject('MAIL_SERVICE') private readonly mailClient: ClientProxy,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  async findAll(page: number = 1, limit: number = 10) {
    try {
      return await this.userRepository.find({
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch (error) {
      throw error;
    }
  }

  async findAllActiveAndRole(
    role: 'ADMIN' | 'OPERATOR' | 'CLIENT' | 'SUPERVISOR',
  ) {
    try {
      return await this.userRepository.find({
        where: { status: 'ACTIVE', role: role },
      });
    } catch (error) {
      throw error;
    }
  }

  async findById(id: bigint): Promise<UserEntity> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        throw new Error('Not Found');
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  async getProfile(userId: bigint): Promise<UserProfileResponseDto> {
    try {
      const user = await this.findById(userId);
      const privileges = await firstValueFrom(
        this.authClient.send({ cmd: 'get_role_privileges' }, user.role),
      );
      return {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        status: user.status,
        lastSessionAt: user.lastSessionAt,
        createdAt: user.createdAt,
        privileges,
      };
    } catch (error) {
      throw error;
    }
  }

  async findByEmail(email: string) {
    try {
      return await this.userRepository.findOne({ where: { email } });
    } catch (error) {
      throw error;
    }
  }

  async create(createUserDTO: CreateUserDTO) {
    try {
      await this.validateUniqueFields(
        createUserDTO.email,
        createUserDTO.phoneNumber,
      );

      const hashedPassword = await hashPassword(createUserDTO.password);
      const user = this.userRepository.create({
        ...createUserDTO,
        password: hashedPassword,
        status: 'ACTIVE',
        role: 'CLIENT',
      });

      const savedUser = await this.userRepository.save(user);
      this.eventEmitter.emit('user.created', savedUser);
      return savedUser;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        error.message || 'Error al crear el usuario',
      );
    }
  }

  async update(
    id: bigint,
    updateUserDTO: UpdateUserDTO,
    executorId: bigint,
    executorRole: string,
  ) {
    try {
      const user = await this.findById(id);
      if (!user) {
        throw new Error('Not Found');
      }

      this.checkRoleHierarchyAndSelf(
        executorId,
        executorRole,
        id,
        user.role,
        'update',
      );

      await this.validateUniqueFields(
        updateUserDTO.email,
        updateUserDTO.phoneNumber,
        id,
      );

      await this.userRepository.update({ id }, updateUserDTO);
      const updatedUser = await this.findById(id);
      this.eventEmitter.emit('user.updated', updatedUser);
      return updatedUser;
    } catch (error) {
      if (error instanceof BadRequestException || error.message === 'Not Found')
        throw error;
      throw new BadRequestException(
        error.message || 'Error al actualizar el usuario',
      );
    }
  }

  async updateProfile(userId: bigint, updateProfileDto: UpdateProfileDto) {
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new Error('Not Found');
      }

      await this.validateUniqueFields(
        undefined,
        updateProfileDto.phoneNumber,
        userId,
      );

      await this.userRepository.update({ id: userId }, updateProfileDto);
      const updatedUser = await this.findById(userId);
      this.eventEmitter.emit('user.updated', updatedUser);
      return updatedUser;
    } catch (error) {
      if (error instanceof BadRequestException || error.message === 'Not Found')
        throw error;
      throw new BadRequestException(
        error.message || 'Error al actualizar el perfil',
      );
    }
  }

  async register(createUserDTO: CreateUserDTO) {
    try {
      await this.validateUniqueFields(
        createUserDTO.email,
        createUserDTO.phoneNumber,
      );

      const hashedPassword = await hashPassword(createUserDTO.password);
      const user = this.userRepository.create({
        ...createUserDTO,
        password: hashedPassword,
        role: 'CLIENT',
        status: 'ACTIVE',
      });

      const savedUser = await this.userRepository.save(user);

      // Enviar correo de bienvenida
      const html = sendWelcomeNotificationMessage(savedUser.name);
      this.mailClient.emit(
        { cmd: 'send_mail' },
        {
          to: savedUser.email,
          subject: `¡Bienvenido a ${stringConstants.APP_NAME}!`,
          html,
        },
      );

      this.eventEmitter.emit('user.created', savedUser);

      return savedUser;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        error.message || 'Error al registrar el usuario',
      );
    }
  }

  async resetPassword(resetPasswordDTO: ResetPasswordDTO) {
    try {
      const user = await this.findById(resetPasswordDTO.id);
      if (!user) {
        throw new Error('Not Found');
      }

      const hashedPassword = await hashPassword(resetPasswordDTO.password);
      await this.userRepository.update(
        { id: resetPasswordDTO.id },
        { password: hashedPassword },
      );

      const updatedUser = await this.findById(resetPasswordDTO.id);
      this.eventEmitter.emit('user.updated', updatedUser);
      return updatedUser;
    } catch (error) {
      if (error.message === 'Not Found') {
        throw error;
      }
      throw new BadRequestException(
        error.message || 'Error al resetear la contraseña',
      );
    }
  }

  async sendCodeEmail(email: string) {
    try {
      const user = await this.findByEmail(email);
      if (!user) {
        throw new Error('Not Found');
      }

      // Generar código de 6 dígitos
      const code = generateRandomCode(6);
      const hashedCode = await hashPassword(code);

      // Guardar código hasheado y fecha de creación
      await this.userRepository.update(
        { email },
        {
          code: hashedCode,
          codeCreatedAt: new Date(),
        },
      );
      const html = sendCodeNotificationMessage(code);
      this.mailClient.emit(
        { cmd: 'send_mail' },
        {
          to: user.email,
          subject: 'Código de verificación',
          html,
        },
      );
      return { success: true, message: 'Código enviado por correo' };
    } catch (error) {
      if (error.message === 'Not Found') {
        throw error;
      }
      throw new BadRequestException(
        error.message || 'Error al generar el código',
      );
    }
  }

  async resetPasswordWithCode(resetPasswordCodeDTO: ResetPasswordCodeDTO) {
    try {
      const user = await this.findByEmail(resetPasswordCodeDTO.email);
      if (!user) {
        throw new Error('Not Found');
      }

      if (!user.code || !user.codeCreatedAt) {
        throw new BadRequestException('No hay código de verificación generado');
      }

      // Verificar si el código ha expirado (15 minutos)
      const codeAge = new Date().getTime() - user.codeCreatedAt.getTime();
      if (codeAge > 15 * 60 * 1000) {
        throw new BadRequestException('El código ha expirado');
      }

      // Verificar el código
      const isValidCode = await comparePasswords(
        resetPasswordCodeDTO.code,
        user.code,
      );
      if (!isValidCode) {
        throw new BadRequestException('Código de verificación inválido');
      }

      // Actualizar contraseña
      const hashedPassword = await hashPassword(resetPasswordCodeDTO.password);
      await this.userRepository.update(
        { email: resetPasswordCodeDTO.email },
        {
          password: hashedPassword,
          code: null,
          codeCreatedAt: null,
        },
      );

      const updatedUser = await this.findByEmail(resetPasswordCodeDTO.email);
      this.eventEmitter.emit('user.updated', updatedUser);
      return updatedUser;
    } catch (error) {
      if (
        error.message === 'Not Found' ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        error.message || 'Error al resetear la contraseña con código',
      );
    }
  }

  async updateLastSessionAt(userId: bigint) {
    try {
      await this.userRepository.update(
        { id: userId },
        { lastSessionAt: new Date().toISOString() },
      );
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Error al actualizar la última sesión',
      );
    }
  }

  async sendVerificationCode(email: string) {
    try {
      const user = await this.findByEmail(email);
      if (!user) throw new Error('Not Found');

      // Generate 6-digit code
      const code = generateRandomCode(6);
      const hashedCode = await hashPassword(code);

      await this.userRepository.update(
        { email },
        { code: hashedCode, codeCreatedAt: new Date() },
      );

      // Enviar WhatsApp
      const url = `${stringConstants.APP_URL}/verification-code`;
      const message = `Tu código de verificación es: ${code}\nIngresa a: ${url}`;

      this.whatsappClient.emit(
        { cmd: 'send_message' },
        {
          to: user.phoneNumber,
          message,
          name: user.name,
        },
      );
      return { success: true, message: 'Código enviado por WhatsApp' };
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Error al generar o enviar el código',
      );
    }
  }

  async delete(id: bigint, executorId: bigint, executorRole: string) {
    try {
      const user = await this.userRepository.findOneBy({ id: id });
      if (!user) {
        throw new Error('Not Found');
      }

      this.checkRoleHierarchyAndSelf(
        executorId,
        executorRole,
        id,
        user.role,
        'delete',
      );

      const result = await this.userRepository.softDelete(id.toString());
      this.eventEmitter.emit('user.deleted', id);
      return result;
    } catch (error) {
      throw error;
    }
  }

  private async validateUniqueFields(
    email?: string,
    phoneNumber?: string,
    excludeUserId?: bigint,
  ) {
    this.logger.log(
      `validateUniqueFields: ${JSON.stringify({
        email,
        phoneNumber,
        excludeUserId,
      })}`,
      'REQUEST',
    );

    // Validar email único
    if (email) {
      this.logger.log(
        `validateUniqueFields: Validando email: ${email}`,
        'REQUEST',
      );
      const emailExists = await this.userRepository.exists({
        where: {
          email,
          id: excludeUserId ? Not(excludeUserId) : undefined,
        },
      });

      if (emailExists) {
        this.logger.error(
          `[UserService_validateUniqueFields] Email duplicado: ${email}`,
          new Error().stack,
          'EXCEPTION',
        );
        throw new BadRequestException('Ya existe un usuario con este email');
      }
    }

    if (phoneNumber) {
      this.logger.log(
        `validateUniqueFields: Validando teléfono: ${phoneNumber}`,
        'REQUEST',
      );
      const phoneExists = await this.userRepository.exists({
        where: {
          phoneNumber,
          id: excludeUserId ? Not(excludeUserId) : undefined,
        },
      });

      if (phoneExists) {
        this.logger.error(
          `[UserService_validateUniqueFields] Teléfono duplicado: ${phoneNumber}`,
          new Error().stack,
          'EXCEPTION',
        );
        throw new BadRequestException(
          'Ya existe un usuario con este número de teléfono',
        );
      }
    }

    this.logger.log(
      'validateUniqueFields: Validación de campos únicos completada',
      'REQUEST',
    );
  }

  private checkRoleHierarchyAndSelf(
    executorId: bigint,
    executorRole: string,
    targetId: bigint,
    targetRole: string,
    action: 'update' | 'delete',
  ) {
    // 1. Evitar autogestión destructiva o alteración de estado/rol a uno mismo
    if (executorId === targetId) {
      throw new BadRequestException(
        `No puedes realizar la acción de ${action} sobre tu propia cuenta.`,
      );
    }

    const executorWeight = ROLE_WEIGHTS[executorRole] || 0;
    const targetWeight = ROLE_WEIGHTS[targetRole] || 0;

    // 2. Si el objetivo es ADMIN, solo otro ADMIN puede gestionarlo
    if (targetRole === 'ADMIN' && executorRole !== 'ADMIN') {
      throw new BadRequestException(
        'No tienes permisos para modificar a un administrador del sistema.',
      );
    }

    // 3. Regla general: El ejecutor debe tener mayor rango que el objetivo
    // Excepción: ADMIN puede gestionar a otros ADMINs (pero ya validamos que no a sí mismo)
    if (executorRole !== 'ADMIN' && executorWeight <= targetWeight) {
      throw new BadRequestException(
        `Tu rango (${executorRole}) no te permite gestionar a un usuario con rango igual o superior (${targetRole}).`,
      );
    }
  }
}
