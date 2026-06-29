import type { AuthUser } from '@cmpc/contracts';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthService, RequestContext, SessionWithRefresh } from './auth.service';
import { ChangePasswordDto, LoginDto, RegisterDto } from './dto/auth.dto';
import type { RefreshPayload } from './strategies/jwt.strategy';

// En producción el refresh usa el prefijo __Host- (exige Secure + Path=/ + sin Domain),
// que impide que un subdominio sobreescriba la cookie. En dev (sin HTTPS) no aplica.
const REFRESH_COOKIE_DEV = 'refresh_token';
const REFRESH_COOKIE_PROD = '__Host-refresh_token';
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Crear una cuenta e iniciar sesión' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withSession(await this.auth.register(dto, this.context(req)), res);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withSession(await this.auth.login(dto, this.context(req)), res);
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar la sesión' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.assertTrustedOrigin(req);
    const token = req.cookies?.[this.refreshCookieName];
    if (!token) {
      throw new UnauthorizedException('Tu sesión expiró. Inicia sesión nuevamente.');
    }
    let payload: RefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(token, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Tu sesión expiró. Inicia sesión nuevamente.');
    }
    return this.withSession(await this.auth.refresh(payload, token, this.context(req)), res);
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesión' })
  async logout(
    @CurrentUser('id') userId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.[this.refreshCookieName];
    if (token) {
      try {
        const payload = await this.jwt.verifyAsync<RefreshPayload>(token, {
          secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
        });
        if (payload.sub === userId) {
          await this.auth.logout(payload);
        }
      } catch {
        // Cookie inválida o vencida: basta con limpiarla.
      }
    }
    res.clearCookie(this.refreshCookieName, { path: '/' });
    return { ok: true };
  }

  @ApiBearerAuth()
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar la contraseña del usuario autenticado' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.changePassword(userId, dto);
    // Las sesiones quedaron revocadas: limpiamos las cookies para forzar un nuevo login.
    res.clearCookie(this.refreshCookieName, { path: '/' });
    return { ok: true };
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Datos del usuario autenticado' })
  me(@CurrentUser() user: AuthUser) {
    return user;
  }

  /** Metadatos de la petición (para trazabilidad de la sesión). */
  private context(req: Request): RequestContext {
    return { userAgent: req.header('user-agent') ?? undefined, ip: req.ip };
  }

  private get isProd(): boolean {
    return this.config.get('NODE_ENV') === 'production';
  }

  private get refreshCookieName(): string {
    return this.isProd ? REFRESH_COOKIE_PROD : REFRESH_COOKIE_DEV;
  }

  private baseCookieOptions() {
    return {
      secure: this.isProd,
      sameSite: (this.isProd ? 'none' : 'lax') as 'none' | 'lax',
      path: '/',
    };
  }

  /**
   * Protección CSRF compatible con Vercel + Render: el refresh token vive en una cookie
   * httpOnly y /refresh solo acepta navegadores cuyo Origin esté en CORS_ORIGIN.
   * Esto evita depender de leer una cookie csrf_token desde otro dominio.
   */
  private assertTrustedOrigin(req: Request): void {
    const origin = req.header('origin');
    if (!origin) {
      return;
    }
    const allowedOrigins =
      this.config
        .get<string>('CORS_ORIGIN')
        ?.split(',')
        .map((value) => value.trim())
        .filter(Boolean) ?? [];

    if (!allowedOrigins.includes(origin)) {
      throw new UnauthorizedException('Tu sesión expiró. Inicia sesión nuevamente.');
    }
  }

  /** Guarda el refresh token (httpOnly) y devuelve { user, accessToken }. */
  private withSession(session: SessionWithRefresh, res: Response) {
    const base = this.baseCookieOptions();
    res.cookie(this.refreshCookieName, session.refreshToken, {
      httpOnly: true,
      ...base,
      maxAge: REFRESH_MAX_AGE,
    });
    return { user: session.user, accessToken: session.accessToken };
  }
}
