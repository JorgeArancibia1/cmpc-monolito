import { Injectable, Logger } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PaginatedResult, buildMeta, skipOf } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEntry {
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  changes?: unknown;
  userId?: string | null;
  ip?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Registra una operación. Nunca lanza: la auditoría no debe interrumpir la operación. */
  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId ?? null,
          changes: (entry.changes ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          userId: entry.userId ?? null,
          ip: entry.ip ?? null,
        },
      });
    } catch (error) {
      this.logger.warn(`No se pudo registrar la auditoría: ${(error as Error).message}`);
    }
  }

  async findAll(page: number, pageSize: number): Promise<PaginatedResult<unknown>> {
    // Forma de callback (consultas secuenciales) para no disparar el aviso del driver pg.
    const { items, total } = await this.prisma.$transaction(async (tx) => {
      const items = await tx.auditLog.findMany({
        skip: skipOf(page, pageSize),
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      });
      const total = await tx.auditLog.count();
      return { items, total };
    });
    return { items, meta: buildMeta(total, page, pageSize) };
  }
}
