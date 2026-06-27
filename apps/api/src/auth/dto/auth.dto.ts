import { changePasswordSchema, loginSchema, registerSchema } from '@cmpc/contracts';
import { createZodDto } from 'nestjs-zod';

/** DTOs derivados de los contratos compartidos: una sola fuente de validación. */
export class LoginDto extends createZodDto(loginSchema) {}
export class RegisterDto extends createZodDto(registerSchema) {}
export class ChangePasswordDto extends createZodDto(changePasswordSchema) {}
