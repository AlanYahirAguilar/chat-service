import { RpcException } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MediaEntity } from './entity/media.entity';
import { UpdateMediaDTO } from './model/update.media.dto';
import { StorageService } from '../storage/storage.service';
import { CustomLoggerService } from '@syncslot/shared';
@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(MediaEntity)
    private readonly mediaRepository: Repository<MediaEntity>,
    private readonly storageService: StorageService,
    private readonly logger: CustomLoggerService,
  ) {}
  async uploadFiles(
    files: Express.Multer.File[],
    entityId: bigint,
    entityType: string,
  ) {
    try {
      this.logger.log(
        `Starting upload of ${files.length} media files for entity ${entityId} (${entityType})`,
        'MEDIA',
      );
      const uploadedFiles = await Promise.all(
        files.map((file) => this.storageService.uploadFile(file)),
      );
      const mediaToSave = uploadedFiles.map((result, index) => {
        const mimeType = files[index].mimetype;
        let fileType: 'IMAGE' | 'PDF' | 'VIDEO' | 'OTHER' = 'OTHER';
        if (mimeType.startsWith('image/')) {
          fileType = 'IMAGE';
        } else if (mimeType === 'application/pdf') {
          fileType = 'PDF';
        } else if (mimeType.startsWith('video/')) {
          fileType = 'VIDEO';
        }
        return {
          url: result.url,
          fileType,
          displayOrder: index,
          entityId,
          entityType,
        };
      });
      const savedMedia = await this.mediaRepository.save(mediaToSave);
      this.logger.log(
        `Files uploaded, saved and associated successfully: ${savedMedia.map((m) => m.id).join(', ')}`,
        'MEDIA',
      );
      return savedMedia;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        '[MediaService_uploadFiles] Error uploading media files',
        err.stack,
        'EXCEPTION',
      );
      throw new BadRequestException(
        err.message || 'Error uploading media files',
      );
    }
  }
  async deleteFiles(ids: bigint[]) {
    try {
      if (!ids?.length) {
        this.logger.warn('Delete attempt without IDs', 'MEDIA');
        throw new BadRequestException('No IDs provided for deletion');
      }
      this.logger.log(
        `Starting deletion of ${ids.length} media files`,
        'MEDIA',
      );
      const mediaRecords = await this.mediaRepository.find({
        where: ids.map((id) => ({ id })),
      });
      if (!mediaRecords.length) {
        this.logger.warn('No media files found for deletion', 'MEDIA');
        throw new BadRequestException('No media files found to delete');
      }
      await Promise.all(
        mediaRecords.map((media) => this.storageService.deleteFile(media.url)),
      );
      const deleteResult = await this.mediaRepository.delete({ id: In(ids) });
      if (deleteResult.affected !== ids.length) {
        this.logger.warn(
          `Warning: Not all records were deleted. Expected: ${ids.length}, Deleted: ${deleteResult.affected}`,
          'MEDIA',
        );
      }
      this.logger.log(
        `Successfully deleted media files: ${ids.join(', ')}`,
        'MEDIA',
      );
      return {
        message: 'Media files deleted successfully',
        deletedCount: deleteResult.affected,
        totalRequested: ids.length,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        '[MediaService_deleteFiles] Error deleting media files',
        err.stack,
        'EXCEPTION',
      );
      throw new BadRequestException(
        err.message || 'Error deleting media files',
      );
    }
  }
  async update(
    updateMediaDtos: UpdateMediaDTO[],
    entityId: bigint,
    entityType: string,
  ) {
    try {
      const result: MediaEntity[] = [];
      for (const dto of updateMediaDtos) {
        const media = await this.mediaRepository.findOne({
          where: { id: dto.id },
        });
        if (!media) throw new RpcException(`Media not found: ${dto.id}`);
        Object.assign(media, dto);
        media.entityId = entityId;
        media.entityType = entityType;
        await this.mediaRepository.update({ id: dto.id }, media);
        const updated = await this.mediaRepository.findOne({
          where: { id: dto.id },
        });
        if (updated) result.push(updated);
      }
      return result;
    } catch (error) {
      throw new RpcException(error);
    }
  }
  async findByEntityId(entityId: bigint, entityType: string) {
    try {
      const media = await this.mediaRepository.find({
        where: { entityId, entityType },
      });
      return media;
    } catch (error) {
      throw new RpcException(error);
    }
  }
  async getFirstImageByEntityId(entityId: bigint, entityType: string) {
    try {
      const media = await this.mediaRepository.findOne({
        where: {
          entityId,
          entityType,
          fileType: 'IMAGE',
          status: 'ACTIVE',
        },
        order: { displayOrder: 'ASC' },
      });
      return media;
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
