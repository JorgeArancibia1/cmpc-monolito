import { AxiosError } from 'axios';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/test/server';
import { api, getAccessToken, getApiError, setAccessToken } from './api';

const API = 'http://localhost:3002/api';

describe('interceptor de 401', () => {
  it('refresca el token y reintenta la petición', async () => {
    let calls = 0;
    server.use(
      http.get(`${API}/books`, () => {
        calls += 1;
        return calls === 1
          ? new HttpResponse(null, { status: 401 })
          : HttpResponse.json({ data: [], meta: { total: 0 } });
      }),
      http.post(`${API}/auth/refresh`, () => HttpResponse.json({ data: { accessToken: 'nuevo' } })),
    );
    const res = await api.get('/books');
    expect(calls).toBe(2);
    expect(res.data).toEqual({ data: [], meta: { total: 0 } });
  });
});

describe('getApiError', () => {
  it('extrae el mensaje y los campos del backend', () => {
    const err = new AxiosError('x');
    err.response = {
      data: { error: { message: 'El precio no puede ser negativo', fields: [{ field: 'price', message: 'x' }] } },
    } as never;
    const parsed = getApiError(err);
    expect(parsed.message).toBe('El precio no puede ser negativo');
    expect(parsed.fields).toHaveLength(1);
  });

  it('usa un mensaje genérico ante errores desconocidos', () => {
    expect(getApiError(new Error('boom')).message).toContain('Ocurrió un error');
  });
});

describe('token store', () => {
  it('setea y lee el access token', () => {
    setAccessToken('abc');
    expect(getAccessToken()).toBe('abc');
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
  });
});
