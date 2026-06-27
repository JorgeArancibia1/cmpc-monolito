import type {
  Book,
  CreateBookInput,
  QueryBooksInput,
  UpdateBookInput,
} from '@cmpc/contracts';
import { sortableFields } from '@cmpc/contracts';
import { writeToString } from '@fast-csv/format';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginatedResult, buildMeta, skipOf } from '../common/pagination';
import { BOOKS_REPOSITORY, BookData, BooksRepository } from './books.repository';
import { toBook } from './books.serializer';

const SORTABLE = new Set<string>(sortableFields);

@Injectable()
export class BooksService {
  constructor(@Inject(BOOKS_REPOSITORY) private readonly repo: BooksRepository) {}

  async findAll(query: QueryBooksInput): Promise<PaginatedResult<Book>> {
    const where = this.buildWhere(query);
    const orderBy = this.buildOrderBy(query.sort);
    const [books, total] = await Promise.all([
      this.repo.findMany({ skip: skipOf(query.page, query.pageSize), take: query.pageSize, where, orderBy }),
      this.repo.count(where),
    ]);
    return { items: books.map(toBook), meta: buildMeta(total, query.page, query.pageSize) };
  }

  async findOne(id: string): Promise<Book> {
    const book = await this.repo.findById(id);
    if (!book) {
      throw new NotFoundException('No encontramos el libro que buscas.');
    }
    return toBook(book);
  }

  async create(input: CreateBookInput): Promise<Book> {
    return toBook(await this.repo.create(this.toData(input), input.authorIds));
  }

  async update(id: string, input: UpdateBookInput): Promise<Book> {
    await this.ensureExists(id);
    return toBook(await this.repo.update(id, this.toData(input), input.authorIds));
  }

  async remove(id: string): Promise<{ id: string; deleted: true }> {
    await this.ensureExists(id);
    await this.repo.softDelete(id);
    return { id, deleted: true };
  }

  async setImageUrl(id: string, imageUrl: string): Promise<Book> {
    await this.ensureExists(id);
    return toBook(await this.repo.update(id, { imageUrl }));
  }

  async exportCsv(query: QueryBooksInput): Promise<string> {
    const books = await this.repo.findForExport(this.buildWhere(query), this.buildOrderBy(query.sort));
    const rows = books.map(toBook).map((b) => ({
      id: b.id,
      titulo: this.csvSafe(b.title),
      isbn: this.csvSafe(b.isbn ?? ''),
      autores: this.csvSafe(b.authors.map((a) => a.name).join(' | ')),
      editorial: this.csvSafe(b.publisher.name),
      genero: this.csvSafe(b.genre.name),
      precio: b.price,
      stock: b.stock,
      disponible: b.available ? 'Sí' : 'No',
      anio: b.publishedYear ?? '',
      creado: b.createdAt,
    }));
    return writeToString(rows, { headers: true });
  }

  /** Previene CSV/formula injection: neutraliza valores que empiezan por = + - @ (o tab/CR). */
  private csvSafe(value: string): string {
    return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  }

  private async ensureExists(id: string): Promise<void> {
    if (!(await this.repo.findById(id))) {
      throw new NotFoundException('No encontramos el libro que buscas.');
    }
  }

  private toData(input: Partial<CreateBookInput>): BookData {
    const data: Partial<BookData> = {
      title: input.title,
      isbn: input.isbn ?? null,
      description: input.description ?? null,
      price: input.price,
      stock: input.stock,
      publishedYear: input.publishedYear ?? null,
      publisherId: input.publisherId,
      genreId: input.genreId,
    };
    Object.keys(data).forEach((key) => {
      if (data[key as keyof BookData] === undefined) {
        delete data[key as keyof BookData];
      }
    });
    return data as BookData;
  }

  private buildWhere(query: QueryBooksInput): Prisma.BookWhereInput {
    const where: Prisma.BookWhereInput = {};
    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }
    if (query.genreId) {
      where.genreId = query.genreId;
    }
    if (query.publisherId) {
      where.publisherId = query.publisherId;
    }
    if (query.authorId) {
      where.authors = { some: { authorId: query.authorId } };
    }
    if (query.available !== undefined) {
      where.stock = query.available ? { gt: 0 } : { lte: 0 };
    }
    return where;
  }

  private buildOrderBy(sort?: string): Prisma.BookOrderByWithRelationInput[] {
    const fallback: Prisma.BookOrderByWithRelationInput[] = [{ createdAt: 'desc' }];
    if (!sort) {
      return fallback;
    }
    const orderBy = sort
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean)
      .map((token) => {
        const desc = token.startsWith('-');
        const field = desc ? token.slice(1) : token;
        return SORTABLE.has(field)
          ? ({ [field]: desc ? 'desc' : 'asc' } as Prisma.BookOrderByWithRelationInput)
          : null;
      })
      .filter((value): value is Prisma.BookOrderByWithRelationInput => value !== null);
    return orderBy.length > 0 ? orderBy : fallback;
  }
}
