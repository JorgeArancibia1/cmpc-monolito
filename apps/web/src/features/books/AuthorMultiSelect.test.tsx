import type { Catalog } from '@cmpc/contracts';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AuthorMultiSelect } from './AuthorMultiSelect';

const options: Catalog[] = [
  { id: 'a1', name: 'García Márquez' },
  { id: 'a2', name: 'Borges' },
];

function Harness({ onCreate }: { onCreate: (name: string) => Promise<Catalog> }) {
  const [value, setValue] = useState<string[]>([]);
  return (
    <AuthorMultiSelect id="authors" options={options} value={value} onChange={setValue} onCreate={onCreate} />
  );
}

describe('AuthorMultiSelect', () => {
  it('selecciona un autor existente del listado', async () => {
    const user = userEvent.setup();
    render(<Harness onCreate={vi.fn()} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'Borges' }));
    expect(screen.getByRole('button', { name: 'Quitar Borges' })).toBeInTheDocument();
  });

  it('crea un autor nuevo cuando no existe en el catálogo', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn(async (name: string): Promise<Catalog> => ({ id: 'a3', name }));
    render(<Harness onCreate={onCreate} />);
    await user.type(screen.getByRole('combobox'), 'Cortázar');
    await user.click(await screen.findByRole('button', { name: /Crear «Cortázar»/ }));
    expect(onCreate).toHaveBeenCalledWith('Cortázar');
    expect(await screen.findByRole('button', { name: 'Quitar Cortázar' })).toBeInTheDocument();
  });

  it('quita un autor con su chip', async () => {
    const user = userEvent.setup();
    render(<Harness onCreate={vi.fn()} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'García Márquez' }));
    await user.click(screen.getByRole('button', { name: 'Quitar García Márquez' }));
    expect(screen.queryByRole('button', { name: 'Quitar García Márquez' })).not.toBeInTheDocument();
  });

  it('permite navegar y elegir con el teclado', async () => {
    const user = userEvent.setup();
    render(<Harness onCreate={vi.fn()} />);
    await user.click(screen.getByRole('combobox'));
    // activeIndex 0 (García Márquez) → ArrowDown → 1 (Borges) → Enter lo selecciona.
    await user.keyboard('{ArrowDown}{Enter}');
    expect(screen.getByRole('button', { name: 'Quitar Borges' })).toBeInTheDocument();
  });

  it('quita el último autor con Backspace cuando el campo está vacío', async () => {
    const user = userEvent.setup();
    render(<Harness onCreate={vi.fn()} />);
    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.click(await screen.findByRole('option', { name: 'García Márquez' }));
    await user.click(input);
    await user.keyboard('{Backspace}');
    expect(screen.queryByRole('button', { name: 'Quitar García Márquez' })).not.toBeInTheDocument();
  });
});
