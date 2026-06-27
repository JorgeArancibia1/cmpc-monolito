import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Ingresa un correo electrónico válido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

/** Política de contraseña para cuentas nuevas: largo mínimo + mezcla de tipos. */
const passwordSchema = z
  .string()
  .min(10, 'La contraseña debe tener al menos 10 caracteres')
  .max(128, 'La contraseña es demasiado larga')
  .refine(
    (value) => /[a-z]/.test(value) && /[A-Z]/.test(value) && /[0-9]/.test(value),
    'La contraseña debe incluir al menos una mayúscula, una minúscula y un número',
  );

export const registerSchema = z.object({
  email: z.string().trim().email('Ingresa un correo electrónico válido'),
  password: passwordSchema,
  name: z.string().trim().min(2, 'Ingresa tu nombre'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export type Role = 'ADMIN' | 'USER';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
}
