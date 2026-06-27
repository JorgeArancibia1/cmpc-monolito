import { Injectable } from '@nestjs/common';
import { Prisma, Session } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Acceso a las sesiones de refresh (rotación con detección de reuso). */
@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.SessionUncheckedCreateInput): Promise<Session> {
    return this.prisma.session.create({ data });
  }

  findById(id: string): Promise<Session | null> {
    return this.prisma.session.findUnique({ where: { id } });
  }

  /** Revoca una sesión y registra cuál la reemplazó (al rotar). */
  revoke(id: string, replacedById: string): Promise<unknown> {
    return this.prisma.session.update({
      where: { id },
      data: { revokedAt: new Date(), replacedById },
    });
  }

  /** Revoca toda la familia: corta el robo de un refresh token reutilizado. */
  revokeFamily(familyId: string): Promise<unknown> {
    return this.prisma.session.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
