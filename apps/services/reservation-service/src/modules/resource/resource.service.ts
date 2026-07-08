// @ts-nocheck
import { RpcException } from '@nestjs/microservices';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resource } from './entity/resource.entity';
import { CreateResourceDto } from './model/create.resource.dto';
import { UpdateResourceDto } from './model/update.resource.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CustomLoggerService } from '@syncslot/shared';
@Injectable()
export class ResourceService {
  constructor(
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: CustomLoggerService,
  ) {}
  async create(createResourceDto: CreateResourceDto): Promise<Resource> {
    try {
      this.logger.log(
        `ResourceService.create: ${JSON.stringify(createResourceDto)}`,
        'REQUEST',
      );
      const resource = this.resourceRepository.create(createResourceDto);
      const savedResource = await this.resourceRepository.save(resource);
      this.eventEmitter.emit('resource.created', savedResource);
      return savedResource;
    } catch (error) {
      this.logger.error(
        `[ResourceService_create] ${error.message}`,
        error.stack,
        'EXCEPTION',
      );
      throw new RpcException(error);
    }
  }
  async findAll(page: number = 1, limit: number = 10): Promise<Resource[]> {
    try {
      const resources = await this.resourceRepository.find({
        relations: ['schedules'],
        skip: (page - 1) * limit,
        take: limit,
      });
      return resources;
    } catch (error) {
      this.logger.error(
        `[ResourceService_findAll] ${error.message}`,
        error.stack,
        'EXCEPTION',
      );
      throw new RpcException(error);
    }
  }
  async findOne(id: bigint): Promise<Resource> {
    try {
      const resource = await this.resourceRepository.findOne({
        where: { id },
        relations: ['schedules'],
      });
      if (!resource) {
        throw new RpcException('Resource', id);
      }
      return resource;
    } catch (error) {
      this.logger.error(
        `[ResourceService_findOne] ${error.message}`,
        error.stack,
        'EXCEPTION',
      );
      throw new RpcException(error);
    }
  }
  async update(
    id: bigint,
    updateResourceDto: UpdateResourceDto,
  ): Promise<Resource> {
    try {
      this.logger.log(
        `ResourceService.update: ${JSON.stringify({ id, ...updateResourceDto })}`,
        'REQUEST',
      );
      const resource = await this.findOne(id);
      await this.resourceRepository.update(
        { id: resource.id },
        updateResourceDto,
      );
      const savedResource = await this.findOne(resource.id);
      this.eventEmitter.emit('resource.updated', savedResource);
      return savedResource;
    } catch (error) {
      this.logger.error(
        `[ResourceService_update] ${error.message}`,
        error.stack,
        'EXCEPTION',
      );
      throw new RpcException(error);
    }
  }
  async remove(id: bigint): Promise<void> {
    try {
      this.logger.log(
        `ResourceService.remove: ${JSON.stringify({ id })}`,
        'REQUEST',
      );
      await this.resourceRepository.softDelete({ id });
      this.eventEmitter.emit('resource.deleted', id);
    } catch (error) {
      this.logger.error(
        `[ResourceService_remove] ${error.message}`,
        error.stack,
        'EXCEPTION',
      );
      throw new RpcException(error);
    }
  }
}
