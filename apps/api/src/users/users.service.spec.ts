import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { SortOrder } from '../common/sorting/sort-order.enum';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';
import * as passwordUtil from './password.util';

jest.mock('./password.util', () => ({
  hashPassword: jest.fn((plain: string) => Promise.resolve(`hashed:${plain}`)),
  verifyPassword: jest.fn(),
}));

describe('UsersService', () => {
  const userId = '11111111-1111-4111-8111-111111111111';
  const otherId = '22222222-2222-4222-8222-222222222222';

  const baseUser = {
    id: userId,
    fullName: 'Əli Məmmədov',
    username: 'ali',
    isActive: true,
    isSuperAdmin: false,
    createdAt: new Date('2026-07-29T00:00:00.000Z'),
    updatedAt: new Date('2026-07-29T00:00:00.000Z'),
  };

  const prisma = {
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates a user and hashes the password', async () => {
      prisma.user.create.mockResolvedValue(baseUser);

      const result = await service.create({
        fullName: ' Əli Məmmədov ',
        username: ' ali ',
        password: 'ChangeMe123!',
      });

      expect(passwordUtil.hashPassword).toHaveBeenCalledWith('ChangeMe123!');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          fullName: 'Əli Məmmədov',
          username: 'ali',
          passwordHash: 'hashed:ChangeMe123!',
          isSuperAdmin: false,
        },
        select: expect.any(Object) as object,
      });
      expect(result).toEqual(baseUser);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('throws ConflictException on duplicate username', async () => {
      prisma.user.create.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.create({
          fullName: 'Əli',
          username: 'ali',
          password: 'ChangeMe123!',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects empty username after trim', async () => {
      await expect(
        service.create({
          fullName: 'Əli',
          username: '   ',
          password: 'ChangeMe123!',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('list', () => {
    it('returns paginated users without passwordHash', async () => {
      prisma.user.findMany.mockResolvedValue([baseUser]);
      prisma.user.count.mockResolvedValue(1);

      const result = await service.list({
        page: 1,
        pageSize: 20,
        sortOrder: SortOrder.ASC,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).not.toHaveProperty('passwordHash');
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(userId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates fullName and optionally password', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.user.update.mockResolvedValue({
        ...baseUser,
        fullName: 'Yeni Ad',
      });

      const result = await service.update(userId, {
        fullName: 'Yeni Ad',
        password: 'NewPass123!',
      });

      expect(passwordUtil.hashPassword).toHaveBeenCalledWith('NewPass123!');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          fullName: 'Yeni Ad',
          passwordHash: 'hashed:NewPass123!',
        },
        select: expect.any(Object) as object,
      });
      expect(result.fullName).toBe('Yeni Ad');
    });

    it('reactivates via isActive true', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        isActive: false,
      });
      prisma.user.update.mockResolvedValue(baseUser);

      const result = await service.update(userId, { isActive: true });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { isActive: true },
        select: expect.any(Object) as object,
      });
      expect(result.isActive).toBe(true);
    });

    it('throws ConflictException when username taken', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.user.findFirst.mockResolvedValue({ id: otherId });

      await expect(
        service.update(userId, { username: 'taken' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects empty update body', async () => {
      await expect(service.update(userId, {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('deactivate', () => {
    it('sets isActive false when active', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.user.update.mockResolvedValue({
        ...baseUser,
        isActive: false,
      });

      const result = await service.deactivate(userId);

      expect(result.isActive).toBe(false);
    });

    it('is idempotent when already inactive', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        isActive: false,
      });

      const result = await service.deactivate(userId);

      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(result.isActive).toBe(false);
    });

    it('refuses to deactivate a Super Admin', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        isSuperAdmin: true,
      });

      await expect(service.deactivate(userId)).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 'SUPERADMIN_IMMUTABLE',
        }),
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
