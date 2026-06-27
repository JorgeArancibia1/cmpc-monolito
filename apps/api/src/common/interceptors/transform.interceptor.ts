import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RAW_RESPONSE_KEY } from '../decorators/raw-response.decorator';

/**
 * Envuelve toda respuesta exitosa en `{ success: true, data, meta? }`.
 * Las respuestas paginadas (`{ items, meta }`) exponen `meta` en el nivel superior.
 * Los endpoints marcados con @RawResponse() (p. ej. CSV) quedan intactos.
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const isRaw = this.reflector.getAllAndOverride<boolean>(RAW_RESPONSE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isRaw) {
      return next.handle();
    }

    return next.handle().pipe(
      map((payload) => {
        if (payload && typeof payload === 'object' && 'items' in payload && 'meta' in payload) {
          const { items, meta } = payload as { items: unknown; meta: unknown };
          return { success: true, data: items, meta };
        }
        return { success: true, data: payload };
      }),
    );
  }
}
