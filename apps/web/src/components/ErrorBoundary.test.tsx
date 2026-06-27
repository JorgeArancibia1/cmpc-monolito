import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

function Boom(): never {
  throw new Error('explotó');
}

describe('ErrorBoundary', () => {
  it('muestra el fallback cuando un hijo lanza', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
  });

  it('renderiza los hijos si no hay error', () => {
    render(
      <ErrorBoundary>
        <span>contenido ok</span>
      </ErrorBoundary>,
    );
    expect(screen.getByText('contenido ok')).toBeInTheDocument();
  });
});
