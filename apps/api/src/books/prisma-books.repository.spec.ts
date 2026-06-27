import { PrismaBooksRepository } from './prisma-books.repository';

describe('PrismaBooksRepository', () => {
  let repo: PrismaBooksRepository;
  let prisma: never;
  let book: {
    findMany: jest.Mock;
    count: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    findUniqueOrThrow: jest.Mock;
  };
  let bookAuthor: { deleteMany: jest.Mock; createMany: jest.Mock };

  beforeEach(() => {
    book = {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'b1' }),
      update: jest.fn().mockResolvedValue({ id: 'b1' }),
      findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'b1' }),
    };
    bookAuthor = { deleteMany: jest.fn(), createMany: jest.fn() };
    const client = { book, bookAuthor, $transaction: (cb: (tx: unknown) => unknown) => cb(client) };
    prisma = client as never;
    repo = new PrismaBooksRepository(prisma);
  });

  it('findMany excluye eliminados', async () => {
    await repo.findMany({ skip: 0, take: 10, where: { genreId: 'g1' }, orderBy: [] });
    expect(book.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { genreId: 'g1', deletedAt: null } }),
    );
  });

  it('count y findById excluyen eliminados', async () => {
    await repo.count({ stock: { gt: 0 } });
    await repo.findById('b1');
    expect(book.count).toHaveBeenCalledWith({ where: { stock: { gt: 0 }, deletedAt: null } });
    expect(book.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'b1', deletedAt: null } }),
    );
  });

  it('create anida los autores', async () => {
    await repo.create(
      { title: 'T', price: 1, stock: 1, publisherId: 'p', genreId: 'g' },
      ['a1', 'a2'],
    );
    expect(book.create.mock.calls[0][0].data.authors.create).toEqual([
      { authorId: 'a1' },
      { authorId: 'a2' },
    ]);
  });

  it('update re-sincroniza autores en una transacción', async () => {
    await repo.update('b1', { title: 'X' }, ['a3']);
    expect(bookAuthor.deleteMany).toHaveBeenCalledWith({ where: { bookId: 'b1' } });
    expect(bookAuthor.createMany).toHaveBeenCalledWith({ data: [{ bookId: 'b1', authorId: 'a3' }] });
  });

  it('softDelete marca deletedAt', async () => {
    await repo.softDelete('b1');
    expect(book.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'b1' }, data: { deletedAt: expect.any(Date) } }),
    );
  });
});
