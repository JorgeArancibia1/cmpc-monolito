import type { PageMeta } from '@cmpc/contracts';
import { paginationSchema } from '@cmpc/contracts';
import { createZodDto } from 'nestjs-zod';

/** DTO de paginación reutilizable, derivado del contrato compartido. */
export class PaginationDto extends createZodDto(paginationSchema) {}

export function buildMeta(total: number, page: number, pageSize: number): PageMeta {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export function skipOf(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PageMeta;
}
