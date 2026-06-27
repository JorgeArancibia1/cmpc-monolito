import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService, notDeleted } from '../prisma/prisma.service';
import { BookData, BooksRepository, FindBooksParams } from './books.repository';
import { BookWithRelations, bookInclude } from './books.serializer';

@Injectable()
export class PrismaBooksRepository implements BooksRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(params: FindBooksParams): Promise<BookWithRelations[]> {
    return this.prisma.book.findMany({
      skip: params.skip,
      take: params.take,
      where: { ...params.where, ...notDeleted },
      orderBy: params.orderBy,
      include: bookInclude,
    });
  }

  count(where: Prisma.BookWhereInput): Promise<number> {
    return this.prisma.book.count({ where: { ...where, ...notDeleted } });
  }

  findById(id: string): Promise<BookWithRelations | null> {
    return this.prisma.book.findFirst({ where: { id, ...notDeleted }, include: bookInclude });
  }

  create(data: BookData, authorIds: string[]): Promise<BookWithRelations> {
    return this.prisma.book.create({
      data: { ...data, authors: { create: authorIds.map((authorId) => ({ authorId })) } },
      include: bookInclude,
    });
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
      return tx.book.findUniqueOrThrow({ where: { id }, include: bookInclude });
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.book.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  findForExport(
    where: Prisma.BookWhereInput,
    orderBy: Prisma.BookOrderByWithRelationInput[],
  ): Promise<BookWithRelations[]> {
    return this.prisma.book.findMany({
      where: { ...where, ...notDeleted },
      orderBy,
      include: bookInclude,
    });
  }
}
