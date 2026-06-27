let mockOutcome: { error: unknown; result: unknown };

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: (_opts: unknown, cb: (e: unknown, r: unknown) => void) => ({
        end: () => cb(mockOutcome.error, mockOutcome.result),
      }),
    },
  },
}));

import { CloudinaryStorage } from './cloudinary.storage';

describe('CloudinaryStorage', () => {
  beforeEach(() => {
    mockOutcome = { error: null, result: { secure_url: 'http://img/portada.png' } };
  });

  it('sube el buffer y devuelve la URL segura', async () => {
    const storage = new CloudinaryStorage({ get: () => 'valor' } as never);
    expect(await storage.upload(Buffer.from('x'))).toBe('http://img/portada.png');
  });

  it('rechaza si Cloudinary devuelve un error', async () => {
    mockOutcome = { error: new Error('falló la subida'), result: null };
    const storage = new CloudinaryStorage({ get: () => 'valor' } as never);
    await expect(storage.upload(Buffer.from('x'), 'libros')).rejects.toThrow();
  });
});
