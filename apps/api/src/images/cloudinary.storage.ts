import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import type { ImageStorage } from './image-storage';

/** Almacenamiento en Cloudinary (producción). */
@Injectable()
export class CloudinaryStorage implements ImageStorage {
  private readonly logger = new Logger(CloudinaryStorage.name);

  constructor(config: ConfigService) {
    const cloudName = config.get<string>('CLOUDINARY_CLOUD_NAME')?.trim();
    const apiKey = config.get<string>('CLOUDINARY_API_KEY')?.trim();
    const apiSecret = config.get<string>('CLOUDINARY_API_SECRET')?.trim();

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  upload(buffer: Buffer, folder = 'cmpc-libros'): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
        if (error || !result) {
          const message = error?.message ?? 'Cloudinary no devolvió resultado';
          this.logger.error(
            `Cloudinary upload failed: ${message}`,
            JSON.stringify({
              name: error?.name,
              message: error?.message,
              httpCode: (error as { http_code?: number } | undefined)?.http_code,
            }),
          );
          return reject(new Error(`Cloudinary upload failed: ${message}`));
        }
        resolve(result.secure_url);
      });
      stream.end(buffer);
    });
  }
}
