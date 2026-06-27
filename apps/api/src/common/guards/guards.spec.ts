import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

const ctx = (user?: unknown): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => null,
    getClass: () => null,
  }) as never;

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  it('permite si no hay roles requeridos', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(ctx({ role: Role.USER }))).toBe(true);
  });

  it('permite si el rol coincide y rechaza si no', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    expect(guard.canActivate(ctx({ role: Role.ADMIN }))).toBe(true);
    expect(() => guard.canActivate(ctx({ role: Role.USER }))).toThrow(ForbiddenException);
  });
});

describe('JwtAuthGuard', () => {
  it('deja pasar rutas públicas', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    expect(new JwtAuthGuard(reflector).canActivate(ctx())).toBe(true);
  });

  it('handleRequest devuelve el usuario o lanza 401', () => {
    const guard = new JwtAuthGuard(new Reflector());
    expect(guard.handleRequest(null, { id: 'u1' })).toEqual({ id: 'u1' });
    expect(() => guard.handleRequest(null, null)).toThrow(UnauthorizedException);
  });
});
