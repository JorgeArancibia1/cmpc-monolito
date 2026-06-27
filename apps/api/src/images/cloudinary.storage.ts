import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import type { ImageStorage } from './image-storage';

/** Almacenamiento en Cloudinary (producción). */
@Injectable()
export class CloudinaryStorage implements ImageStorage {
  constructor(config: ConfigService) {
    cloudinary.config({
      cloud_name: config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: config.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  upload(buffer: Buffer, folder = 'cmpc-libros'): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
        if (error || !result) {
          return reject(error ?? new Error('No se pudo subir la imagen'));
        }
        resolve(result.secure_url);
      });
      stream.end(buffer);
    });
  }
}
