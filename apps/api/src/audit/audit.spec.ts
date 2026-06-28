import { CallHandler, ExecutionContext } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { lastValueFrom, of } from 'rxjs';
import { AuditInterceptor } from './audit.interceptor';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  const auditLog = { create: jest.fn(), findMany: jest.fn(), count: jest.fn() };
  const prisma = { auditLog, $transaction: jest.fn() } as never;
  const service = new AuditService(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('record inserta una entrada', async () => {
    auditLog.create.mockResolvedValue({});
    await service.record({ action: AuditAction.CREATE, entity: 'Book', entityId: 'b1' });
    expect(auditLog.create).toHaveBeenCalled();
  });

  it('record nunca lanza aunque la BD falle', async () => {
    auditLog.create.mockRejectedValue(new Error('db'));
    await expect(service.record({ action: AuditAction.DELETE, entity: 'Book' })).resolves.toBeUndefined();
  });

  it('findAll devuelve items y meta', async () => {
    (prisma as { $transaction: jest.Mock }).$transaction.mockImplementation(
      async (cb: (tx: typeof prisma) => unknown) => cb(prisma),
    );
    auditLog.findMany.mockResolvedValue([{ id: 'l1' }]);
    auditLog.count.mockResolvedValue(1);
    const res = await service.findAll(1, 10);
    expect(res.items).toHaveLength(1);
    expect(res.meta.total).toBe(1);
  });
});

describe('AuditInterceptor', () => {
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  const interceptor = new AuditInterceptor(audit as never);

  function ctx(method: string, path: string, params: Record<string, string> = {}): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ method, path, params, body: { title: 'x', password: 'secret' }, user: { id: 'u1' }, ip: '127.0.0.1' }),
      }),
    } as never;
  }

  beforeEach(() => jest.clearAllMocks());

  it('registra CREATE en POST /api/books y oculta password', async () => {
    const next: CallHandler = { handle: () => of({ id: 'b1' }) };
    await lastValueFrom(interceptor.intercept(ctx('POST', '/api/books'), next));
    const entry = audit.record.mock.calls[0][0];
    expect(entry).toMatchObject({ action: AuditAction.CREATE, entity: 'Book', entityId: 'b1' });
    expect((entry.changes as Record<string, unknown>).password).toBeUndefined();
  });

  it('no audita GET ni recursos no auditables', async () => {
    const next: CallHandler = { handle: () => of([]) };
    await lastValueFrom(interceptor.intercept(ctx('GET', '/api/books'), next));
    await lastValueFrom(interceptor.intercept(ctx('POST', '/api/auth/login'), next));
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('DELETE usa el id del parámetro', async () => {
    const next: CallHandler = { handle: () => of({ deleted: true }) };
    await lastValueFrom(interceptor.intercept(ctx('DELETE', '/api/books/b9', { id: 'b9' }), next));
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.DELETE, entityId: 'b9', changes: null }),
    );
  });
});
