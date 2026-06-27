import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '@cmpc/contracts';

/** Inyecta el usuario autenticado (cargado por la estrategia JWT) en el handler. */
export const CurrentUser = createParamDecorator(
  (field: keyof AuthUser | undefined, ctx: ExecutionContext): AuthUser | string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUser;
    return field ? user?.[field] : user;
  },
);
