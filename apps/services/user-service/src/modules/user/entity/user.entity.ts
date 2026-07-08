import { ApiProperty } from '@nestjs/swagger';
import { Base } from '@syncslot/shared';
import { Column, Entity, Index } from 'typeorm';
import { Exclude } from 'class-transformer';

@Index('email', ['email'], { unique: true })
@Index('phone_number', ['phoneNumber'], { unique: true })
@Entity('user')
export class UserEntity extends Base {
  @Column('varchar', {
    name: 'name',
    comment: 'Full name of the user',
    length: 255,
  })
  @ApiProperty({ example: 'string' })
  name: string;

  @Column('varchar', {
    name: 'email',
    unique: true,
    comment: 'Unique email of the user',
    length: 255,
  })
  @ApiProperty({ example: 'string' })
  email: string;

  @Column('varchar', {
    name: 'phone_number',
    unique: true,
    comment: 'Unique phone number',
    length: 20,
  })
  @ApiProperty({ example: 'string' })
  phoneNumber: string;

  @Column('varchar', {
    name: 'password',
    comment: 'Encrypted password',
    length: 255,
  })
  @ApiProperty({ example: 'string' })
  @Exclude()
  password: string;

  @Column('varchar', {
    name: 'code',
    nullable: true,
    comment: 'Password recovery code',
    length: 255,
  })
  @ApiProperty({ example: 'string', required: false })
  @Exclude()
  code: string | null;

  @Column('timestamp', {
    name: 'code_created_at',
    nullable: true,
    comment: 'Password recovery code creation date',
  })
  @ApiProperty({ example: '2023-06-20T00:00:00.000Z', required: false })
  @Exclude()
  codeCreatedAt: Date | null;

  @Column('timestamp', {
    name: 'last_session_at',
    nullable: true,
    comment: 'Last session date',
  })
  @ApiProperty({ example: '2023-06-20T00:00:00.000Z', required: false })
  lastSessionAt: Date | null;

  @Column('enum', {
    name: 'role',
    comment: 'User role',
    enum: ['ADMIN', 'OPERATOR', 'CLIENT', 'SUPERVISOR'],
    default: 'CLIENT',
  })
  @ApiProperty({
    example: 'CLIENT',
    enum: ['ADMIN', 'OPERATOR', 'CLIENT', 'SUPERVISOR'],
  })
  role: 'ADMIN' | 'OPERATOR' | 'CLIENT' | 'SUPERVISOR';

  @Column('enum', {
    name: 'status',
    comment: 'User status',
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE',
  })
  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'] })
  status: 'ACTIVE' | 'INACTIVE';
}
