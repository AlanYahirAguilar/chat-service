import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('media')
export class MediaEntity {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'id',
    comment: 'ID del archivo multimedia',
  })
  id: bigint;

  @Column('text', { name: 'url', comment: 'URL pública del archivo' })
  url: string;

  @Column('bigint', {
    name: 'entity_id',
    nullable: true,
    comment: 'ID de la entidad relacionada',
  })
  entityId: bigint | null;

  @Column('varchar', {
    name: 'entity_type',
    nullable: true,
    comment: 'Tipo de entidad',
    length: 100,
  })
  entityType: string | null;

  @Column('enum', {
    name: 'file_type',
    comment: 'Tipo de archivo',
    enum: ['IMAGE', 'PDF', 'VIDEO', 'OTHER'],
  })
  fileType: 'IMAGE' | 'PDF' | 'VIDEO' | 'OTHER';

  @Column('int', {
    name: 'display_order',
    nullable: true,
    comment: 'Orden de aparición',
    default: () => "'0'",
  })
  displayOrder: number | null;

  @Column('enum', {
    name: 'status',
    comment: 'Estado del archivo',
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE',
  })
  status: 'ACTIVE' | 'INACTIVE';

  @Column('timestamp', {
    name: 'created_at',
    nullable: true,
    comment: 'Fecha de creación',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date | null;

  @Column('timestamp', {
    name: 'updated_at',
    nullable: true,
    comment: 'Fecha de última actualización',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date | null;
}
