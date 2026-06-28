import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

const ACTION_BY_METHOD: Record<string, AuditAction | undefined> = {
  POST: AuditAction.CREATE,
  PATCH: AuditAction.UPDATE,
  PUT: AuditAction.UPDATE,
  DELETE: AuditAction.DELETE,
};

/** Primer segmento de ruta → entidad auditable. */
const ENTITY_BY_RESOURCE: Record<string, string> = {
  books: 'Book',
  authors: 'Author',
  publishers: 'Publisher',
  genres: 'Genre',
};

/**
 * Registra de forma transversal toda mutación sobre las entidades de dominio,
 * sin acoplar la lógica a cada servicio (DRY / responsabilidad única).
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const action = ACTION_BY_METHOD[req.method];

    return next.handle().pipe(
      tap((data) => {
        if (!action) {
          return;
        }
        const entity = this.entityFromPath(req);
        if (!entity) {
          return;
        }
        const entityId =
          (req.params?.id as string) ??
          (data && typeof data === 'object' && 'id' in data ? (data as { id: string }).id : null);

        // Fire-and-forget deliberado: la auditoría no debe bloquear ni fallar la operación
        // de negocio. Los errores se logean como WARN (ver AuditService.record). Para un
        // sistema de auditoría de alta confiabilidad se utilizaría un outbox transaccional,
        // lo que está fuera del alcance de este proyecto.
        void this.audit.record({
          action,
          entity,
          entityId,
          userId: (req.user as { id?: string })?.id ?? null,
          ip: req.ip ?? null,
          changes: action === AuditAction.DELETE ? null : this.sanitize(req.body),
        });
      }),
    );
  }

  private entityFromPath(req: Request): string | undefined {
    const segments = req.path.split('/').filter(Boolean);
    const resource = segments[0] === 'api' ? segments[1] : segments[0];
    return resource ? ENTITY_BY_RESOURCE[resource] : undefined;
  }

  private sanitize(body: unknown): Record<string, unknown> | null {
    if (!body || typeof body !== 'object') {
      return null;
    }
    const clone = { ...(body as Record<string, unknown>) };
    delete clone.password;
    return clone;
  }
}
