import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reporta database up cuando la consulta funciona', async () => {
    const controller = new HealthController({ $queryRaw: jest.fn().mockResolvedValue([1]) } as never);
    expect((await controller.check()).database).toBe('up');
  });

  it('reporta database down si la consulta falla', async () => {
    const controller = new HealthController({ $queryRaw: jest.fn().mockRejectedValue(new Error()) } as never);
    expect((await controller.check()).database).toBe('down');
  });
});
