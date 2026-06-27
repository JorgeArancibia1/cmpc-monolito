import { Prisma } from '@prisma/client';
import { BookWithRelations } from './books.serializer';

export interface FindBooksParams {
  skip: number;
  take: number;
  where: Prisma.BookWhereInput;
  orderBy: Prisma.BookOrderByWithRelationInput[];
}

export interface BookData {
  title: string;
  isbn?: string | null;
  description?: string | null;
  price: number;
  stock: number;
  publishedYear?: number | null;
  imageUrl?: string | null;
  publisherId: string;
  genreId: string;
}

/**
 * Abstracción de persistencia de libros (Dependency Inversion). El servicio depende
 * de esta interfaz, no de Prisma: facilita el testeo y aísla el acceso a datos.
 */
export interface BooksRepository {
  findMany(params: FindBooksParams): Promise<BookWithRelations[]>;
  count(where: Prisma.BookWhereInput): Promise<number>;
  findById(id: string): Promise<BookWithRelations | null>;
  create(data: BookData, authorIds: string[]): Promise<BookWithRelations>;
  update(id: string, data: Partial<BookData>, authorIds?: string[]): Promise<BookWithRelations>;
  softDelete(id: string): Promise<void>;
  findForExport(
    where: Prisma.BookWhereInput,
    orderBy: Prisma.BookOrderByWithRelationInput[],
  ): Promise<BookWithRelations[]>;
}

export const BOOKS_REPOSITORY = Symbol('BOOKS_REPOSITORY');
