import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ImageStorage } from './image-storage';
import { imageExtension } from './image-type';

/** Almacenamiento en disco local (desarrollo, cuando Cloudinary no está configurado). */
@Injectable()
export class LocalImageStorage implements ImageStorage {
  static readonly DIR = join(process.cwd(), 'uploads');
  private readonly logger = new Logger(LocalImageStorage.name);

  constructor(private readonly config: ConfigService) {
    this.logger.warn('Cloudinary no está configurado: las imágenes se guardan en disco local (solo dev).');
  }

  async upload(buffer: Buffer, folder = 'cmpc-libros'): Promise<string> {
    const dir = join(LocalImageStorage.DIR, folder);
    await mkdir(dir, { recursive: true });
    const filename = `${randomUUID()}.${imageExtension(buffer)}`;
    await writeFile(join(dir, filename), buffer);
    const base = (this.config.get<string>('PUBLIC_URL') ?? 'http://localhost:3002').replace(/\/$/, '');
    return `${base}/uploads/${folder}/${filename}`;
  }
}
