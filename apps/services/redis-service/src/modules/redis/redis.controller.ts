import { Controller, Post, Get, Delete, Body, Param } from '@nestjs/common';
import { RedisService } from './redis.service';
import { CreateRedisDto } from './model/create.redis.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Redis')
@ApiBearerAuth('access-token')
@Controller()
export class RedisController {
  constructor(private readonly redisService: RedisService) {}

  @Post()
  @ApiOperation({
    summary: 'Save data to Redis',
    description: 'Saves a key-value pair in Redis with an optional TTL.',
  })
  @ApiBody({
    type: CreateRedisDto,
    description: 'Redis data to save',
    required: true,
  })
  @ApiResponse({ status: 201, description: 'Data saved to Redis successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async set(@Body() createRedisDto: CreateRedisDto) {
    await this.redisService.set(createRedisDto);
    return { message: 'Data saved to Redis successfully' };
  }

  @Get(':key')
  @ApiOperation({
    summary: 'Get data from Redis',
    description:
      'Retrieves the value associated with the specified key from Redis.',
  })
  @ApiParam({
    name: 'key',
    type: 'string',
    description: 'The key to retrieve from Redis',
    example: 'user:1:token',
  })
  @ApiResponse({ status: 200, description: 'Data successfully retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Key not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async get(@Param('key') key: string) {
    const value = await this.redisService.get(key);
    if (value === null) {
      throw new Error(`Key ${key} not found`);
    }
    return { key, value };
  }

  @Delete(':key')
  @ApiOperation({
    summary: 'Delete data from Redis',
    description:
      'Removes the specified key and its associated value from Redis.',
  })
  @ApiParam({
    name: 'key',
    type: 'string',
    description: 'The key to delete from Redis',
    example: 'user:1:token',
  })
  @ApiResponse({ status: 200, description: 'Key deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Key not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async del(@Param('key') key: string) {
    await this.redisService.del(key);
    return { message: 'Key deleted successfully' };
  }

  @MessagePattern({ cmd: 'set' })
  async setPattern(@Payload() createRedisDto: CreateRedisDto) {
    await this.redisService.set(createRedisDto);
    return { success: true };
  }

  @MessagePattern({ cmd: 'get' })
  async getPattern(@Payload() key: string) {
    return await this.redisService.get(key);
  }

  @MessagePattern({ cmd: 'del' })
  async delPattern(@Payload() key: string) {
    await this.redisService.del(key);
    return { success: true };
  }
}
