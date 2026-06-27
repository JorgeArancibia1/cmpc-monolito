import { z } from 'zod';
import { booleanish, optional, paginationSchema } from './common';

const MAX_YEAR = new Date().getFullYear() + 1;

/** Valida ISBN-10 o ISBN-13 (ignora guiones y espacios). */
function isValidIsbn(value: string): boolean {
  const clean = value.replace(/[\s-]/g, '');
  return /^(?:\d{9}[\dXx]|\d{13})$/.test(clean);
}

const isbnField = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z
    .string()
    .trim()
    .refine(isValidIsbn, 'El ISBN no tiene un formato válido (10 o 13 dígitos)')
    .optional(),
);

/** Esquema base de un libro: valida cada campo con mensajes claros para el usuario. */
export const bookFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'El título es obligatorio')
    .max(255, 'El título es demasiado largo'),
  isbn: isbnField,
  description: optional(z.string().trim().max(2000, 'La descripción es demasiado larga')),
  price: z.coerce
    .number({ error: 'Ingresa un precio válido' })
    .min(0, 'El precio no puede ser negativo')
    .max(99_999_999, 'El precio es demasiado alto'),
  stock: z.coerce
    .number({ error: 'Ingresa un stock válido' })
    .int('El stock debe ser un número entero')
    .min(0, 'El stock no puede ser negativo'),
  publishedYear: optional(
    z.coerce
      .number({ error: 'Ingresa un año válido' })
      .int('El año debe ser un número entero')
      .min(1450, 'El año no es válido')
      .max(MAX_YEAR, 'El año no es válido'),
  ),
  publisherId: z.string().uuid('Selecciona una editorial'),
  genreId: z.string().uuid('Selecciona un género'),
  authorIds: z
    .array(z.string().uuid('Autor inválido'))
    .min(1, 'Selecciona al menos un autor'),
});

export const createBookSchema = bookFormSchema;
export const updateBookSchema = bookFormSchema.partial();

/** Filtros + orden + búsqueda + paginación del listado. */
export const sortableFields = ['title', 'price', 'stock', 'publishedYear', 'createdAt'] as const;

export const queryBooksSchema = paginationSchema.extend({
  search: optional(z.string().trim()),
  genreId: optional(z.string().uuid()),
  publisherId: optional(z.string().uuid()),
  authorId: optional(z.string().uuid()),
  available: optional(booleanish),
  sort: z.string().default('-createdAt'),
});

export type BookFormInput = z.infer<typeof bookFormSchema>;
export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type QueryBooksInput = z.infer<typeof queryBooksSchema>;

export interface Catalog {
  id: string;
  name: string;
}

export interface Book {
  id: string;
  title: string;
  isbn: string | null;
  description: string | null;
  price: number;
  stock: number;
  available: boolean;
  publishedYear: number | null;
  imageUrl: string | null;
  publisher: Catalog;
  genre: Catalog;
  authors: Catalog[];
  createdAt: string;
  updatedAt: string;
}
