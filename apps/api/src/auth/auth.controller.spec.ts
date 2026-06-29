import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  const auth = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    changePassword: jest.fn(),
  };
  const jwt = { verifyAsync: jest.fn() };
  const config = {
    get: jest.fn((key: string) =>
      key === 'CORS_ORIGIN' ? 'https://cmpclibros.vercel.app' : 'development',
    ),
    getOrThrow: jest.fn().mockReturnValue('secret'),
  };
  const session = { user: { id: 'u1', email: 'a@a.cl', name: 'A', role: 'ADMIN' }, accessToken: 'access', refreshToken: 'refresh' };
  const mockRes = () => ({ cookie: jest.fn(), clearCookie: jest.fn() });
  const mockReq = (cookies: Record<string, string> = {}, origin?: string) => ({
    cookies,
    ip: '127.0.0.1',
    header: (name: string) => (name.toLowerCase() === 'origin' ? origin : undefined),
  });

  beforeEach(() => {
    controller = new AuthController(auth as never, jwt as never, config as never);
    jest.clearAllMocks();
  });

  it('login setea cookie y devuelve { user, accessToken }', async () => {
    auth.login.mockResolvedValue(session);
    const res = mockRes();
    const out = await controller.login(
      { email: 'a@a.cl', password: 'x' } as never,
      mockReq() as never,
      res as never,
    );
    expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'refresh', expect.any(Object));
    expect(out).toEqual({ user: session.user, accessToken: 'access' });
  });

  it('register abre sesión', async () => {
    auth.register.mockResolvedValue(session);
    const out = await controller.register(
      { email: 'a@a.cl', password: 'Password123', name: 'A' } as never,
      mockReq() as never,
      mockRes() as never,
    );
    expect(out.accessToken).toBe('access');
  });

  it('refresh desde origin no permitido falla', async () => {
    const req = mockReq({ refresh_token: 'rt' }, 'https://evil.example');
    await expect(controller.refresh(req as never, mockRes() as never)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('refresh sin cookie falla', async () => {
    const req = mockReq({}, 'https://cmpclibros.vercel.app');
    await expect(controller.refresh(req as never, mockRes() as never)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('refresh con token inválido falla', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('bad'));
    const req = mockReq({ refresh_token: 'rt' }, 'https://cmpclibros.vercel.app');
    await expect(controller.refresh(req as never, mockRes() as never)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('refresh válido renueva', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 'u1', sid: 's1', fid: 'f1' });
    auth.refresh.mockResolvedValue(session);
    const req = mockReq({ refresh_token: 'rt' }, 'https://cmpclibros.vercel.app');
    const out = await controller.refresh(req as never, mockRes() as never);
    expect(out.accessToken).toBe('access');
  });

  it('logout revoca la familia y limpia las cookies', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 'u1', sid: 's1', fid: 'f1' });
    const res = mockRes();
    const req = mockReq({ refresh_token: 'rt' });
    expect(await controller.logout('u1', req as never, res as never)).toEqual({ ok: true });
    expect(auth.logout).toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalled();
  });

  it('changePassword delega en el servicio y limpia las cookies', async () => {
    const res = mockRes();
    const dto = { currentPassword: 'actual', newPassword: 'NuevaClave123' };
    expect(await controller.changePassword('u1', dto as never, res as never)).toEqual({ ok: true });
    expect(auth.changePassword).toHaveBeenCalledWith('u1', dto);
    expect(res.clearCookie).toHaveBeenCalled();
  });

  it('me devuelve el usuario', () => {
    const user = { id: 'u1', email: 'a@a.cl', name: 'A', role: 'ADMIN' as const };
    expect(controller.me(user)).toBe(user);
  });
});
