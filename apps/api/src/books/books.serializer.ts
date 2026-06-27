import type { Book } from '@cmpc/contracts';
import { Prisma } from '@prisma/client';

/** Un libro siempre se proyecta junto a su género, editorial y autores. */
export const bookInclude = Prisma.validator<Prisma.BookInclude>()({
  genre: true,
  publisher: true,
  authors: { include: { author: true } },
});

export type BookWithRelations = Prisma.BookGetPayload<{ include: typeof bookInclude }>;

/** Convierte el registro de la base de datos al contrato público `Book`. */
export function toBook(book: BookWithRelations): Book {
  return {
    id: book.id,
    title: book.title,
    isbn: book.isbn,
    description: book.description,
    price: Number(book.price),
    stock: book.stock,
    available: book.stock > 0, // disponibilidad derivada del stock
    publishedYear: book.publishedYear,
    imageUrl: book.imageUrl,
    publisher: { id: book.publisher.id, name: book.publisher.name },
    genre: { id: book.genre.id, name: book.genre.name },
    authors: book.authors.map((entry) => ({ id: entry.author.id, name: entry.author.name })),
    createdAt: book.createdAt.toISOString(),
    updatedAt: book.updatedAt.toISOString(),
  };
}
