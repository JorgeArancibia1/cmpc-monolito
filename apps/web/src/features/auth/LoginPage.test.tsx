import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  it('renderiza el formulario', async () => {
    renderWithProviders(<LoginPage />, { route: '/login' });
    expect(await screen.findByText('CMPC Libros')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
  });

  it('valida un correo inválido', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: '/login' });
    const email = screen.getByLabelText('Correo electrónico');
    await user.clear(email);
    await user.type(email, 'no-es-correo');
    await user.click(screen.getByRole('button', { name: /ingresar/i }));
    expect(await screen.findByText(/correo electrónico válido/i)).toBeInTheDocument();
  });
});
