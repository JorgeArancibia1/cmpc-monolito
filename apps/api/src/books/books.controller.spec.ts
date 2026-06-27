import { BadRequestException } from '@nestjs/common';
import { BooksController } from './books.controller';

describe('BooksController', () => {
  let controller: BooksController;
  const books = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    exportCsv: jest.fn(),
    setImageUrl: jest.fn(),
  };
  const images = { uploadBuffer: jest.fn() };

  beforeEach(() => {
    controller = new BooksController(books as never, images as never);
    jest.clearAllMocks();
  });

  it('findAll / findOne / create / update / remove delegan', () => {
    controller.findAll({} as never);
    controller.findOne('b1');
    controller.create({ title: 'x' } as never);
    controller.update('b1', { title: 'y' } as never);
    controller.remove('b1');
    expect(books.findAll).toHaveBeenCalled();
    expect(books.findOne).toHaveBeenCalledWith('b1');
    expect(books.create).toHaveBeenCalled();
    expect(books.update).toHaveBeenCalledWith('b1', { title: 'y' });
    expect(books.remove).toHaveBeenCalledWith('b1');
  });

  it('export setea cabeceras CSV', async () => {
    books.exportCsv.mockResolvedValue('csv');
    const res = { set: jest.fn() };
    expect(await controller.export({} as never, res as never)).toBe('csv');
    expect(res.set).toHaveBeenCalledWith(
      expect.objectContaining({ 'Content-Type': 'text/csv; charset=utf-8' }),
    );
  });

  it('uploadImage exige archivo de imagen', async () => {
    await expect(controller.uploadImage('b1', undefined)).rejects.toThrow(BadRequestException);
    await expect(
      controller.uploadImage('b1', { mimetype: 'text/plain', buffer: Buffer.from('') } as never),
    ).rejects.toThrow(BadRequestException);
  });

  it('uploadImage sube y guarda la url', async () => {
    images.uploadBuffer.mockResolvedValue('http://img');
    books.setImageUrl.mockResolvedValue({ id: 'b1' });
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    await controller.uploadImage('b1', { mimetype: 'image/png', buffer: png } as never);
    expect(books.setImageUrl).toHaveBeenCalledWith('b1', 'http://img');
  });

  it('uploadImage rechaza un archivo cuyos bytes no son de imagen', async () => {
    await expect(
      controller.uploadImage('b1', { mimetype: 'image/png', buffer: Buffer.from('not-an-image') } as never),
    ).rejects.toThrow(BadRequestException);
  });
});
