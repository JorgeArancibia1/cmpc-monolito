jest.mock('node:fs/promises', () => ({ mkdir: jest.fn(), writeFile: jest.fn() }));

import { mkdir, writeFile } from 'node:fs/promises';
import { LocalImageStorage } from './local.storage';

describe('LocalImageStorage', () => {
  it('guarda el archivo en la carpeta indicada y devuelve la URL con la extensión correcta', async () => {
    const config = { get: jest.fn().mockReturnValue('http://localhost:3002') };
    const storage = new LocalImageStorage(config as never);
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]);

    const url = await storage.upload(png, 'libros');

    expect(mkdir).toHaveBeenCalled();
    expect(writeFile).toHaveBeenCalled();
    expect(url).toMatch(/^http:\/\/localhost:3002\/uploads\/libros\/[\w-]+\.png$/);
  });

  it('usa la carpeta por defecto y recorta la barra final de PUBLIC_URL', async () => {
    const config = { get: jest.fn().mockReturnValue('http://localhost:3002/') };
    const storage = new LocalImageStorage(config as never);
    const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);

    const url = await storage.upload(jpg);

    expect(url).toMatch(/^http:\/\/localhost:3002\/uploads\/cmpc-libros\/[\w-]+\.jpg$/);
  });

  it('cae al PUBLIC_URL por defecto si no está definido', async () => {
    const config = { get: jest.fn().mockReturnValue(undefined) };
    const storage = new LocalImageStorage(config as never);
    const gif = Buffer.from([0x47, 0x49, 0x46, 0x38, 0, 0, 0, 0, 0, 0, 0, 0]);

    const url = await storage.upload(gif, 'libros');

    expect(url).toMatch(/^http:\/\/localhost:3002\/uploads\/libros\/[\w-]+\.gif$/);
  });
});
