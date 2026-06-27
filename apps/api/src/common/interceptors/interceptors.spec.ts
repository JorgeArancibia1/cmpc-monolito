import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { lastValueFrom, of } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';
import { TransformInterceptor } from './transform.interceptor';

const ctx = (): ExecutionContext =>
  ({
    getHandler: () => null,
    getClass: () => null,
    switchToHttp: () => ({
      getRequest: () => ({ method: 'GET', url: '/api/books' }),
      getResponse: () => ({ statusCode: 200 }),
    }),
  }) as never;

describe('TransformInterceptor', () => {
  const reflector = new Reflector();
  const interceptor = new TransformInterceptor(reflector);

  it('envuelve en { success, data }', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const res = await lastValueFrom(interceptor.intercept(ctx(), { handle: () => of({ id: 1 }) }));
    expect(res).toEqual({ success: true, data: { id: 1 } });
  });

  it('expone meta en respuestas paginadas', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const next: CallHandler = { handle: () => of({ items: [1], meta: { total: 1 } }) };
    expect(await lastValueFrom(interceptor.intercept(ctx(), next))).toEqual({
      success: true,
      data: [1],
      meta: { total: 1 },
    });
  });

  it('omite el envoltorio si es raw', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    expect(await lastValueFrom(interceptor.intercept(ctx(), { handle: () => of('csv') }))).toBe('csv');
  });
});

describe('LoggingInterceptor', () => {
  it('deja pasar la respuesta', async () => {
    const res = await lastValueFrom(new LoggingInterceptor().intercept(ctx(), { handle: () => of('ok') }));
    expect(res).toBe('ok');
  });
});
