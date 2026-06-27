import type { Book, Catalog, CreateBookInput, PageMeta } from '@cmpc/contracts';
import { api } from '@/lib/api';

export interface BookListParams {
  page: number;
  pageSize: number;
  search?: string;
  genreId?: string;
  publisherId?: string;
  authorId?: string;
  available?: boolean;
  sort?: string;
}

function toQuery(params: BookListParams): Record<string, string> {
  const query: Record<string, string> = {
    page: String(params.page),
    pageSize: String(params.pageSize),
  };
  if (params.search) query.search = params.search;
  if (params.genreId) query.genreId = params.genreId;
  if (params.publisherId) query.publisherId = params.publisherId;
  if (params.authorId) query.authorId = params.authorId;
  if (params.available !== undefined) query.available = String(params.available);
  if (params.sort) query.sort = params.sort;
  return query;
}

export async function listBooks(params: BookListParams): Promise<{ items: Book[]; meta: PageMeta }> {
  const { data } = await api.get<{ data: Book[]; meta: PageMeta }>('/books', { params: toQuery(params) });
  return { items: data.data, meta: data.meta };
}

export async function getBook(id: string): Promise<Book> {
  const { data } = await api.get<{ data: Book }>(`/books/${id}`);
  return data.data;
}

export async function createBook(payload: CreateBookInput): Promise<Book> {
  const { data } = await api.post<{ data: Book }>('/books', payload);
  return data.data;
}

export async function updateBook(id: string, payload: Partial<CreateBookInput>): Promise<Book> {
  const { data } = await api.patch<{ data: Book }>(`/books/${id}`, payload);
  return data.data;
}

export async function deleteBook(id: string): Promise<void> {
  await api.delete(`/books/${id}`);
}

export async function uploadBookImage(id: string, file: File): Promise<Book> {
  const form = new FormData();
  form.append('image', file);
  const { data } = await api.post<{ data: Book }>(`/books/${id}/image`, form);
  return data.data;
}

export async function exportBooksCsv(params: BookListParams): Promise<Blob> {
  const { data } = await api.get('/books/export', { params: toQuery(params), responseType: 'blob' });
  return data as Blob;
}

const listCatalog =
  (resource: string) =>
  async (): Promise<Catalog[]> => {
    const { data } = await api.get<{ data: Catalog[] }>(`/${resource}`);
    return data.data;
  };

export const listAuthors = listCatalog('authors');
export const listPublishers = listCatalog('publishers');
export const listGenres = listCatalog('genres');

export async function createAuthor(name: string): Promise<Catalog> {
  const { data } = await api.post<{ data: Catalog }>('/authors', { name });
  return data.data;
}
