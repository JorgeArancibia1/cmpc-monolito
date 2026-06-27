import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { IDS } from '@/test/handlers';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/utils';
import { BookFormPage } from './BookFormPage';

const createUi = (
  <Routes>
    <Route path="/books/new" element={<BookFormPage />} />
    <Route path="/books/:id" element={<div>Detalle simulado</div>} />
  </Routes>
);

const editUi = (
  <Routes>
    <Route path="/books/:id/edit" element={<BookFormPage />} />
    <Route path="/books/:id" element={<div>Detalle simulado</div>} />
  </Routes>
);

describe('BookFormPage', () => {
  it('valida los campos obligatorios con mensajes claros', async () => {
    const user = userEvent.setup();
    renderWithProviders(createUi, { route: '/books/new' });
    await screen.findByText('Nuevo libro');
    await user.click(screen.getByRole('button', { name: /guardar/i }));
    expect(await screen.findByText('El título es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('Selecciona al menos un autor')).toBeInTheDocument();
  });

  it('crea un libro y navega al detalle', async () => {
    const user = userEvent.setup();
    renderWithProviders(createUi, { route: '/books/new' });
    await screen.findByText('Nuevo libro');
    await user.type(screen.getByLabelText('Título'), 'Mi libro');
    await user.type(screen.getByLabelText('Precio'), '5000');
    await user.type(screen.getByLabelText('Stock'), '3');
    await user.selectOptions(screen.getByLabelText('Editorial'), IDS.p1);
    await user.selectOptions(screen.getByLabelText('Género'), IDS.g1);
    await user.click(screen.getByLabelText('Autores'));
    await user.click(await screen.findByRole('option', { name: 'García Márquez' }));
    await user.click(screen.getByRole('button', { name: /guardar/i }));
    expect(await screen.findByText('Detalle simulado')).toBeInTheDocument();
  });

  it('muestra en el campo el error que devuelve el backend', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('http://localhost:3002/api/books', () =>
        HttpResponse.json(
          { success: false, error: { message: 'Revisa los datos', fields: [{ field: 'isbn', message: 'El ISBN ya existe' }] } },
          { status: 400 },
        ),
      ),
    );
    renderWithProviders(createUi, { route: '/books/new' });
    await screen.findByText('Nuevo libro');
    await user.type(screen.getByLabelText('Título'), 'Mi libro');
    await user.type(screen.getByLabelText('Precio'), '5000');
    await user.type(screen.getByLabelText('Stock'), '3');
    await user.selectOptions(screen.getByLabelText('Editorial'), IDS.p1);
    await user.selectOptions(screen.getByLabelText('Género'), IDS.g1);
    await user.click(screen.getByLabelText('Autores'));
    await user.click(await screen.findByRole('option', { name: 'García Márquez' }));
    await user.click(screen.getByRole('button', { name: /guardar/i }));
    expect(await screen.findByText('El ISBN ya existe')).toBeInTheDocument();
  });

  it('precarga en edición y permite subir imagen', async () => {
    const user = userEvent.setup();
    renderWithProviders(editUi, { route: '/books/b1/edit' });
    expect(await screen.findByDisplayValue('Cien años de soledad')).toBeInTheDocument();
    expect(screen.getByText('Editar libro')).toBeInTheDocument();
    const file = new File(['img'], 'portada.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText('Imagen (opcional)') as HTMLInputElement, file);
    await user.click(screen.getByRole('button', { name: /guardar/i }));
    expect(await screen.findByText('Detalle simulado')).toBeInTheDocument();
  });
});
