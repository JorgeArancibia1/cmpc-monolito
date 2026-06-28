import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService, notDeleted } from '../prisma/prisma.service';
import { BookData, BooksRepository, FindBooksParams } from './books.repository';
import { BookWithRelations, bookInclude } from './books.serializer';

/**
 * Fuerza `relationLoadStrategy: 'join'`: Prisma carga las relaciones del `include` en **una sola
 * consulta** (LATERAL JOIN) en lugar de una por relación. Es más eficiente (un único viaje a la BD)
 * y evita el `DeprecationWarning` de `pg` por consultas concurrentes sobre la misma conexión.
 *
 * En Prisma 7.8 el nuevo cliente todavía no tipa esta opción, pero el motor la honra en runtime;
 * por eso el cast queda acotado a este único helper.
 */
function withJoin<T extends object>(args: T): T {
  return { ...args, relationLoadStrategy: 'join' } as T;
}

@Injectable()
export class PrismaBooksRepository implements BooksRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(params: FindBooksParams): Promise<BookWithRelations[]> {
    return this.prisma.book.findMany(
      withJoin({
        skip: params.skip,
        take: params.take,
        where: { ...params.where, ...notDeleted },
        orderBy: params.orderBy,
        include: bookInclude,
      }),
    );
  }

  count(where: Prisma.BookWhereInput): Promise<number> {
    return this.prisma.book.count({ where: { ...where, ...notDeleted } });
  }

  findById(id: string): Promise<BookWithRelations | null> {
    return this.prisma.book.findFirst(withJoin({ where: { id, ...notDeleted }, include: bookInclude }));
  }

  create(data: BookData, authorIds: string[]): Promise<BookWithRelations> {
    return this.prisma.book.create(
      withJoin({
        data: { ...data, authors: { create: authorIds.map((authorId) => ({ authorId })) } },
        include: bookInclude,
      }),
    );
  }

  /** Actualiza el libro y, si llegan autores, re-sincroniza la relación de forma atómica. */
  update(id: string, data: Partial<BookData>, authorIds?: string[]): Promise<BookWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      await tx.book.update({ where: { id }, data });
      if (authorIds) {
        await tx.bookAuthor.deleteMany({ where: { bookId: id } });
        await tx.bookAuthor.createMany({
          data: authorIds.map((authorId) => ({ bookId: id, authorId })),
        });
      }
      return tx.book.findUniqueOrThrow(withJoin({ where: { id }, include: bookInclude }));
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.book.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  findForExport(
    where: Prisma.BookWhereInput,
    orderBy: Prisma.BookOrderByWithRelationInput[],
  ): Promise<BookWithRelations[]> {
    return this.prisma.book.findMany(
      withJoin({ where: { ...where, ...notDeleted }, orderBy, include: bookInclude }),
    );
  }
}
