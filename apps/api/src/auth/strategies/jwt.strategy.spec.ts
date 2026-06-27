import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const strategy = new JwtStrategy({ getOrThrow: () => 'a-very-long-secret-key' } as never);

  it('mapea el payload a AuthUser', () => {
    expect(strategy.validate({ sub: 'u1', email: 'a@a.cl', name: 'A', role: 'ADMIN' })).toEqual({
      id: 'u1',
      email: 'a@a.cl',
      name: 'A',
      role: 'ADMIN',
    });
  });

  it('rechaza payload sin sub', () => {
    expect(() => strategy.validate({ sub: '', email: '', name: '', role: 'USER' })).toThrow(
      UnauthorizedException,
    );
  });
});
