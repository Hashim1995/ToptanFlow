import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { CookieOptions, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { verifyPassword } from '../users/password.util';
import { AuthTokensResponseDto } from './dto/auth-tokens-response.dto';
import { LoginDto } from './dto/login.dto';
import { generateRefreshToken, hashRefreshToken } from './refresh-token.util';

export type AccessTokenPayload = {
  sub: string;
  username: string;
};

type ActiveUserRecord = {
  id: string;
  username: string;
  fullName: string;
  passwordHash: string;
  isActive: boolean;
  isSuperAdmin: boolean;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto, res: Response): Promise<AuthTokensResponseDto> {
    const username = dto.username.trim();
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        fullName: true,
        passwordHash: true,
        isActive: true,
        isSuperAdmin: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordOk = await verifyPassword(user.passwordHash, dto.password);
    if (!passwordOk) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueSession(user, res);
  }

  async refresh(
    rawRefreshToken: string | undefined,
    res: Response,
  ): Promise<AuthTokensResponseDto> {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }

    const tokenHash = hashRefreshToken(rawRefreshToken);
    const existing = await this.prisma.refreshToken.findFirst({
      where: { tokenHash },
      select: {
        id: true,
        expiresAt: true,
        revokedAt: true,
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            passwordHash: true,
            isActive: true,
            isSuperAdmin: true,
          },
        },
      },
    });

    if (!existing || existing.revokedAt || existing.expiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!existing.user.isActive) {
      await this.prisma.refreshToken.update({
        where: { id: existing.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });

    return this.issueSession(existing.user, res);
  }

  async logout(
    rawRefreshToken: string | undefined,
    res: Response,
  ): Promise<{ ok: true }> {
    if (rawRefreshToken) {
      const tokenHash = hashRefreshToken(rawRefreshToken);
      await this.prisma.refreshToken.updateMany({
        where: {
          tokenHash,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    }

    this.clearRefreshCookie(res);
    return { ok: true };
  }

  private async issueSession(
    user: ActiveUserRecord,
    res: Response,
  ): Promise<AuthTokensResponseDto> {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      username: user.username,
    } satisfies AccessTokenPayload);

    const rawRefresh = generateRefreshToken();
    const tokenHash = hashRefreshToken(rawRefresh);
    const expiresAt = this.refreshExpiresAt();

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    this.setRefreshCookie(res, rawRefresh, expiresAt);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.accessExpiresInSeconds(),
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        isSuperAdmin: user.isSuperAdmin,
      },
    };
  }

  private refreshExpiresAt(): Date {
    const days = this.configService.get<number>('JWT_REFRESH_EXPIRES_DAYS', 30);
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  private accessExpiresInSeconds(): number {
    const raw = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '24h');
    if (raw === '24h' || raw === '1d') {
      return 24 * 60 * 60;
    }
    const match = /^(\d+)([smhd])$/.exec(raw);
    if (!match) {
      return 24 * 60 * 60;
    }
    const value = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 24 * 60 * 60,
    };
    return value * (multipliers[unit] ?? 60 * 60);
  }

  private setRefreshCookie(
    res: Response,
    token: string,
    expiresAt: Date,
  ): void {
    res.cookie(this.cookieName(), token, this.cookieOptions(expiresAt));
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(this.cookieName(), this.cookieOptions(new Date(0)));
  }

  private cookieName(): string {
    return this.configService.get<string>(
      'REFRESH_COOKIE_NAME',
      'refresh_token',
    );
  }

  private cookieOptions(expires: Date): CookieOptions {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    return {
      httpOnly: true,
      secure: nodeEnv === 'production',
      sameSite: 'lax',
      path: '/',
      expires,
    };
  }
}
