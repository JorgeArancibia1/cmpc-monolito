import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

/**
 * Acceso a datos centralizado. Usa el driver adapter de PostgreSQL.
 *
 * La política de soft delete se aplica de forma explícita en repositorios y servicios
 * (las lecturas filtran `deletedAt: null`; el borrado hace `update`), lo que la mantiene
 * visible y fácil de testear.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    super({
      adapter: new PrismaPg({ connectionString: config.getOrThrow<string>('DATABASE_URL') }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Conexión a la base de datos establecida');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

/** Predicado reutilizable para excluir registros eliminados lógicamente. */
export const notDeleted = { deletedAt: null } as const;
