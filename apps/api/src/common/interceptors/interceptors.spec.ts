import { CallHandler, ExecutionContext, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { lastValueFrom, of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';
import { TransformInterceptor } from './transform.interceptor';

const ctx = (): ExecutionContext =>
  ({
    getHandler: () => null,
    getClass: () => null,
    switchToHttp: () => ({
      getRequest: () => ({ method: 'GET', url: '/api/books', headers: {}, ip: '127.0.0.1' }),
      getResponse: () => ({ statusCode: 200, setHeader: () => undefined }),
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
  it('deja pasar la respuesta y registra un log JSON con requestId', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const res = await lastValueFrom(new LoggingInterceptor().intercept(ctx(), { handle: () => of('ok') }));
    expect(res).toBe('ok');
    const entry = JSON.parse(spy.mock.calls[0][0] as string);
    expect(entry).toMatchObject({ method: 'GET', url: '/api/books', statusCode: 200, level: 'info' });
    expect(entry.requestId).toBeDefined();
    spy.mockRestore();
  });

  it('registra el estado y nivel correctos cuando la petición falla', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const next: CallHandler = { handle: () => throwError(() => new NotFoundException('nope')) };
    await expect(lastValueFrom(new LoggingInterceptor().intercept(ctx(), next))).rejects.toThrow();
    const entry = JSON.parse(spy.mock.calls[0][0] as string);
    expect(entry).toMatchObject({ statusCode: 404, level: 'warn' });
    spy.mockRestore();
  });
});
