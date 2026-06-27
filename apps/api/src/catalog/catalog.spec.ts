import { AuthorsController, AuthorsService } from './authors.module';
import { GenresController, GenresService } from './genres.module';
import { PublishersController, PublishersService } from './publishers.module';

describe('Catálogos', () => {
  it('autores: lista no eliminados y crea', () => {
    const author = { findMany: jest.fn(), create: jest.fn() };
    const controller = new AuthorsController(new AuthorsService({ author } as never));
    controller.findAll();
    controller.create({ name: 'Autor' } as never);
    expect(author.findMany).toHaveBeenCalledWith({ where: { deletedAt: null }, orderBy: { name: 'asc' } });
    expect(author.create).toHaveBeenCalledWith({ data: { name: 'Autor' } });
  });

  it('editoriales: lista no eliminadas y crea', () => {
    const publisher = { findMany: jest.fn(), create: jest.fn() };
    const controller = new PublishersController(new PublishersService({ publisher } as never));
    controller.findAll();
    controller.create({ name: 'Planeta' } as never);
    expect(publisher.findMany).toHaveBeenCalledWith({ where: { deletedAt: null }, orderBy: { name: 'asc' } });
    expect(publisher.create).toHaveBeenCalled();
  });

  it('géneros: lista no eliminados y crea', () => {
    const genre = { findMany: jest.fn(), create: jest.fn() };
    const controller = new GenresController(new GenresService({ genre } as never));
    controller.findAll();
    controller.create({ name: 'Novela' } as never);
    expect(genre.findMany).toHaveBeenCalledWith({ where: { deletedAt: null }, orderBy: { name: 'asc' } });
    expect(genre.create).toHaveBeenCalled();
  });
});
