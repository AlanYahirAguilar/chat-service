import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  ParseIntPipe,
  Query,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePrivilege } from '../auth/decorators/require.privilege.decorator';
import { firstValueFrom } from 'rxjs';

@ApiTags('Resources')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('resources')
export class ResourceController {
  constructor(
    @Inject('RESERVATION_SERVICE')
    private readonly reservationClient: ClientProxy,
  ) {}

  @Post()
  @RequirePrivilege('resources:create')
  @ApiOperation({
    summary: 'Create a new resource',
    description: 'Creates a new resource with optional schedules.',
  })
  @ApiResponse({ status: 201, description: 'Resource successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async create(@Body() createResourceDto: any) {
    return firstValueFrom(
      this.reservationClient.send({ cmd: 'createResource' }, createResourceDto),
    );
  }

  @Get()
  @RequirePrivilege('resources:read')
  @ApiOperation({
    summary: 'Get all resources',
    description: 'Returns a list of all available resources.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of resources successfully retrieved.',
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return firstValueFrom(
      this.reservationClient.send(
        { cmd: 'findAllResources' },
        { page: Number(page), limit: Number(limit) },
      ),
    );
  }

  @Get(':id')
  @RequirePrivilege('resources:read')
  @ApiOperation({
    summary: 'Get resource by ID',
    description: 'Returns detailed information of a specific resource.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Resource ID',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Resource successfully retrieved.' })
  @ApiResponse({ status: 404, description: 'Resource not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return firstValueFrom(
      this.reservationClient.send({ cmd: 'findOneResource' }, BigInt(id)),
    );
  }

  @Put(':id')
  @RequirePrivilege('resources:update')
  @ApiOperation({
    summary: 'Update a resource',
    description: 'Updates the information of an existing resource.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Resource ID',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Resource successfully updated.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 404, description: 'Resource not found.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateResourceDto: any,
  ) {
    return firstValueFrom(
      this.reservationClient.send(
        { cmd: 'updateResource' },
        { id: BigInt(id), dto: updateResourceDto },
      ),
    );
  }

  @Delete(':id')
  @RequirePrivilege('resources:delete')
  @ApiOperation({
    summary: 'Delete a resource',
    description:
      'Removes a resource and its associated schedules from the system.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Resource ID',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Resource successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Resource not found.' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return firstValueFrom(
      this.reservationClient.send({ cmd: 'removeResource' }, BigInt(id)),
    );
  }
}
