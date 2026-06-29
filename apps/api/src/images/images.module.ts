import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudinaryStorage } from './cloudinary.storage';
import { IMAGE_STORAGE } from './image-storage';
import { ImagesService } from './images.service';
import { LocalImageStorage } from './local.storage';

@Module({
  providers: [
    ImagesService,
    {
      // Elige la estrategia según el entorno: Cloudinary si está configurado, disco local si no.
      provide: IMAGE_STORAGE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const cloudName = config.get<string>('CLOUDINARY_CLOUD_NAME')?.trim();
        const apiKey = config.get<string>('CLOUDINARY_API_KEY')?.trim();
        const apiSecret = config.get<string>('CLOUDINARY_API_SECRET')?.trim();
        const configured = Boolean(cloudName && apiKey && apiSecret);

        return configured ? new CloudinaryStorage(config) : new LocalImageStorage(config);
      },
    },
  ],
  exports: [ImagesService],
})
export class ImagesModule {}
