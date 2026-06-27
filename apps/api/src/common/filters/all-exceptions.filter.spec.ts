import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ZodValidationException } from 'nestjs-zod';
import { z } from 'zod';
import { AllExceptionsFilter } from './all-exceptions.filter';

function host(url = '/api/x') {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  return {
    arg: {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ url, method: 'POST' }),
      }),
    } as never,
    status,
    json,
  };
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  it('errores de validación → 400 con mensajes claros por campo', () => {
    const h = host();
    const zodError = z.object({ title: z.string().min(1, 'El título es obligatorio') }).safeParse({ title: '' })
      .error!;
    filter.catch(new ZodValidationException(zodError), h.arg);
    expect(h.status).toHaveBeenCalledWith(400);
    const body = h.json.mock.calls[0][0];
    expect(body.error.message).toBe('El título es obligatorio');
    expect(body.error.fields[0]).toEqual({ field: 'title', message: 'El título es obligatorio' });
  });

  it('duplicado de Prisma (P2002) → 409 con mensaje humano', () => {
    const h = host();
    const err = new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '7' });
    filter.catch(err, h.arg);
    expect(h.status).toHaveBeenCalledWith(409);
    expect(h.json.mock.calls[0][0].error.message).toBe('Ya existe un registro con esos datos.');
  });

  it('registro no encontrado (P2025) → 404', () => {
    const h = host();
    filter.catch(new Prisma.PrismaClientKnownRequestError('nf', { code: 'P2025', clientVersion: '7' }), h.arg);
    expect(h.status).toHaveBeenCalledWith(404);
  });

  it('HttpException con mensaje técnico se humaniza', () => {
    const h = host();
    filter.catch(new HttpException('Cannot POST /api/x', HttpStatus.NOT_FOUND), h.arg);
    expect(h.json.mock.calls[0][0].error.message).toBe('No encontramos lo que buscas.');
  });

  it('mensaje de negocio se conserva', () => {
    const h = host();
    filter.catch(new NotFoundException('No encontramos el libro que buscas.'), h.arg);
    expect(h.json.mock.calls[0][0].error.message).toBe('No encontramos el libro que buscas.');
  });

  it('referencia inválida de Prisma (P2003) → 400', () => {
    const h = host();
    filter.catch(new Prisma.PrismaClientKnownRequestError('fk', { code: 'P2003', clientVersion: '7' }), h.arg);
    expect(h.status).toHaveBeenCalledWith(400);
    expect(h.json.mock.calls[0][0].error.message).toBe('Alguno de los datos seleccionados no es válido.');
  });

  it('error de Prisma desconocido → 400 genérico', () => {
    const h = host();
    filter.catch(new Prisma.PrismaClientKnownRequestError('x', { code: 'P2010', clientVersion: '7' }), h.arg);
    expect(h.status).toHaveBeenCalledWith(400);
  });

  it('401 técnico se humaniza a "inicia sesión"', () => {
    const h = host();
    filter.catch(new HttpException('Cannot GET /api/x', HttpStatus.UNAUTHORIZED), h.arg);
    expect(h.json.mock.calls[0][0].error.message).toBe('Debes iniciar sesión para continuar.');
  });

  it('error desconocido → 500 genérico sin filtrar detalles', () => {
    const h = host();
    filter.catch(new Error('boom interno'), h.arg);
    expect(h.status).toHaveBeenCalledWith(500);
    expect(h.json.mock.calls[0][0].error.message).toBe(
      'Ocurrió un error inesperado. Por favor, inténtalo nuevamente.',
    );
  });
});
