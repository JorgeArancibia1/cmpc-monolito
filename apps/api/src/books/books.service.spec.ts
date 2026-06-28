import { NotFoundException } from '@nestjs/common';
import { BooksService } from './books.service';
import { BooksRepository } from './books.repository';
import { BookWithRelations } from './books.serializer';

function makeBook(overrides: Partial<BookWithRelations> = {}): BookWithRelations {
  return {
    id: 'b1',
    title: 'Test',
    isbn: '9780307474728',
    description: null,
    price: 100,
    currency: 'CLP',
    stock: 3,
    publishedYear: 2000,
    imageUrl: null,
    publisherId: 'p1',
    genreId: 'g1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    publisher: { id: 'p1', name: 'Pub', createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    genre: { id: 'g1', name: 'Gen', createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    authors: [
      {
        bookId: 'b1',
        authorId: 'a1',
        author: { id: 'a1', name: 'Autor', bio: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
      },
    ],
    ...overrides,
  } as BookWithRelations;
}

const baseQuery = { page: 1, pageSize: 10, sort: '-createdAt' } as never;

describe('BooksService', () => {
  let service: BooksService;
  let repo: jest.Mocked<BooksRepository>;

  beforeEach(() => {
    repo = {
      findMany: jest.fn(),
      count: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      findForExport: jest.fn(),
    };
    service = new BooksService(repo);
  });

  it('findAll devuelve items serializados y meta', async () => {
    repo.findMany.mockResolvedValue([makeBook()]);
    repo.count.mockResolvedValue(1);
    const res = await service.findAll(baseQuery);
    expect(res.items[0].available).toBe(true);
    expect(res.items[0].price).toBe(100);
    expect(res.meta).toEqual({ page: 1, pageSize: 10, total: 1, totalPages: 1 });
  });

  it('construye filtros (búsqueda, catálogos, autor, disponibilidad) y orden con whitelist', async () => {
    repo.findMany.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);
    await service.findAll({
      page: 1,
      pageSize: 10,
      search: 'soledad',
      genreId: 'g1',
      publisherId: 'p1',
      authorId: 'a1',
      available: true,
      sort: 'title,-price,campoInvalido',
    } as never);
    const params = repo.findMany.mock.calls[0][0];
    expect(params.where).toMatchObject({
      title: { contains: 'soledad', mode: 'insensitive' },
      genreId: 'g1',
      publisherId: 'p1',
      authors: { some: { authorId: 'a1' } },
      stock: { gt: 0 },
    });
    expect(params.orderBy).toEqual([{ title: 'asc' }, { price: 'desc' }]);
  });

  it('disponibilidad=false filtra stock <= 0', async () => {
    repo.findMany.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);
    await service.findAll({ page: 1, pageSize: 10, available: false } as never);
    expect(repo.findMany.mock.calls[0][0].where.stock).toEqual({ lte: 0 });
  });

  it('orden inválido usa el orden por defecto', async () => {
    repo.findMany.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);
    await service.findAll({ page: 1, pageSize: 10, sort: 'nope' } as never);
    expect(repo.findMany.mock.calls[0][0].orderBy).toEqual([{ createdAt: 'desc' }]);
  });

  it('findOne lanza NotFound si no existe', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
  });

  it('create delega y serializa', async () => {
    repo.create.mockResolvedValue(makeBook());
    const res = await service.create({
      title: 'Nuevo',
      price: 10,
      stock: 5,
      publisherId: 'p1',
      genreId: 'g1',
      authorIds: ['a1'],
    } as never);
    expect(res.id).toBe('b1');
    expect(repo.create.mock.calls[0][1]).toEqual(['a1']);
  });

  it('update verifica existencia', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.update('x', { title: 'y' } as never)).rejects.toThrow(NotFoundException);
  });

  it('remove hace soft delete', async () => {
    repo.findById.mockResolvedValue(makeBook());
    repo.softDelete.mockResolvedValue();
    expect(await service.remove('b1')).toEqual({ id: 'b1', deleted: true });
  });

  it('exportCsv genera encabezados y filas', async () => {
    repo.findForExport.mockResolvedValue([makeBook()]);
    const csv = await service.exportCsv(baseQuery);
    expect(csv).toContain('titulo');
    expect(csv).toContain('Test');
    expect(csv).toContain('Autor');
  });

  it('exportCsv neutraliza fórmulas (CSV injection)', async () => {
    repo.findForExport.mockResolvedValue([makeBook({ title: '=SUM(A1)' } as never)]);
    const csv = await service.exportCsv(baseQuery);
    expect(csv).toContain("'=SUM(A1)");
  });

  it('página fuera de rango devuelve lista vacía con meta coherente', async () => {
    repo.findMany.mockResolvedValue([]);
    repo.count.mockResolvedValue(1);
    const res = await service.findAll({ page: 99, pageSize: 10, sort: '-createdAt' } as never);
    expect(res.items).toHaveLength(0);
    expect(res.meta).toEqual({ page: 99, pageSize: 10, total: 1, totalPages: 1 });
  });

  it('setImageUrl actualiza la imagen', async () => {
    repo.findById.mockResolvedValue(makeBook());
    repo.update.mockResolvedValue(makeBook({ imageUrl: 'http://img' }));
    expect((await service.setImageUrl('b1', 'http://img')).imageUrl).toBe('http://img');
  });
});
