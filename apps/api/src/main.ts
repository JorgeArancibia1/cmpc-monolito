// Punto de entrada de la API: configura CORS, cookies, validación y Swagger.
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  // Sirve las imágenes guardadas en disco local (fallback de dev cuando no hay Cloudinary).
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });
  // Cabeceras de seguridad (HSTS, nosniff, frameguard, etc.). Se desactiva la CSP de helmet:
  // la API devuelve JSON (la CSP del front la pone Nginx) y así no se rompe la UI de Swagger.
  // CORP en 'cross-origin' porque la API la consume el SPA desde otro origen.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  // Detrás de un proxy (Render/Nginx): confía en X-Forwarded-* para la IP real
  // (auditoría y rate limiting correctos).
  app.set('trust proxy', 1);

  // CORS fail-closed: solo se permiten los orígenes declarados en CORS_ORIGIN (lista por comas).
  // Si no hay ninguno, se rechaza todo (nunca reflejar cualquier origen con credenciales).
  const corsOrigins =
    config
      .get<string>('CORS_ORIGIN')
      ?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [];
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : false,
    credentials: true,
  });

  // Twelve-Factor #9 (desechabilidad): apagado elegante. Cierra conexiones (Prisma)
  // y termina peticiones en curso al recibir SIGTERM/SIGINT.
  app.enableShutdownHooks();

  // Swagger solo fuera de producción (no exponer la superficie de la API en prod).
  if (config.get('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('CMPC Libros API')
      .setDescription('API REST para la gestión del catálogo de libros')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = cleanupOpenApiDoc(SwaggerModule.createDocument(app, swaggerConfig));
    SwaggerModule.setup('api/docs', app, document);
  }

  // Twelve-Factor #7 (asignación de puertos): respeta PORT si la plataforma lo inyecta.
  const port = Number(process.env.PORT) || config.get<number>('API_PORT', 3002);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API disponible en http://localhost:${port}/api · Swagger en /api/docs`);
}

void bootstrap();
