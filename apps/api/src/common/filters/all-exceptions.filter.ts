import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import type { ZodError } from 'zod';

interface FieldError {
  field: string;
  message: string;
}

/**
 * Traduce cualquier error a una respuesta uniforme con **mensajes claros para el usuario**
 * (sin tecnicismos):
 *   { success: false, error: { message, code?, fields? }, path, timestamp }
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, code, message, fields } = this.resolve(exception);

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        this.errorDetails(exception),
      );
    }

    response.status(status).json({
      success: false,
      error: { message, code, ...(fields ? { fields } : {}) },
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private resolve(exception: unknown): {
    status: number;
    code: string;
    message: string;
    fields?: FieldError[];
  } {
    // 1) Errores de validación (Zod): devolvemos los mensajes amigables por campo.
    if (exception instanceof ZodValidationException) {
      const issues = (exception.getZodError() as ZodError).issues;
      const fields = issues.map((issue) => ({
        field: issue.path.join('.') || 'general',
        message: issue.message,
      }));
      return {
        status: HttpStatus.BAD_REQUEST,
        code: 'VALIDACION',
        message: fields[0]?.message ?? 'Revisa los datos ingresados.',
        fields,
      };
    }

    // 2) Errores de base de datos (Prisma) → mensajes humanos.
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.fromPrisma(exception);
    }

    // 3) Excepciones HTTP de Nest.
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const raw = typeof res === 'string' ? res : ((res as { message?: unknown }).message ?? exception.message);
      const message = Array.isArray(raw) ? String(raw[0]) : this.humanizeHttp(status, String(raw));
      return { status, code: this.codeFor(status), message };
    }

    // 4) Cualquier otra cosa: error genérico (no exponemos detalles internos).
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'ERROR_INTERNO',
      message: 'Ocurrió un error inesperado. Por favor, inténtalo nuevamente.',
    };
  }

  private fromPrisma(e: Prisma.PrismaClientKnownRequestError) {
    switch (e.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          code: 'DUPLICADO',
          message: 'Ya existe un registro con esos datos.',
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          code: 'NO_ENCONTRADO',
          message: 'No encontramos lo que buscas.',
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'REFERENCIA_INVALIDA',
          message: 'Alguno de los datos seleccionados no es válido.',
        };
      default:
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'ERROR_DATOS',
          message: 'No pudimos procesar la solicitud. Revisa los datos e inténtalo otra vez.',
        };
    }
  }

  /** Reemplaza mensajes técnicos por defecto de Nest por frases claras. */
  private humanizeHttp(status: number, message: string): string {
    const looksTechnical = /cannot (get|post|put|patch|delete)/i.test(message);
    if (looksTechnical) {
      const defaults: Record<number, string> = {
        401: 'Debes iniciar sesión para continuar.',
        403: 'No tienes permisos para realizar esta acción.',
        404: 'No encontramos lo que buscas.',
      };
      return defaults[status] ?? 'No pudimos completar la solicitud.';
    }
    return message;
  }

  private codeFor(status: number): string {
    const map: Record<number, string> = {
      400: 'SOLICITUD_INVALIDA',
      401: 'NO_AUTENTICADO',
      403: 'SIN_PERMISOS',
      404: 'NO_ENCONTRADO',
      409: 'CONFLICTO',
    };
    return map[status] ?? 'ERROR';
  }

  private errorDetails(exception: unknown): string {
    if (exception instanceof Error) {
      const details = {
        name: exception.name,
        message: exception.message,
        stack: exception.stack,
        cause: exception.cause,
      };
      return JSON.stringify(details);
    }
    try {
      return JSON.stringify(exception);
    } catch {
      return String(exception);
    }
  }
}
