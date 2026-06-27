import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marca un endpoint como público (omite la autenticación global). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
