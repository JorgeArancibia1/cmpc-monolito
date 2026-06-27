import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ZodValidationPipe } from 'nestjs-zod';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuditInterceptor } from './audit/audit.interceptor';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';
import { AuthorsModule } from './catalog/authors.module';
import { GenresModule } from './catalog/genres.module';
import { PublishersModule } from './catalog/publishers.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { validateEnv } from './config/env';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    // Rate limiting global: 100 req/min por IP (los endpoints de auth lo restringen más).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuditModule,
    UsersModule,
    AuthModule,
    BooksModule,
    AuthorsModule,
    PublishersModule,
    GenresModule,
    AnalyticsModule,
  ],
  controllers: [HealthController],
  providers: [
    // Validación global de entrada con los esquemas Zod compartidos.
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    // Respuesta de error uniforme y con mensajes claros.
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // Rate limiting global (va primero, antes de autenticar).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Autenticar primero, autorizar por rol después.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    // Logging (externo) → Transform → Audit (interno, ve el dato sin envolver).
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
