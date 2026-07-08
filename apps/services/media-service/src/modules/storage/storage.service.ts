import { Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Injectable } from '@nestjs/common';
import { BlobServiceClient } from '@azure/storage-blob';
import * as crypto from 'crypto';
import { CustomLoggerService } from '@syncslot/shared';
@Injectable()
export class StorageService {
  private blobServiceClient: BlobServiceClient;
  private containerName =
    process.env.AZURE_STORAGE_CONTAINER_NAME || 'public-media';
  constructor(private readonly logger: CustomLoggerService) {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
    if (connectionString) {
      this.blobServiceClient =
        BlobServiceClient.fromConnectionString(connectionString);
      // Auto-create the container in background
      this.ensureContainerExists().catch((error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error(
          `Critical failure initializing Azure container: ${err.message}`,
          err.stack,
          'STORAGE',
        );
      });
    } else {
      this.logger.warn('AZURE_STORAGE_CONNECTION_STRING is not set', 'STORAGE');
    }
  }
  /**
   * Assures that the container exists with public access
   */
  private async ensureContainerExists(): Promise<void> {
    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName,
    );
    const createResponse = await containerClient.createIfNotExists({
      access: 'blob',
    });
    if (createResponse.succeeded) {
      this.logger.log(
        `Azure container '${this.containerName}' created successfully with public read access`,
        'STORAGE',
      );
    } else {
      this.logger.log(
        `Azure container '${this.containerName}' verified (already exists)`,
        'STORAGE',
      );
    }
  }
  async uploadFile(file: Express.Multer.File): Promise<{ url: string }> {
    try {
      if (!this.blobServiceClient) {
        throw new Error('Azure Blob Storage no está configurado');
      }
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `media/${crypto.randomUUID()}.${fileExtension}`;
      this.logger.log(`Iniciando subida de archivo: ${fileName}`, 'STORAGE');
      const containerClient = this.blobServiceClient.getContainerClient(
        this.containerName,
      );
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);
      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: { blobContentType: file.mimetype },
      });
      const publicUrl = blockBlobClient.url;
      this.logger.log(`Archivo subido exitosamente: ${publicUrl}`, 'STORAGE');
      return { url: publicUrl };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Error en uploadFile: ${err.message}`,
        err.stack,
        'STORAGE',
      );
      throw err;
    }
  }
  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    mimetype: string,
  ): Promise<{ url: string }> {
    try {
      if (!this.blobServiceClient) {
        throw new Error('Azure Blob Storage no está configurado');
      }
      this.logger.log(`Iniciando subida de buffer: ${fileName}`, 'STORAGE');
      const containerClient = this.blobServiceClient.getContainerClient(
        this.containerName,
      );
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);
      await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: { blobContentType: mimetype },
      });
      const publicUrl = blockBlobClient.url;
      this.logger.log(`Buffer subido exitosamente: ${publicUrl}`, 'STORAGE');
      return { url: publicUrl };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Error en uploadBuffer: ${err.message}`,
        err.stack,
        'STORAGE',
      );
      throw err;
    }
  }
  async downloadFile(fileUrlOrBlobName: string): Promise<Buffer> {
    try {
      if (!this.blobServiceClient) {
        throw new Error('Azure Blob Storage no está configurado');
      }
      let blobName = fileUrlOrBlobName;
      if (fileUrlOrBlobName.startsWith('http')) {
        const urlParts = new URL(fileUrlOrBlobName);
        const pathname = urlParts.pathname;
        const prefix = `/${this.containerName}/`;
        if (pathname.startsWith(prefix)) {
          blobName = pathname.substring(prefix.length);
        }
      }
      this.logger.log(
        `Descargando archivo desde Azure Blob: ${blobName}`,
        'STORAGE',
      );
      const containerClient = this.blobServiceClient.getContainerClient(
        this.containerName,
      );
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      const downloadResponse = await blockBlobClient.download();
      const chunks: Buffer[] = [];
      const stream = downloadResponse.readableStreamBody;
      if (!stream) {
        throw new Error('No se pudo obtener el stream del blob');
      }
      for (const chunk of stream as any) {
        chunks.push(Buffer.from(chunk as Uint8Array));
      }
      return Buffer.concat(chunks);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Error en downloadFile: ${err.message}`,
        err.stack,
        'STORAGE',
      );
      throw err;
    }
  }
  async listFiles(prefix?: string): Promise<{ name: string; mtime: Date }[]> {
    try {
      if (!this.blobServiceClient) {
        throw new Error('Azure Blob Storage no está configurado');
      }
      this.logger.log(
        `Listando archivos con prefijo: ${prefix || 'todos'}`,
        'STORAGE',
      );
      const containerClient = this.blobServiceClient.getContainerClient(
        this.containerName,
      );
      const files: { name: string; mtime: Date }[] = [];
      const listOptions = prefix ? { prefix } : undefined;
      for await (const blob of containerClient.listBlobsFlat(listOptions)) {
        files.push({
          name: blob.name,
          mtime: blob.properties.lastModified || new Date(),
        });
      }
      return files;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Error en listFiles: ${err.message}`,
        err.stack,
        'STORAGE',
      );
      throw err;
    }
  }
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      this.logger.log(
        `Iniciando eliminación de archivo: ${fileUrl}`,
        'STORAGE',
      );
      if (!fileUrl || typeof fileUrl !== 'string' || !this.blobServiceClient) {
        this.logger.warn(
          `URL inválida o cliente no configurado: ${fileUrl}`,
          'STORAGE',
        );
        return;
      }
      const urlParts = new URL(fileUrl);
      const pathname = urlParts.pathname;
      const prefix = `/${this.containerName}/`;
      if (!pathname.startsWith(prefix)) {
        this.logger.warn(
          `URL no coincide con el contenedor esperado: ${fileUrl}`,
          'STORAGE',
        );
        return;
      }
      const blobName = pathname.substring(prefix.length);
      const containerClient = this.blobServiceClient.getContainerClient(
        this.containerName,
      );
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.deleteIfExists();
      this.logger.log(`Archivo eliminado exitosamente: ${fileUrl}`, 'STORAGE');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Error en deleteFile: ${err.message}`,
        err.stack,
        'STORAGE',
      );
      return;
    }
  }
}
