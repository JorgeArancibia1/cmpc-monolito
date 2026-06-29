import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from './test/server';
import { renderWithProviders } from './test/utils';
import { App } from './App';

const API = 'http://localhost:3002/api';

describe('App (rutas)', () => {
  it('redirige a login sin sesión', async () => {
    server.use(http.post(`${API}/auth/refresh`, () => new HttpResponse(null, { status: 401 })));
    renderWithProviders(<App />, { route: '/books' });
    expect(await screen.findByText('Inicia sesión para gestionar el catálogo')).toBeInTheDocument();
  });

  it('el login lleva al catálogo', async () => {
    const user = userEvent.setup();
    server.use(http.post(`${API}/auth/refresh`, () => new HttpResponse(null, { status: 401 })));
    renderWithProviders(<App />, { route: '/login' });
    await screen.findByText('CMPC Libros');
    await user.click(screen.getByRole('button', { name: /ingresar/i }));
    expect(await screen.findByText('Catálogo de libros')).toBeInTheDocument();
  });

  it('cerrar sesión vuelve al login', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/books' });
    await screen.findByText('Catálogo de libros');
    await user.click(screen.getByRole('button', { name: /cerrar sesión/i }));
    expect(await screen.findByText('Inicia sesión para gestionar el catálogo')).toBeInTheDocument();
  });

  it('un usuario no-admin no entra al formulario de alta', async () => {
    server.use(
      http.get(`${API}/auth/me`, () =>
        HttpResponse.json({ data: { id: 'u2', email: 'usuario@cmpc.cl', name: 'Usuario', role: 'USER' } }),
      ),
    );
    renderWithProviders(<App />, { route: '/books/new' });
    expect(await screen.findByText('Catálogo de libros')).toBeInTheDocument();
  });

  it('un usuario no-admin no ve ni entra al panel de analítica', async () => {
    server.use(
      http.get(`${API}/auth/me`, () =>
        HttpResponse.json({ data: { id: 'u2', email: 'usuario@cmpc.cl', name: 'Usuario', role: 'USER' } }),
      ),
    );
    renderWithProviders(<App />, { route: '/dashboard' });
    expect(await screen.findByText('Catálogo de libros')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Analítica' })).not.toBeInTheDocument();
  });
});
