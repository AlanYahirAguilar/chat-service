import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user.service';
import { CreateUserDTO } from './model/create.user.dto';
import { UpdateUserDTO } from './model/update.user.dto';
import { ResetPasswordDTO } from './model/reset.password.dto';
import { ResetPasswordCodeDTO } from './model/reset.password.code.dto';
import { UpdateProfileDto } from './model/update.profile.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern({ cmd: 'find_all_users' })
  async findAll(@Payload() data: { page: number; limit: number }) {
    return await this.userService.findAll(data.page, data.limit);
  }

  @MessagePattern({ cmd: 'find_all_active_doctors' })
  async findAllActiveDoctors() {
    return await this.userService.findAllActiveAndRole('OPERATOR');
  }

  @MessagePattern({ cmd: 'get_profile' })
  async getProfile(@Payload() userId: bigint) {
    return await this.userService.getProfile(userId);
  }

  @MessagePattern({ cmd: 'find_user_by_id' })
  async findById(@Payload() id: bigint) {
    return await this.userService.findById(id);
  }

  @MessagePattern({ cmd: 'create_user' })
  async create(@Payload() createUserDTO: CreateUserDTO) {
    return await this.userService.create(createUserDTO);
  }

  @MessagePattern({ cmd: 'update_user' })
  async update(
    @Payload()
    data: {
      id: bigint;
      updateUserDTO: UpdateUserDTO;
      executorId: bigint;
      executorRole: string;
    },
  ) {
    return await this.userService.update(
      data.id,
      data.updateUserDTO,
      data.executorId,
      data.executorRole,
    );
  }

  @MessagePattern({ cmd: 'update_profile' })
  async updateProfile(
    @Payload() data: { userId: bigint; updateProfileDto: UpdateProfileDto },
  ) {
    return await this.userService.updateProfile(
      data.userId,
      data.updateProfileDto,
    );
  }

  @MessagePattern({ cmd: 'register_user' })
  async register(@Payload() createUserDTO: CreateUserDTO) {
    return await this.userService.register(createUserDTO);
  }

  @MessagePattern({ cmd: 'reset_password' })
  async resetPassword(@Payload() resetPasswordDTO: ResetPasswordDTO) {
    return await this.userService.resetPassword(resetPasswordDTO);
  }

  @MessagePattern({ cmd: 'send_code_email' })
  async sendCodeEmail(@Payload() email: string) {
    return await this.userService.sendCodeEmail(email);
  }

  @MessagePattern({ cmd: 'reset_password_with_code' })
  async resetPasswordWithCode(
    @Payload() resetPasswordCodeDTO: ResetPasswordCodeDTO,
  ) {
    return await this.userService.resetPasswordWithCode(resetPasswordCodeDTO);
  }

  @MessagePattern({ cmd: 'find_by_email' })
  async findByEmail(@Payload() email: string) {
    return await this.userService.findByEmail(email);
  }

  @MessagePattern({ cmd: 'send_verification_code_whatsapp' })
  async sendVerificationCode(@Payload() email: string) {
    return await this.userService.sendVerificationCode(email);
  }

  @MessagePattern({ cmd: 'delete_user' })
  async delete(
    @Payload() data: { id: bigint; executorId: bigint; executorRole: string },
  ) {
    return await this.userService.delete(
      data.id,
      data.executorId,
      data.executorRole,
    );
  }

  @MessagePattern({ cmd: 'update_last_session' })
  async updateLastSessionAt(@Payload() userId: bigint) {
    await this.userService.updateLastSessionAt(userId);
    return { success: true };
  }
}
