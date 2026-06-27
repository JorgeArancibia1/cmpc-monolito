import type { Book } from '@cmpc/contracts';
import { http, HttpResponse } from 'msw';

const API = 'http://localhost:3002/api';
const ADMIN = { id: 'u1', email: 'admin@cmpc.cl', name: 'Admin', role: 'ADMIN' as const };

export const IDS = {
  a1: '11111111-1111-4111-8111-111111111111',
  a2: '22222222-2222-4222-8222-222222222222',
  p1: '33333333-3333-4333-8333-333333333333',
  g1: '44444444-4444-4444-8444-444444444444',
};

export const authors = [
  { id: IDS.a1, name: 'García Márquez' },
  { id: IDS.a2, name: 'Borges' },
];
export const publishers = [{ id: IDS.p1, name: 'Planeta' }];
export const genres = [{ id: IDS.g1, name: 'Novela' }];

export const books: Book[] = [
  {
    id: 'b1',
    title: 'Cien años de soledad',
    isbn: '9780307474728',
    description: 'desc',
    price: 19990,
    currency: 'CLP',
    stock: 5,
    available: true,
    publishedYear: 1967,
    imageUrl: null,
    publisher: publishers[0],
    genre: genres[0],
    authors: [authors[0]],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'b2',
    title: 'Ficciones',
    isbn: '9788420633138',
    description: null,
    price: 14990,
    currency: 'CLP',
    stock: 0,
    available: false,
    publishedYear: 1944,
    imageUrl: null,
    publisher: publishers[0],
    genre: genres[0],
    authors: [authors[1]],
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
];

export const handlers = [
  http.post(`${API}/auth/refresh`, () => HttpResponse.json({ data: { accessToken: 'tok' } })),
  http.get(`${API}/auth/me`, () => HttpResponse.json({ data: ADMIN })),
  http.post(`${API}/auth/login`, () => HttpResponse.json({ data: { user: ADMIN, accessToken: 'tok' } })),
  http.post(`${API}/auth/logout`, () => HttpResponse.json({ data: { ok: true } })),

  http.get(`${API}/authors`, () => HttpResponse.json({ data: authors })),
  http.get(`${API}/publishers`, () => HttpResponse.json({ data: publishers })),
  http.get(`${API}/genres`, () => HttpResponse.json({ data: genres })),

  http.get(`${API}/analytics/summary`, () =>
    HttpResponse.json({
      data: {
        totalBooks: 6,
        availableBooks: 5,
        outOfStockBooks: 1,
        totalStock: 35,
        inventoryValue: 1250000,
        totalAuthors: 5,
        totalPublishers: 5,
        totalGenres: 6,
        booksByGenre: [{ name: 'Novela', count: 4 }],
        booksByPublisher: [{ name: 'Planeta', count: 2 }],
        topAuthors: [{ name: 'García Márquez', count: 2 }],
      },
    }),
  ),

  http.get(`${API}/books`, ({ request }) => {
    const search = new URL(request.url).searchParams.get('search')?.toLowerCase();
    const items = search ? books.filter((b) => b.title.toLowerCase().includes(search)) : books;
    return HttpResponse.json({
      data: items,
      meta: { page: 1, pageSize: 8, total: items.length, totalPages: 1 },
    });
  }),

  http.get(`${API}/books/export`, () =>
    HttpResponse.text('id,titulo\nb1,Cien años', { headers: { 'Content-Type': 'text/csv' } }),
  ),

  http.get(`${API}/books/:id`, ({ params }) => {
    const book = books.find((b) => b.id === params.id);
    return book
      ? HttpResponse.json({ data: book })
      : HttpResponse.json({ success: false, error: { message: 'No encontramos el libro que buscas.' } }, { status: 404 });
  }),

  http.post(`${API}/books`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ data: { ...books[0], id: 'created-1', title: body.title } }, { status: 201 });
  }),

  http.patch(`${API}/books/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ data: { ...books[0], id: params.id, title: body.title } });
  }),

  http.post(`${API}/books/:id/image`, ({ params }) =>
    HttpResponse.json({ data: { ...books[0], id: params.id, imageUrl: 'http://img/x.png' } }),
  ),

  http.delete(`${API}/books/:id`, () => HttpResponse.json({ data: { deleted: true } })),
];
