import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { setAccessToken } from '@/lib/api';
import { server } from './server';

// Con la instrumentación de cobertura el primer render puede tardar más de 1000ms
// (el default de Testing Library). 4000ms es suficiente sin alargar el feedback loop.
configure({ asyncUtilTimeout: 4000 });

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  setAccessToken(null);
  vi.restoreAllMocks();
});
afterAll(() => server.close());

window.confirm = vi.fn(() => true);
URL.createObjectURL = vi.fn(() => 'blob:mock');
URL.revokeObjectURL = vi.fn();
