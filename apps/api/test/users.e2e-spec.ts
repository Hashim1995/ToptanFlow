import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  attachAuthUserMock,
  E2E_AUTH_USER,
  mockUserFindUniqueResolved,
  withAuth,
} from './auth-e2e.helper';

describe('Users (e2e)', () => {
  const userId = '11111111-1111-4111-8111-111111111111';
  const createdAt = new Date('2026-07-29T00:00:00.000Z');
  const updatedAt = new Date('2026-07-29T00:00:00.000Z');

  const baseUser = {
    id: userId,
    fullName: 'Əli Məmmədov',
    username: 'ali',
    isActive: true,
    isSuperAdmin: false,
    createdAt,
    updatedAt,
  };

  const prisma = {
    onModuleInit: jest.fn().mockResolvedValue(undefined),
    onModuleDestroy: jest.fn().mockResolvedValue(undefined),
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  let app: INestApplication<App>;

  beforeEach(async () => {
    jest.clearAllMocks();
    attachAuthUserMock(prisma);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /api/v1/users creates a user and never returns passwordHash', async () => {
    prisma.user.create.mockResolvedValue(baseUser);

    const response = await withAuth(request(app.getHttpServer()))
      .post('/api/v1/users')
      .send({
        fullName: ' Əli Məmmədov ',
        username: ' ali ',
        password: 'ChangeMe123!',
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: userId,
        fullName: 'Əli Məmmədov',
        username: 'ali',
        isActive: true,
        isSuperAdmin: false,
        createdAt: expect.any(String) as string,
        updatedAt: expect.any(String) as string,
      }),
    );
    expect(response.body).not.toHaveProperty('passwordHash');
    expect(JSON.stringify(response.body)).not.toMatch(/passwordHash|argon2/i);

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fullName: 'Əli Məmmədov',
          username: 'ali',
          passwordHash: expect.any(String) as string,
          isSuperAdmin: false,
        }) as object,
        select: expect.not.objectContaining({
          passwordHash: true,
        }) as object,
      }),
    );

    const createCall = prisma.user.create.mock.calls[0][0] as {
      data: { passwordHash: string };
    };
    expect(createCall.data.passwordHash).not.toBe('ChangeMe123!');
    expect(createCall.data.passwordHash.length).toBeGreaterThan(20);
  }, 30_000);

  it('POST /api/v1/users rejects short passwords with 400', async () => {
    const response = await withAuth(request(app.getHttpServer()))
      .post('/api/v1/users')
      .send({
        fullName: 'Əli',
        username: 'ali',
        password: 'short',
      })
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 400,
        path: '/api/v1/users',
      }),
    );
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('POST /api/v1/users maps duplicate username to 409', async () => {
    prisma.user.create.mockRejectedValue({ code: 'P2002' });

    const response = await withAuth(request(app.getHttpServer()))
      .post('/api/v1/users')
      .send({
        fullName: 'Əli',
        username: 'ali',
        password: 'ChangeMe123!',
      })
      .expect(409);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 409,
        message: 'Username already exists',
      }),
    );
  }, 30_000);

  it('GET /api/v1/users returns paginated data without passwordHash', async () => {
    prisma.user.findMany.mockResolvedValue([baseUser]);
    prisma.user.count.mockResolvedValue(1);

    const response = await withAuth(request(app.getHttpServer()))
      .get('/api/v1/users')
      .expect(200);

    expect(response.body).toEqual({
      data: [
        expect.objectContaining({
          id: userId,
          fullName: 'Əli Məmmədov',
          username: 'ali',
          isActive: true,
          isSuperAdmin: false,
          createdAt: expect.any(String) as string,
          updatedAt: expect.any(String) as string,
        }),
      ],
      meta: {
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      },
    });
    expect(JSON.stringify(response.body)).not.toMatch(/passwordHash/i);
  });

  it('GET /api/v1/users/:id maps missing user to 404', async () => {
    mockUserFindUniqueResolved(prisma, null);

    const response = await withAuth(request(app.getHttpServer()))
      .get(`/api/v1/users/${userId}`)
      .expect(404);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 404,
        message: 'User not found',
      }),
    );
  });

  it('PATCH /api/v1/users/:id updates fullName and omits passwordHash', async () => {
    mockUserFindUniqueResolved(prisma, baseUser);
    prisma.user.update.mockResolvedValue({
      ...baseUser,
      fullName: 'Yeni Ad',
    });

    const response = await withAuth(request(app.getHttpServer()))
      .patch(`/api/v1/users/${userId}`)
      .send({ fullName: 'Yeni Ad' })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: userId,
        fullName: 'Yeni Ad',
      }),
    );
    expect(response.body).not.toHaveProperty('passwordHash');
  });

  it('DELETE /api/v1/users/:id soft-deactivates and is idempotent', async () => {
    mockUserFindUniqueResolved(prisma, baseUser);
    prisma.user.update.mockResolvedValue({
      ...baseUser,
      isActive: false,
    });

    const first = await withAuth(request(app.getHttpServer()))
      .delete(`/api/v1/users/${userId}`)
      .expect(200);

    expect(first.body).toEqual(
      expect.objectContaining({
        id: userId,
        isActive: false,
      }),
    );
    expect(prisma.user.delete).not.toHaveBeenCalled();

    mockUserFindUniqueResolved(prisma, {
      ...baseUser,
      isActive: false,
    });
    prisma.user.update.mockClear();

    const second = await withAuth(request(app.getHttpServer()))
      .delete(`/api/v1/users/${userId}`)
      .expect(200);

    expect(second.body).toEqual(
      expect.objectContaining({
        id: userId,
        isActive: false,
      }),
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('PATCH /api/v1/users/:id reactivates via isActive true', async () => {
    mockUserFindUniqueResolved(prisma, {
      ...baseUser,
      isActive: false,
    });
    prisma.user.update.mockResolvedValue({
      ...baseUser,
      isActive: true,
    });

    const response = await withAuth(request(app.getHttpServer()))
      .patch(`/api/v1/users/${userId}`)
      .send({ isActive: true })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: userId,
        isActive: true,
      }),
    );
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { isActive: true },
      }),
    );
  });

  it('GET /api/v1/users rejects non-superadmin with 403', async () => {
    prisma.user.findUnique = jest.fn((args: { where?: { id?: string } }) => {
      if (args?.where?.id === E2E_AUTH_USER.id) {
        return Promise.resolve({ ...E2E_AUTH_USER, isSuperAdmin: false });
      }
      return Promise.resolve(null);
    });

    const response = await withAuth(request(app.getHttpServer()))
      .get('/api/v1/users')
      .expect(403);

    expect(response.body).toEqual(
      expect.objectContaining({
        code: 'SUPERADMIN_REQUIRED',
      }),
    );
  });
});
