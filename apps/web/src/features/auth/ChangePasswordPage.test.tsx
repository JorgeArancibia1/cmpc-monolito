import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import { ChangePasswordPage } from './ChangePasswordPage';

const ui = (
  <Routes>
    <Route path="/change-password" element={<ChangePasswordPage />} />
    <Route path="/login" element={<div>Pantalla de login</div>} />
  </Routes>
);

describe('ChangePasswordPage', () => {
  it('renderiza el formulario', async () => {
    renderWithProviders(ui, { route: '/change-password' });
    expect(await screen.findByLabelText('Contraseña actual')).toBeInTheDocument();
    expect(screen.getByLabelText('Nueva contraseña')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar nueva contraseña')).toBeInTheDocument();
  });

  it('valida que la confirmación coincida', async () => {
    const user = userEvent.setup();
    renderWithProviders(ui, { route: '/change-password' });
    await screen.findByLabelText('Contraseña actual');
    await user.type(screen.getByLabelText('Contraseña actual'), 'ClaveActual1');
    await user.type(screen.getByLabelText('Nueva contraseña'), 'NuevaClave123');
    await user.type(screen.getByLabelText('Confirmar nueva contraseña'), 'NoCoincide123');
    await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));
    expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument();
  });

  it('cambia la contraseña y redirige al login', async () => {
    const user = userEvent.setup();
    renderWithProviders(ui, { route: '/change-password' });
    await screen.findByLabelText('Contraseña actual');
    await user.type(screen.getByLabelText('Contraseña actual'), 'ClaveActual1');
    await user.type(screen.getByLabelText('Nueva contraseña'), 'NuevaClave123');
    await user.type(screen.getByLabelText('Confirmar nueva contraseña'), 'NuevaClave123');
    await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));
    expect(await screen.findByText('Pantalla de login')).toBeInTheDocument();
  });
});
