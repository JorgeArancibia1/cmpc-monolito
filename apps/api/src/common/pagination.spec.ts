import { buildMeta, skipOf } from './pagination';

describe('pagination', () => {
  it('skipOf calcula el desplazamiento', () => {
    expect(skipOf(3, 20)).toBe(40);
    expect(skipOf(1, 10)).toBe(0);
  });

  it('buildMeta calcula totalPages (mínimo 1)', () => {
    expect(buildMeta(25, 1, 10)).toEqual({ page: 1, pageSize: 10, total: 25, totalPages: 3 });
    expect(buildMeta(0, 1, 10).totalPages).toBe(1);
  });
});
