import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { unlink } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {}

  async uploadImage(file: Express.Multer.File): Promise<{ url: string; filename: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // In production, you would upload to S3/R2 here
    // For development, we return the local path
    const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3001';
    const url = `${baseUrl}/uploads/${file.filename}`;

    return {
      url,
      filename: file.filename,
    };
  }

  async uploadDocument(file: Express.Multer.File): Promise<{ url: string; filename: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3001';
    const url = `${baseUrl}/uploads/${file.filename}`;

    return {
      url,
      filename: file.filename,
    };
  }

  async deleteFile(filename: string): Promise<void> {
    const uploadDir = this.configService.get<string>('UPLOAD_DEST') || './uploads';
    const filePath = join(uploadDir, filename);
    
    try {
      await unlink(filePath);
    } catch (error) {
      // File might not exist, that's okay
    }
  }
}

