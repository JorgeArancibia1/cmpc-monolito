import { validateEnv } from './env';

const base = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_ACCESS_SECRET: 'a-very-long-access-secret-of-at-least-32-chars',
  JWT_REFRESH_SECRET: 'another-very-long-refresh-secret-32-chars-min',
};

describe('validateEnv', () => {
  it('acepta config válida y aplica defaults', () => {
    const env = validateEnv(base);
    expect(env.API_PORT).toBe(3002);
    expect(env.NODE_ENV).toBe('development');
  });

  it('falla si falta un secreto', () => {
    expect(() => validateEnv({ ...base, JWT_ACCESS_SECRET: 'corto' })).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('falla si DATABASE_URL no es válida', () => {
    expect(() => validateEnv({ ...base, DATABASE_URL: 'nope' })).toThrow(/DATABASE_URL/);
  });
});
