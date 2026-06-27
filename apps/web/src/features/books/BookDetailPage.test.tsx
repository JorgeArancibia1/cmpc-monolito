import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import { BookDetailPage } from './BookDetailPage';

const ui = (
  <Routes>
    <Route path="/books/:id" element={<BookDetailPage />} />
  </Routes>
);

describe('BookDetailPage', () => {
  it('muestra el detalle completo', async () => {
    renderWithProviders(ui, { route: '/books/b1' });
    expect(await screen.findByText('Cien años de soledad')).toBeInTheDocument();
    expect(screen.getByText('Planeta')).toBeInTheDocument();
    expect(screen.getByText('García Márquez')).toBeInTheDocument();
  });

  it('muestra mensaje claro si no existe', async () => {
    renderWithProviders(ui, { route: '/books/zzz' });
    expect(await screen.findByText(/no encontramos el libro/i)).toBeInTheDocument();
  });
});
