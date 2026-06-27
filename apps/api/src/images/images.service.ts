import { Inject, Injectable } from '@nestjs/common';
import { IMAGE_STORAGE, type ImageStorage } from './image-storage';

/** Fachada de carga de imágenes: delega en la estrategia de almacenamiento configurada. */
@Injectable()
export class ImagesService {
  constructor(@Inject(IMAGE_STORAGE) private readonly storage: ImageStorage) {}

  /** Sube un buffer de imagen y devuelve su URL pública. */
  uploadBuffer(buffer: Buffer, folder = 'cmpc-libros'): Promise<string> {
    return this.storage.upload(buffer, folder);
  }
}
