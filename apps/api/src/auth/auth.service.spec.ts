import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import * as passwordUtil from '../users/password.util';
import { AuthService } from './auth.service';

jest.mock('../users/password.util', () => ({
  verifyPassword: jest.fn(),
  hashPassword: jest.fn(),
}));

jest.mock('./refresh-token.util', () => ({
  generateRefreshToken: jest.fn(() => 'opaque-refresh-token'),
  hashRefreshToken: jest.fn((token: string) => `hash:${token}`),
}));

describe('AuthService', () => {
  const userId = '11111111-1111-4111-8111-111111111111';
  const user = {
    id: userId,
    username: 'ali',
    fullName: 'Əli Məmmədov',
    passwordHash: 'stored-hash',
    isActive: true,
  };

  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const jwtService = {
    signAsync: jest.fn().mockResolvedValue('access.jwt.token'),
  };

  const configService = {
    get: jest.fn((key: string, fallback?: unknown) => {
      const values: Record<string, unknown> = {
        JWT_REFRESH_EXPIRES_DAYS: 30,
        JWT_ACCESS_EXPIRES_IN: '24h',
        REFRESH_COOKIE_NAME: 'refresh_token',
        NODE_ENV: 'test',
      };
      return values[key] ?? fallback;
    }),
  };

  const cookie = jest.fn();
  const clearCookie = jest.fn();
  const res = {
    cookie,
    clearCookie,
  } as unknown as Response;

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    (passwordUtil.verifyPassword as jest.Mock).mockResolvedValue(true);
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    );
  });

  describe('login', () => {
    it('issues access token and sets refresh cookie for active user', async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

      const result = await service.login(
        { username: ' ali ', password: 'ChangeMe123!' },
        res,
      );

      expect(passwordUtil.verifyPassword).toHaveBeenCalledWith(
        'stored-hash',
        'ChangeMe123!',
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: userId,
        username: 'ali',
      });
      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          tokenHash: 'hash:opaque-refresh-token',
        }) as object,
      });
      expect(cookie).toHaveBeenCalledWith(
        'refresh_token',
        'opaque-refresh-token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result).toEqual({
        accessToken: 'access.jwt.token',
        tokenType: 'Bearer',
        expiresIn: 86400,
        user: {
          id: userId,
          username: 'ali',
          fullName: 'Əli Məmmədov',
        },
      });
      expect(JSON.stringify(result)).not.toMatch(/password|stored-hash/i);
    });

    it('rejects inactive users without revealing existence', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...user, isActive: false });

      await expect(
        service.login({ username: 'ali', password: 'ChangeMe123!' }, res),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('rejects bad password', async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      (passwordUtil.verifyPassword as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ username: 'ali', password: 'wrong' }, res),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('rotates refresh token and returns new access token', async () => {
      const oldId = '22222222-2222-4222-8222-222222222222';
      prisma.refreshToken.findFirst.mockResolvedValue({
        id: oldId,
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
        user,
      });
      prisma.refreshToken.update.mockResolvedValue({ id: oldId });
      prisma.refreshToken.create.mockResolvedValue({ id: 'new-rt' });

      const result = await service.refresh('opaque-refresh-token', res);

      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: oldId },
        data: { revokedAt: expect.any(Date) as Date },
      });
      expect(prisma.refreshToken.create).toHaveBeenCalled();
      expect(result.accessToken).toBe('access.jwt.token');
    });

    it('rejects missing refresh cookie', async () => {
      await expect(service.refresh(undefined, res)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects revoked refresh token', async () => {
      prisma.refreshToken.findFirst.mockResolvedValue({
        id: 'rt',
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: new Date(),
        user,
      });

      await expect(
        service.refresh('opaque-refresh-token', res),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('revokes refresh token and clears cookie', async () => {
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.logout('opaque-refresh-token', res);

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          tokenHash: 'hash:opaque-refresh-token',
          revokedAt: null,
        },
        data: { revokedAt: expect.any(Date) as Date },
      });
      expect(clearCookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result).toEqual({ ok: true });
    });
  });
});
