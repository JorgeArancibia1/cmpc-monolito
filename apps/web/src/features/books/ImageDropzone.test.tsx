import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImageDropzone } from './ImageDropzone';

function Harness({ existingUrl }: { existingUrl?: string | null }) {
  const [file, setFile] = useState<File | null>(null);
  return (
    <>
      <label htmlFor="image">Imagen</label>
      <ImageDropzone id="image" value={file} onChange={setFile} existingUrl={existingUrl} />
    </>
  );
}

const validPng = () =>
  new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'portada.png', { type: 'image/png' });

const dropzoneOf = () => screen.getByText(/máx\. 5 MB/).closest('label') as HTMLElement;

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:preview');
  URL.revokeObjectURL = vi.fn();
});

describe('ImageDropzone', () => {
  it('muestra la zona vacía con la pista de formatos', () => {
    render(<Harness />);
    expect(screen.getByText(/máx\. 5 MB/)).toBeInTheDocument();
  });

  it('acepta una imagen válida y muestra el nombre con opción de quitar', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.upload(screen.getByLabelText('Imagen'), validPng());
    expect(await screen.findByText('portada.png')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Quitar/ })).toBeInTheDocument();
  });

  it('acepta una imagen soltada (drag & drop)', async () => {
    render(<Harness />);
    fireEvent.drop(dropzoneOf(), { dataTransfer: { files: [validPng()] } });
    expect(await screen.findByText('portada.png')).toBeInTheDocument();
  });

  it('rechaza un archivo que no es imagen', () => {
    render(<Harness />);
    const txt = new File(['hola'], 'nota.txt', { type: 'text/plain' });
    fireEvent.drop(dropzoneOf(), { dataTransfer: { files: [txt] } });
    expect(screen.getByText(/máx\. 5 MB/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Quitar/ })).not.toBeInTheDocument();
  });

  it('en edición muestra la imagen existente', () => {
    render(<Harness existingUrl="http://img/old.png" />);
    expect(screen.getByText('Imagen actual')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Vista previa/ })).toBeInTheDocument();
  });
});
