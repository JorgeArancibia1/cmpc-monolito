import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hash } from '@node-rs/argon2';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Prueba e2e del flujo real contra una base PostgreSQL: login → CRUD de libros →
 * exportación CSV → auditoría → soft delete. Requiere DATABASE_URL/DIRECT_URL a una BD de prueba
 * ya migrada (ver script `test:e2e`).
 */
describe('CMPC Libros API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let bookId: string;
  const ids = { publisher: '', genre: '', author: '' };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    await app.init();

    prisma = app.get(PrismaService);

    // BD limpia + datos mínimos para el flujo.
    await prisma.auditLog.deleteMany();
    await prisma.bookAuthor.deleteMany();
    await prisma.book.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    await prisma.author.deleteMany();
    await prisma.publisher.deleteMany();
    await prisma.genre.deleteMany();

    await prisma.user.create({
      data: {
        email: 'admin@cmpc.cl',
        name: 'Admin',
        role: 'ADMIN',
        passwordHash: await hash('Admin12345!'),
      },
    });
    const publisher = await prisma.publisher.create({ data: { name: 'Planeta' } });
    const genre = await prisma.genre.create({ data: { name: 'Novela' } });
    const author = await prisma.author.create({ data: { name: 'García Márquez' } });
    ids.publisher = publisher.id;
    ids.genre = genre.id;
    ids.author = author.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/login devuelve un access token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@cmpc.cl', password: 'Admin12345!' })
      .expect(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.role).toBe('ADMIN');
    token = res.body.data.accessToken;
  });

  it('rechaza crear un libro sin autenticación (401)', async () => {
    await request(app.getHttpServer()).post('/api/books').send({ title: 'x' }).expect(401);
  });

  it('POST /books crea un libro (admin)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/books')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Cien años de soledad',
        price: 19990,
        stock: 5,
        publisherId: ids.publisher,
        genreId: ids.genre,
        authorIds: [ids.author],
      })
      .expect(201);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.price).toBe(19990);
    expect(res.body.data.currency).toBe('CLP');
    bookId = res.body.data.id;
  });

  it('GET /books lista con paginación', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/books?page=1&pageSize=10')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.total).toBeGreaterThan(0);
  });

  it('GET /books/export devuelve CSV', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/books/export')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Cien años de soledad');
  });

  it('GET /audit registra la creación del libro', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/audit')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const created = res.body.data.some(
      (e: { action: string; entity: string }) => e.action === 'CREATE' && e.entity === 'Book',
    );
    expect(created).toBe(true);
  });

  it('DELETE /books/:id hace soft delete y desaparece del listado', async () => {
    await request(app.getHttpServer())
      .delete(`/api/books/${bookId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const res = await request(app.getHttpServer())
      .get('/api/books?page=1&pageSize=10')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.data.find((b: { id: string }) => b.id === bookId)).toBeUndefined();
  });
});
