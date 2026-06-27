import { SessionsService } from './sessions.service';

describe('SessionsService', () => {
  const session = {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  };
  const service = new SessionsService({ session } as never);

  beforeEach(() => jest.clearAllMocks());

  it('create persiste la sesión', () => {
    service.create({ id: 's1' } as never);
    expect(session.create).toHaveBeenCalledWith({ data: { id: 's1' } });
  });

  it('findById busca por id', () => {
    service.findById('s1');
    expect(session.findUnique).toHaveBeenCalledWith({ where: { id: 's1' } });
  });

  it('revoke marca la sesión y registra su reemplazo', () => {
    service.revoke('s1', 's2');
    expect(session.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { revokedAt: expect.any(Date), replacedById: 's2' },
    });
  });

  it('revokeFamily revoca todas las sesiones activas de la familia', () => {
    service.revokeFamily('f1');
    expect(session.updateMany).toHaveBeenCalledWith({
      where: { familyId: 'f1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('revokeAllForUser revoca todas las sesiones activas del usuario', () => {
    service.revokeAllForUser('u1');
    expect(session.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
