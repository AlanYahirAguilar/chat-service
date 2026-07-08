import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MediaService } from './media.service';

import { UploadMediaDto } from './model/upload.media.dto';

@Controller()
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @MessagePattern({ cmd: 'uploadFiles' })
  async uploadFiles(
    @Payload() data: { files: any[]; uploadMediaDto: UploadMediaDto },
  ) {
    if (!data.files || data.files.length === 0) {
      return { success: false, message: 'No files provided' };
    }
    const entityId = BigInt(data.uploadMediaDto.entityId);
    return await this.mediaService.uploadFiles(
      data.files,
      entityId,
      data.uploadMediaDto.entityType,
    );
  }

  @MessagePattern({ cmd: 'deleteMedia' })
  async deleteMedia(@Payload() idsString: string) {
    if (!idsString) return { message: 'No IDs provided' };
    const ids = idsString.split(',').map((id) => BigInt(id.trim()));
    return await this.mediaService.deleteFiles(ids);
  }
}
