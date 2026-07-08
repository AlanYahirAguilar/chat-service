import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { StorageService } from './storage.service';

@Controller()
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @MessagePattern({ cmd: 'uploadBuffer' })
  async uploadBuffer(
    @Payload() data: { pdfBuffer: any; blobName: string; mimetype: string },
  ) {
    let buffer: Buffer;
    if (data.pdfBuffer && data.pdfBuffer.type === 'Buffer') {
      buffer = Buffer.from(data.pdfBuffer.data);
    } else {
      buffer = Buffer.from(data.pdfBuffer);
    }
    return await this.storageService.uploadBuffer(
      buffer,
      data.blobName,
      data.mimetype,
    );
  }
}
