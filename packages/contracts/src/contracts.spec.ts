import { describe, expect, it } from 'vitest';
import { changePasswordSchema, loginSchema, passwordSchema } from './auth';
import { bookFormSchema } from './book';
import { booleanish, paginationSchema } from './common';

// ─── bookFormSchema ────────────────────────────────────────────────────────────

const validBook = {
  title: 'Cien años de soledad',
  price: 19990,
  stock: 5,
  publisherId: '11111111-1111-4111-8111-111111111111',
  genreId: '22222222-2222-4222-8222-222222222222',
  authorIds: ['33333333-3333-4333-8333-333333333333'],
};

describe('bookFormSchema', () => {
  it('acepta un libro completo y válido', () => {
    expect(bookFormSchema.safeParse(validBook).success).toBe(true);
  });

  it('rechaza título vacío', () => {
    expect(bookFormSchema.safeParse({ ...validBook, title: '' }).success).toBe(false);
  });

  it('rechaza precio decimal (CLP no tiene centavos)', () => {
    expect(bookFormSchema.safeParse({ ...validBook, price: 9990.5 }).success).toBe(false);
  });

  it('rechaza precio negativo', () => {
    expect(bookFormSchema.safeParse({ ...validBook, price: -1 }).success).toBe(false);
  });

  it('acepta precio como string numérico entero (coerción de formulario HTML)', () => {
    const result = bookFormSchema.safeParse({ ...validBook, price: '19990' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.price).toBe(19990);
  });

  it('acepta ISBN-13 con guiones (normalizado internamente)', () => {
    expect(bookFormSchema.safeParse({ ...validBook, isbn: '978-0-307-47472-8' }).success).toBe(true);
  });

  it('acepta ISBN-10 con guiones', () => {
    expect(bookFormSchema.safeParse({ ...validBook, isbn: '0-306-40615-2' }).success).toBe(true);
  });

  it('rechaza ISBN con dígitos insuficientes', () => {
    expect(bookFormSchema.safeParse({ ...validBook, isbn: '12345' }).success).toBe(false);
  });

  it('convierte isbn vacío a undefined (campo omitible en el formulario)', () => {
    const result = bookFormSchema.safeParse({ ...validBook, isbn: '' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isbn).toBeUndefined();
  });

  it('rechaza año de publicación anterior a 1450', () => {
    expect(bookFormSchema.safeParse({ ...validBook, publishedYear: 1449 }).success).toBe(false);
  });

  it('rechaza lista de autores vacía', () => {
    expect(bookFormSchema.safeParse({ ...validBook, authorIds: [] }).success).toBe(false);
  });

  it('rechaza publisherId que no sea UUID', () => {
    expect(bookFormSchema.safeParse({ ...validBook, publisherId: 'no-es-uuid' }).success).toBe(false);
  });
});

// ─── passwordSchema ────────────────────────────────────────────────────────────

describe('passwordSchema (política de contraseña)', () => {
  it('acepta contraseña que cumple la política completa', () => {
    expect(passwordSchema.safeParse('MiPassword1').success).toBe(true);
  });

  it('rechaza contraseña de menos de 10 caracteres', () => {
    expect(passwordSchema.safeParse('Corto1').success).toBe(false);
  });

  it('rechaza contraseña sin mayúsculas', () => {
    expect(passwordSchema.safeParse('minusculas1').success).toBe(false);
  });

  it('rechaza contraseña sin minúsculas', () => {
    expect(passwordSchema.safeParse('MAYUSCULAS1').success).toBe(false);
  });

  it('rechaza contraseña sin dígitos', () => {
    expect(passwordSchema.safeParse('SinDigitos!').success).toBe(false);
  });
});

// ─── changePasswordSchema ──────────────────────────────────────────────────────

describe('changePasswordSchema', () => {
  it('acepta cuando la nueva contraseña es diferente a la actual', () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: 'claveActual',
        newPassword: 'NuevaClave1',
      }).success,
    ).toBe(true);
  });

  it('rechaza cuando la nueva contraseña es igual a la actual', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'MismaKey123',
      newPassword: 'MismaKey123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('newPassword');
    }
  });

  it('rechaza cuando currentPassword está vacío', () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: '',
        newPassword: 'NuevaClave1',
      }).success,
    ).toBe(false);
  });
});

// ─── loginSchema ───────────────────────────────────────────────────────────────

describe('loginSchema', () => {
  it('acepta credenciales válidas', () => {
    expect(loginSchema.safeParse({ email: 'admin@cmpc.cl', password: 'x' }).success).toBe(true);
  });

  it('rechaza email malformado', () => {
    expect(loginSchema.safeParse({ email: 'no-es-email', password: 'x' }).success).toBe(false);
  });

  it('rechaza contraseña vacía', () => {
    expect(loginSchema.safeParse({ email: 'a@b.cl', password: '' }).success).toBe(false);
  });

  it('elimina espacios del email (trim)', () => {
    const result = loginSchema.safeParse({ email: '  admin@cmpc.cl  ', password: 'x' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe('admin@cmpc.cl');
  });
});

// ─── booleanish ────────────────────────────────────────────────────────────────

describe('booleanish (coerción de query params)', () => {
  it('convierte el string "true" a booleano true', () => {
    expect(booleanish.parse('true')).toBe(true);
  });

  it('convierte el string "false" a booleano false', () => {
    expect(booleanish.parse('false')).toBe(false);
  });

  it('rechaza un string arbitrario', () => {
    expect(booleanish.safeParse('yes').success).toBe(false);
  });

  it('acepta un booleano nativo directamente', () => {
    expect(booleanish.parse(true)).toBe(true);
  });
});

// ─── paginationSchema ──────────────────────────────────────────────────────────

describe('paginationSchema', () => {
  it('convierte strings de query a números', () => {
    expect(paginationSchema.parse({ page: '2', pageSize: '20' })).toEqual({ page: 2, pageSize: 20 });
  });

  it('aplica page=1 y pageSize=10 como valores por defecto', () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, pageSize: 10 });
  });

  it('rechaza page menor a 1', () => {
    expect(paginationSchema.safeParse({ page: 0 }).success).toBe(false);
  });

  it('rechaza pageSize mayor a 100', () => {
    expect(paginationSchema.safeParse({ pageSize: 101 }).success).toBe(false);
  });
});
