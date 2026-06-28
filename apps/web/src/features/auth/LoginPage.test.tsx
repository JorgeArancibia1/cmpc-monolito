import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/utils';
import { LoginPage } from './LoginPage';

const API = 'http://localhost:3002/api';
const ADMIN = { id: 'u1', email: 'admin@cmpc.cl', name: 'Admin', role: 'ADMIN' as const };

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

  it('login exitoso llama a toast de confirmación', async () => {
    const successSpy = vi.spyOn(toast, 'success');
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: '/login' });
    // El formulario tiene defaultValues válidos (admin@cmpc.cl / Admin123!).
    // El handler MSW de /auth/login devuelve ADMIN por defecto.
    await user.click(await screen.findByRole('button', { name: /ingresar/i }));
    await waitFor(() => expect(successSpy).toHaveBeenCalledWith('Sesión iniciada'));
  });

  it('credenciales incorrectas muestran el mensaje de error del servidor', async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json(
          { success: false, error: { message: 'Credenciales incorrectas.' } },
          { status: 401 },
        ),
      ),
    );
    const errorSpy = vi.spyOn(toast, 'error');
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: '/login' });
    await user.click(await screen.findByRole('button', { name: /ingresar/i }));
    await waitFor(() => expect(errorSpy).toHaveBeenCalledWith('Credenciales incorrectas.'));
  });

  it('muestra estado de carga mientras espera respuesta del servidor', async () => {
    let unblock!: () => void;
    server.use(
      http.post(`${API}/auth/login`, () =>
        new Promise<Response>((resolve) => {
          unblock = () => resolve(HttpResponse.json({ data: { user: ADMIN, accessToken: 'tok' } }));
        }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: '/login' });

    // Iniciamos el submit sin esperar su resolución completa.
    void user.click(await screen.findByRole('button', { name: /ingresar/i }));

    // Mientras la petición está en vuelo el botón cambia de texto y queda deshabilitado.
    const loadingBtn = await screen.findByRole('button', { name: /ingresando/i });
    expect(loadingBtn).toBeDisabled();

    // Desbloqueamos la respuesta y esperamos a que el botón vuelva a su estado normal.
    unblock();
    await screen.findByRole('button', { name: /ingresar/i });
  });
});
