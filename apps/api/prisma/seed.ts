import 'dotenv/config';
import { hash as argon2 } from '@node-rs/argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  console.log('Sembrando datos iniciales…');

  // Las contraseñas de ejemplo se pueden sobreescribir por entorno (no quemarlas en el repo).
  const argonOptions = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;
  const [adminPassword, userPassword] = await Promise.all([
    argon2(process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!', argonOptions),
    argon2(process.env.SEED_USER_PASSWORD ?? 'User123!', argonOptions),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cmpc.cl' },
    update: {},
    create: {
      email: 'admin@cmpc.cl',
      name: 'Administrador',
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'usuario@cmpc.cl' },
    update: {},
    create: {
      email: 'usuario@cmpc.cl',
      name: 'Usuario',
      passwordHash: userPassword,
      role: Role.USER,
    },
  });

  const publishers = await Promise.all(
    ['Penguin Random House', 'Planeta', 'Anagrama', 'Alfaguara', 'Salamandra'].map((name) =>
      prisma.publisher.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );

  const genres = await Promise.all(
    ['Novela', 'Ciencia Ficción', 'Fantasía', 'Ensayo', 'Poesía', 'Historia'].map((name) =>
      prisma.genre.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );

  const authorsData = [
    { name: 'Gabriel García Márquez', bio: 'Escritor colombiano, Nobel de Literatura 1982.' },
    { name: 'Isabel Allende', bio: 'Escritora chilena, referente del realismo mágico.' },
    { name: 'Jorge Luis Borges', bio: 'Escritor argentino, maestro del cuento.' },
    { name: 'Julio Cortázar', bio: 'Escritor argentino, autor de Rayuela.' },
    { name: 'Mario Vargas Llosa', bio: 'Escritor peruano, Nobel de Literatura 2010.' },
  ];
  const authors = [];
  for (const data of authorsData) {
    const existing = await prisma.author.findFirst({ where: { name: data.name } });
    authors.push(existing ?? (await prisma.author.create({ data })));
  }

  const booksData = [
    { title: 'Cien años de soledad', isbn: '9780307474728', price: 19990, stock: 12, publishedYear: 1967, publisher: 0, genre: 0, authors: [0] },
    { title: 'La casa de los espíritus', isbn: '9788401242141', price: 17990, stock: 8, publishedYear: 1982, publisher: 1, genre: 0, authors: [1] },
    { title: 'Ficciones', isbn: '9788420633138', price: 14990, stock: 0, publishedYear: 1944, publisher: 2, genre: 1, authors: [2] },
    { title: 'Rayuela', isbn: '9788437604572', price: 21990, stock: 5, publishedYear: 1963, publisher: 3, genre: 0, authors: [3] },
    { title: 'La ciudad y los perros', isbn: '9788420471836', price: 16990, stock: 7, publishedYear: 1963, publisher: 1, genre: 0, authors: [4] },
    { title: 'Antología compartida', isbn: '9780000000019', price: 12990, stock: 3, publishedYear: 2001, publisher: 4, genre: 4, authors: [0, 2, 3] },
  ];

  for (const b of booksData) {
    const existing = await prisma.book.findFirst({ where: { title: b.title } });
    if (existing) continue;
    await prisma.book.create({
      data: {
        title: b.title,
        isbn: b.isbn,
        price: b.price,
        stock: b.stock,
        publishedYear: b.publishedYear,
        publisherId: publishers[b.publisher]!.id,
        genreId: genres[b.genre]!.id,
        authors: { create: b.authors.map((i) => ({ authorId: authors[i]!.id })) },
      },
    });
  }

  console.log(`Listo. Acceso admin: ${admin.email} / Admin123!`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
