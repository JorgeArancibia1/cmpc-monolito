import { ImagesService } from './images.service';

describe('ImagesService', () => {
  it('delega la subida en la estrategia de almacenamiento', async () => {
    const storage = { upload: jest.fn().mockResolvedValue('http://img/portada.png') };
    const service = new ImagesService(storage as never);
    const buffer = Buffer.from('x');
    expect(await service.uploadBuffer(buffer, 'libros')).toBe('http://img/portada.png');
    expect(storage.upload).toHaveBeenCalledWith(buffer, 'libros');
  });

  it('usa la carpeta por defecto cuando no se indica', async () => {
    const storage = { upload: jest.fn().mockResolvedValue('http://img/p.png') };
    const service = new ImagesService(storage as never);
    const buffer = Buffer.from('x');
    await service.uploadBuffer(buffer);
    expect(storage.upload).toHaveBeenCalledWith(buffer, 'cmpc-libros');
  });
});
