import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/utils';
import { DashboardPage } from './DashboardPage';

describe('DashboardPage', () => {
  it('muestra las métricas y los gráficos del inventario', async () => {
    renderWithProviders(<DashboardPage />, { route: '/dashboard' });
    expect(await screen.findByText('Panel de analítica')).toBeInTheDocument();
    // KPIs
    expect(screen.getByText('Libros')).toBeInTheDocument();
    expect(screen.getByText('Disponibles')).toBeInTheDocument();
    expect(screen.getByText('Valor inventario')).toBeInTheDocument();
    // Gráficos
    expect(screen.getByText('Libros por género')).toBeInTheDocument();
    expect(screen.getByText('Top autores')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Novela' })).toBeInTheDocument();
  });

  it('muestra un mensaje de error si falla la carga', async () => {
    server.use(
      http.get('http://localhost:3002/api/analytics/summary', () => new HttpResponse(null, { status: 500 })),
    );
    renderWithProviders(<DashboardPage />, { route: '/dashboard' });
    expect(await screen.findByText(/error/i)).toBeInTheDocument();
  });
});
