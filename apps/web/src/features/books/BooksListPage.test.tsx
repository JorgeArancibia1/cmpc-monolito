import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { IDS } from '@/test/handlers';
import { renderWithProviders } from '@/test/utils';
import { BooksListPage } from './BooksListPage';

describe('BooksListPage', () => {
  it('lista los libros con su disponibilidad', async () => {
    renderWithProviders(<BooksListPage />, { route: '/books' });
    expect(await screen.findByText('Cien años de soledad')).toBeInTheDocument();
    expect(screen.getByText('Disponible')).toBeInTheDocument();
    expect(screen.getByText('Agotado')).toBeInTheDocument();
  });

  it('muestra el botón de admin (Nuevo libro)', async () => {
    renderWithProviders(<BooksListPage />, { route: '/books' });
    expect(await screen.findByRole('link', { name: /nuevo libro/i })).toBeInTheDocument();
  });

  it('filtra por búsqueda con debounce', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BooksListPage />, { route: '/books' });
    await screen.findByText('Cien años de soledad');
    await user.type(screen.getByLabelText('Buscar por título'), 'Ficciones');
    await waitFor(() => expect(screen.queryByText('Cien años de soledad')).not.toBeInTheDocument());
    expect(screen.getByText('Ficciones')).toBeInTheDocument();
  });

  it('exporta a CSV', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BooksListPage />, { route: '/books' });
    await screen.findByText('Cien años de soledad');
    await user.click(screen.getByRole('button', { name: /exportar csv/i }));
    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
  });

  it('elimina con confirmación', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BooksListPage />, { route: '/books' });
    await screen.findByText('Cien años de soledad');
    await user.click(await screen.findByRole('button', { name: /eliminar cien años de soledad/i }));
    expect(window.confirm).toHaveBeenCalled();
  });

  it('ordena al hacer clic en una cabecera y aplica filtro de género', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BooksListPage />, { route: '/books' });
    await user.click(await screen.findByText(/Título/));
    await user.selectOptions(screen.getByLabelText('Filtrar por género'), IDS.g1);
    expect(await screen.findByText('Cien años de soledad')).toBeInTheDocument();
  });
});
