import { UsersService } from './users.service';

describe('UsersService', () => {
  const user = { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() };
  const service = new UsersService({ user } as never);

  beforeEach(() => jest.clearAllMocks());

  it('findByEmail / findById excluyen eliminados', () => {
    service.findByEmail('a@a.cl');
    service.findById('u1');
    expect(user.findFirst).toHaveBeenCalledWith({ where: { email: 'a@a.cl', deletedAt: null } });
    expect(user.findFirst).toHaveBeenCalledWith({ where: { id: 'u1', deletedAt: null } });
  });

  it('updatePasswordHash actualiza la contraseña', () => {
    service.updatePasswordHash('u1', '$argon2id$x');
    expect(user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { passwordHash: '$argon2id$x' } });
  });
});
