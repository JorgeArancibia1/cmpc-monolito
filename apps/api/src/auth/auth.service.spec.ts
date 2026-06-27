import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Role, Session, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { SessionsService } from './sessions.service';
import { UsersService } from '../users/users.service';
import type { RefreshPayload } from './strategies/jwt.strategy';

jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u1',
    email: 'admin@cmpc.cl',
    name: 'Admin',
    passwordHash: '$argon2id$hash',
    role: Role.ADMIN,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 's1',
    userId: 'u1',
    familyId: 'f1',
    tokenHash: 'refreshhash',
    userAgent: null,
    ip: null,
    expiresAt: new Date(Date.now() + 1_000_000),
    revokedAt: null,
    replacedById: null,
    createdAt: new Date(),
    ...overrides,
  };
}

const payload: RefreshPayload = { sub: 'u1', sid: 's1', fid: 'f1' };

describe('AuthService', () => {
  let service: AuthService;
  let users: jest.Mocked<Pick<UsersService, 'findByEmail' | 'findById' | 'create' | 'updatePasswordHash'>>;
  let passwords: jest.Mocked<Pick<PasswordService, 'hash' | 'verify' | 'needsRehash'>>;
  let sessions: jest.Mocked<
    Pick<SessionsService, 'findById' | 'create' | 'revoke' | 'revokeFamily' | 'revokeAllForUser'>
  >;
  const jwt = { signAsync: jest.fn() };
  const config = { getOrThrow: jest.fn().mockReturnValue('secret'), get: jest.fn().mockReturnValue('15m') };

  beforeEach(() => {
    users = {
      findByEmail: jest.fn(),
      findById: jest.fn().mockResolvedValue(makeUser()),
      create: jest.fn(),
      updatePasswordHash: jest.fn().mockResolvedValue(makeUser()),
    };
    passwords = {
      hash: jest.fn().mockResolvedValue('$argon2id$new'),
      verify: jest.fn().mockResolvedValue(true),
      needsRehash: jest.fn().mockReturnValue(false),
    };
    sessions = {
      findById: jest.fn().mockResolvedValue(makeSession()),
      create: jest.fn().mockResolvedValue(makeSession()),
      revoke: jest.fn().mockResolvedValue(undefined),
      revokeFamily: jest.fn().mockResolvedValue(undefined),
      revokeAllForUser: jest.fn().mockResolvedValue(undefined),
    };
    service = new AuthService(
      users as never,
      jwt as never,
      config as never,
      passwords as never,
      sessions as never,
    );
    jwt.signAsync.mockResolvedValue('token');
    mockedBcrypt.hash.mockResolvedValue('refreshhash' as never);
    mockedBcrypt.compare.mockResolvedValue(true as never);
  });

  it('register hashea con argon2 y abre sesión', async () => {
    users.create.mockResolvedValue(makeUser());
    const res = await service.register({ email: 'a@a.cl', password: 'Password123', name: 'X' } as never);
    expect(passwords.hash).toHaveBeenCalledWith('Password123');
    expect(sessions.create).toHaveBeenCalled();
    expect(res.accessToken).toBe('token');
  });

  it('login correcto devuelve sesión y persiste la sesión', async () => {
    users.findByEmail.mockResolvedValue(makeUser());
    const res = await service.login({ email: 'admin@cmpc.cl', password: 'x' } as never);
    expect(res.user.email).toBe('admin@cmpc.cl');
    expect(sessions.create).toHaveBeenCalled();
    expect(users.updatePasswordHash).not.toHaveBeenCalled();
  });

  it('login re-hashea a argon2 si el hash es heredado (bcrypt)', async () => {
    users.findByEmail.mockResolvedValue(makeUser({ passwordHash: '$2a$10$bcryptlegacy' }));
    passwords.needsRehash.mockReturnValue(true);
    await service.login({ email: 'admin@cmpc.cl', password: 'x' } as never);
    expect(users.updatePasswordHash).toHaveBeenCalledWith('u1', '$argon2id$new');
  });

  it('login con usuario inexistente falla', async () => {
    users.findByEmail.mockResolvedValue(null);
    await expect(service.login({ email: 'no@no.cl', password: 'x' } as never)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('login con contraseña incorrecta falla', async () => {
    users.findByEmail.mockResolvedValue(makeUser());
    passwords.verify.mockResolvedValue(false);
    await expect(service.login({ email: 'admin@cmpc.cl', password: 'bad' } as never)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('refresh válido rota la sesión (revoca la anterior)', async () => {
    const res = await service.refresh(payload, 'rt');
    expect(res.accessToken).toBe('token');
    expect(sessions.create).toHaveBeenCalled();
    expect(sessions.revoke).toHaveBeenCalledWith('s1', expect.any(String));
  });

  it('refresh con sesión inexistente revoca la familia', async () => {
    sessions.findById.mockResolvedValue(null);
    await expect(service.refresh(payload, 'rt')).rejects.toThrow(ForbiddenException);
    expect(sessions.revokeFamily).toHaveBeenCalledWith('f1');
  });

  it('refresh de un token ya rotado (revocado) detecta reuso y revoca la familia', async () => {
    sessions.findById.mockResolvedValue(makeSession({ revokedAt: new Date() }));
    await expect(service.refresh(payload, 'rt')).rejects.toThrow(ForbiddenException);
    expect(sessions.revokeFamily).toHaveBeenCalledWith('f1');
  });

  it('refresh con token que no coincide con el hash revoca la familia', async () => {
    mockedBcrypt.compare.mockResolvedValue(false as never);
    await expect(service.refresh(payload, 'rt')).rejects.toThrow(ForbiddenException);
    expect(sessions.revokeFamily).toHaveBeenCalledWith('f1');
  });

  it('logout revoca la familia de la sesión', async () => {
    await service.logout(payload);
    expect(sessions.revokeFamily).toHaveBeenCalledWith('f1');
  });

  it('changePassword actualiza la clave y revoca todas las sesiones', async () => {
    await service.changePassword('u1', { currentPassword: 'actual', newPassword: 'NuevaClave123' } as never);
    expect(passwords.verify).toHaveBeenCalled();
    expect(users.updatePasswordHash).toHaveBeenCalledWith('u1', '$argon2id$new');
    expect(sessions.revokeAllForUser).toHaveBeenCalledWith('u1');
  });

  it('changePassword falla si la contraseña actual es incorrecta', async () => {
    passwords.verify.mockResolvedValue(false);
    await expect(
      service.changePassword('u1', { currentPassword: 'mala', newPassword: 'NuevaClave123' } as never),
    ).rejects.toThrow(UnauthorizedException);
    expect(users.updatePasswordHash).not.toHaveBeenCalled();
    expect(sessions.revokeAllForUser).not.toHaveBeenCalled();
  });
});
