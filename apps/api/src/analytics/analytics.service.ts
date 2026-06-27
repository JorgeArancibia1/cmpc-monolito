import type { AnalyticsSummary, CategoryCount } from '@cmpc/contracts';
import { Injectable } from '@nestjs/common';
import { PrismaService, notDeleted } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Métricas agregadas del inventario (solo libros vigentes). */
  async summary(): Promise<AnalyticsSummary> {
    const [
      totalBooks,
      availableBooks,
      totalAuthors,
      totalPublishers,
      totalGenres,
      genres,
      publishers,
      authors,
      byGenre,
      byPublisher,
      byAuthor,
      inventory,
    ] = await Promise.all([
      this.prisma.book.count({ where: notDeleted }),
      this.prisma.book.count({ where: { ...notDeleted, stock: { gt: 0 } } }),
      this.prisma.author.count({ where: notDeleted }),
      this.prisma.publisher.count({ where: notDeleted }),
      this.prisma.genre.count({ where: notDeleted }),
      this.prisma.genre.findMany({ where: notDeleted, select: { id: true, name: true } }),
      this.prisma.publisher.findMany({ where: notDeleted, select: { id: true, name: true } }),
      this.prisma.author.findMany({ where: notDeleted, select: { id: true, name: true } }),
      this.prisma.book.groupBy({ by: ['genreId'], where: notDeleted, _count: { _all: true } }),
      this.prisma.book.groupBy({ by: ['publisherId'], where: notDeleted, _count: { _all: true } }),
      this.prisma.bookAuthor.groupBy({
        by: ['authorId'],
        where: { book: notDeleted },
        _count: { _all: true },
      }),
      this.prisma.$queryRaw<{ value: number; stock: number }[]>`
        SELECT COALESCE(SUM(price * stock), 0)::float8 AS value,
               COALESCE(SUM(stock), 0)::int AS stock
        FROM books WHERE deleted_at IS NULL`,
    ]);

    const lookup = (list: { id: string; name: string }[]) => {
      const map = new Map(list.map((item) => [item.id, item.name]));
      return (id: string) => map.get(id) ?? '—';
    };
    const genreName = lookup(genres);
    const publisherName = lookup(publishers);
    const authorName = lookup(authors);
    const byCountDesc = (a: CategoryCount, b: CategoryCount) => b.count - a.count;

    const inv = inventory[0] ?? { value: 0, stock: 0 };

    return {
      totalBooks,
      availableBooks,
      outOfStockBooks: totalBooks - availableBooks,
      totalStock: Number(inv.stock),
      inventoryValue: Number(inv.value),
      totalAuthors,
      totalPublishers,
      totalGenres,
      booksByGenre: byGenre
        .map((r) => ({ name: genreName(r.genreId), count: r._count._all }))
        .sort(byCountDesc),
      booksByPublisher: byPublisher
        .map((r) => ({ name: publisherName(r.publisherId), count: r._count._all }))
        .sort(byCountDesc),
      topAuthors: byAuthor
        .map((r) => ({ name: authorName(r.authorId), count: r._count._all }))
        .sort(byCountDesc)
        .slice(0, 5),
    };
  }
}
