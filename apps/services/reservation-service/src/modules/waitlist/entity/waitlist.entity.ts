import { Entity, Column } from 'typeorm';
import { Base } from '@syncslot/shared';

@Entity('waitlist')
export class WaitlistEntry extends Base {
  @Column({ type: 'bigint', unsigned: true })
  userId: bigint;

  @Column({ type: 'bigint', unsigned: true })
  resourceId: bigint;

  @Column({ type: 'timestamp' })
  requestedStartTime: Date;

  @Column({ type: 'timestamp' })
  requestedEndTime: Date;

  @Column({ default: 'WAITING' })
  status: 'WAITING' | 'NOTIFIED' | 'EXPIRED';

  @Column({ type: 'timestamp', nullable: true })
  notifiedAt: Date;
}
