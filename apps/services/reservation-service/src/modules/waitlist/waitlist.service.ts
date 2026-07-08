import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { WaitlistEntry } from './entity/waitlist.entity';
import { JoinWaitlistDto } from './model/join.waitlist.dto';

@Injectable()
export class WaitlistService {
  constructor(
    @InjectRepository(WaitlistEntry)
    private readonly waitlistRepo: Repository<WaitlistEntry>,
  ) {}

  async join(userId: bigint, dto: JoinWaitlistDto): Promise<WaitlistEntry> {
    try {
      const entry = this.waitlistRepo.create({
        userId: BigInt(userId),
        resourceId: BigInt(dto.resourceId),
        requestedStartTime: new Date(dto.requestedStartTime),
        requestedEndTime: new Date(dto.requestedEndTime),
        status: 'WAITING',
      });
      return await this.waitlistRepo.save(entry);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async leave(entryId: bigint, userId: bigint): Promise<void> {
    try {
      const entry = await this.waitlistRepo.findOne({ where: { id: entryId } });
      if (!entry) {
        throw new BadRequestException('Waitlist entry not found');
      }
      if (BigInt(entry.userId) !== BigInt(userId)) {
        throw new BadRequestException('You do not have permission to leave this waitlist');
      }
      await this.waitlistRepo.remove(entry);
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
