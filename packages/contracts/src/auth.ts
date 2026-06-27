import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Ingresa un correo electrónico válido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

/** Política de contraseña: largo mínimo + mezcla de tipos. Reutilizable en back y front. */
export const passwordSchema = z
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

/** Cambio de contraseña del usuario autenticado: actual + nueva (con la misma política). */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
    newPassword: passwordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser distinta de la actual',
    path: ['newPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

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
