import { CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

interface RequestWithContext extends Request {
  requestId?: string;
  user?: { id?: string };
}

/**
 * Logging estructurado: una línea **JSON** por petición con un **requestId** de correlación
 * (Twelve-Factor XI: logs como flujo a stdout, listos para ingerir por un SIEM).
 * El `requestId` se devuelve también en la cabecera `X-Request-Id`.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<RequestWithContext>();
    const res = http.getResponse<Response>();

    const requestId = (req.headers?.['x-request-id'] as string) || randomUUID();
    req.requestId = requestId;
    res.setHeader?.('X-Request-Id', requestId);

    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.write('info', req, requestId, res.statusCode, startedAt),
        error: (err: unknown) => {
          const status = err instanceof HttpException ? err.getStatus() : 500;
          this.write(status >= 500 ? 'error' : 'warn', req, requestId, status, startedAt);
        },
      }),
    );
  }

  private write(
    level: 'info' | 'warn' | 'error',
    req: RequestWithContext,
    requestId: string,
    statusCode: number,
    startedAt: number,
  ): void {
    const entry = {
      level,
      time: new Date().toISOString(),
      requestId,
      method: req.method,
      url: req.originalUrl ?? req.url,
      statusCode,
      durationMs: Date.now() - startedAt,
      userId: req.user?.id ?? null,
      ip: req.ip ?? null,
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(entry));
  }
}
