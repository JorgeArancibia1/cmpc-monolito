/** Estrategia de almacenamiento de imágenes (DIP): Cloudinary en producción, disco local en dev. */
export const IMAGE_STORAGE = Symbol('IMAGE_STORAGE');

export interface ImageStorage {
  /** Sube un buffer de imagen ya validado y devuelve su URL pública. */
  upload(buffer: Buffer, folder?: string): Promise<string>;
}
