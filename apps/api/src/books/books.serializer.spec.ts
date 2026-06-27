import { toBook } from './books.serializer';
import { BookWithRelations } from './books.serializer';

describe('toBook', () => {
  const base = {
    id: 'b1',
    title: 'T',
    isbn: null,
    description: null,
    price: 199.9,
    publishedYear: null,
    imageUrl: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    publisher: { id: 'p1', name: 'Pub' },
    genre: { id: 'g1', name: 'Gen' },
    authors: [{ author: { id: 'a1', name: 'A1' } }],
  };

  it('deriva available=true cuando hay stock', () => {
    const view = toBook({ ...base, stock: 5 } as unknown as BookWithRelations);
    expect(view.available).toBe(true);
    expect(view.price).toBe(199.9);
    expect(view.authors).toEqual([{ id: 'a1', name: 'A1' }]);
  });

  it('deriva available=false cuando el stock es 0', () => {
    const view = toBook({ ...base, stock: 0 } as unknown as BookWithRelations);
    expect(view.available).toBe(false);
  });
});
