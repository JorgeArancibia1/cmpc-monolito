import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  function buildPrisma() {
    return {
      book: {
        count: jest.fn().mockResolvedValueOnce(10).mockResolvedValueOnce(7), // total, disponibles
        groupBy: jest
          .fn()
          .mockResolvedValueOnce([{ genreId: 'g1', _count: { _all: 4 } }])
          .mockResolvedValueOnce([{ publisherId: 'p1', _count: { _all: 5 } }]),
      },
      author: {
        count: jest.fn().mockResolvedValue(5),
        findMany: jest.fn().mockResolvedValue([{ id: 'a1', name: 'García Márquez' }]),
      },
      publisher: {
        count: jest.fn().mockResolvedValue(3),
        findMany: jest.fn().mockResolvedValue([{ id: 'p1', name: 'Planeta' }]),
      },
      genre: {
        count: jest.fn().mockResolvedValue(6),
        findMany: jest.fn().mockResolvedValue([{ id: 'g1', name: 'Novela' }]),
      },
      bookAuthor: {
        groupBy: jest.fn().mockResolvedValue([{ authorId: 'a1', _count: { _all: 3 } }]),
      },
      $queryRaw: jest.fn().mockResolvedValue([{ value: 123456, stock: 42 }]),
    };
  }

  it('arma el resumen de métricas del inventario', async () => {
    const prisma = buildPrisma();
    const service = new AnalyticsService(prisma as never);
    const res = await service.summary();

    expect(res.totalBooks).toBe(10);
    expect(res.availableBooks).toBe(7);
    expect(res.outOfStockBooks).toBe(3);
    expect(res.totalStock).toBe(42);
    expect(res.inventoryValue).toBe(123456);
    expect(res.totalAuthors).toBe(5);
    expect(res.totalPublishers).toBe(3);
    expect(res.totalGenres).toBe(6);
    expect(res.booksByGenre).toEqual([{ name: 'Novela', count: 4 }]);
    expect(res.booksByPublisher).toEqual([{ name: 'Planeta', count: 5 }]);
    expect(res.topAuthors).toEqual([{ name: 'García Márquez', count: 3 }]);
  });

  it('tolera la falta de filas de inventario (valores en 0)', async () => {
    const prisma = buildPrisma();
    prisma.$queryRaw = jest.fn().mockResolvedValue([]);
    const service = new AnalyticsService(prisma as never);
    const res = await service.summary();
    expect(res.inventoryValue).toBe(0);
    expect(res.totalStock).toBe(0);
  });
});

describe('AnalyticsController', () => {
  it('delega en el servicio', () => {
    const service = { summary: jest.fn().mockReturnValue('ok') };
    const controller = new AnalyticsController(service as never);
    expect(controller.summary()).toBe('ok');
    expect(service.summary).toHaveBeenCalled();
  });
});
