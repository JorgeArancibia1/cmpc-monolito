import type { AuthSession } from '@cmpc/contracts';
import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { UsersService } from '../users/users.service';
import type { ChangePasswordDto, LoginDto, RegisterDto } from './dto/auth.dto';
import { PasswordService } from './password.service';
import { SessionsService } from './sessions.service';
import type { JwtPayload, RefreshPayload } from './strategies/jwt.strategy';

const SALT_ROUNDS = 10;
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const EXPIRED = 'Tu sesión expiró. Inicia sesión nuevamente.';

export interface SessionWithRefresh extends AuthSession {
  refreshToken: string;
}

/** Metadatos de la petición que se guardan con la sesión (trazabilidad). */
export interface RequestContext {
  userAgent?: string;
  ip?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionsService,
  ) {}

  async register(dto: RegisterDto, ctx?: RequestContext): Promise<SessionWithRefresh> {
    const passwordHash = await this.passwords.hash(dto.password);
    const user = await this.users.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
      role: Role.USER,
    });
    return this.startSession(user, randomUUID(), ctx);
  }

  async login(dto: LoginDto, ctx?: RequestContext): Promise<SessionWithRefresh> {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !(await this.passwords.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('El correo o la contraseña no son correctos.');
    }
    // Migración progresiva: si el hash es heredado (bcrypt), se re-hashea a argon2id al iniciar sesión.
    if (this.passwords.needsRehash(user.passwordHash)) {
      await this.users.updatePasswordHash(user.id, await this.passwords.hash(dto.password));
    }
    return this.startSession(user, randomUUID(), ctx);
  }

  /**
   * Renueva la sesión rotando el refresh token. Detecta el reuso de un token ya rotado
   * (señal de robo) y, en ese caso, revoca toda la familia de sesiones.
   */
  async refresh(
    payload: RefreshPayload,
    refreshToken: string,
    ctx?: RequestContext,
  ): Promise<SessionWithRefresh> {
    const session = await this.sessions.findById(payload.sid);

    // La sesión no existe o no concuerda con el token → tratamos la familia como comprometida.
    if (!session || session.familyId !== payload.fid || session.userId !== payload.sub) {
      if (payload.fid) {
        await this.sessions.revokeFamily(payload.fid);
      }
      throw new ForbiddenException(EXPIRED);
    }

    // Reuso de un refresh ya revocado/rotado, o vencido → revocamos toda la familia.
    if (session.revokedAt || session.expiresAt.getTime() < Date.now()) {
      await this.sessions.revokeFamily(session.familyId);
      throw new ForbiddenException(EXPIRED);
    }

    // El token no coincide con el hash almacenado → también es sospechoso.
    if (!(await bcrypt.compare(refreshToken, session.tokenHash))) {
      await this.sessions.revokeFamily(session.familyId);
      throw new ForbiddenException(EXPIRED);
    }

    const user = await this.users.findById(session.userId);
    if (!user) {
      await this.sessions.revokeFamily(session.familyId);
      throw new ForbiddenException(EXPIRED);
    }

    return this.startSession(user, session.familyId, ctx, session.id);
  }

  /** Cierra la sesión del dispositivo: revoca la familia del refresh token presentado. */
  async logout(payload: RefreshPayload | null): Promise<void> {
    if (payload?.fid) {
      await this.sessions.revokeFamily(payload.fid);
    }
  }

  /**
   * Cambia la contraseña del usuario autenticado. Verifica la actual, guarda la nueva (argon2)
   * y revoca **todas** sus sesiones por seguridad: debe volver a iniciar sesión en todos lados.
   */
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user || !(await this.passwords.verify(user.passwordHash, dto.currentPassword))) {
      throw new UnauthorizedException('La contraseña actual no es correcta.');
    }
    await this.users.updatePasswordHash(user.id, await this.passwords.hash(dto.newPassword));
    await this.sessions.revokeAllForUser(user.id);
  }

  /**
   * Emite los tokens y persiste la nueva sesión. Si `previousSessionId` existe, se trata
   * de una rotación: se revoca la sesión anterior apuntando a la nueva.
   */
  private async startSession(
    user: User,
    familyId: string,
    ctx?: RequestContext,
    previousSessionId?: string,
  ): Promise<SessionWithRefresh> {
    const sessionId = randomUUID();
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    const refreshPayload: RefreshPayload = { sub: user.id, sid: sessionId, fid: familyId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(accessPayload, {
        secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_TTL', '15m'),
      }),
      this.jwt.signAsync(refreshPayload, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_TTL', '7d'),
      }),
    ]);

    await this.sessions.create({
      id: sessionId,
      userId: user.id,
      familyId,
      tokenHash: await bcrypt.hash(refreshToken, SALT_ROUNDS),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      userAgent: ctx?.userAgent ?? null,
      ip: ctx?.ip ?? null,
    });

    if (previousSessionId) {
      await this.sessions.revoke(previousSessionId, sessionId);
    }

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      accessToken,
      refreshToken,
    };
  }
}
