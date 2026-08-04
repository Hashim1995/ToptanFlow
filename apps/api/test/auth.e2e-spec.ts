import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { hashPassword, verifyPassword } from '../src/users/password.util';
import { attachAuthUserMock, E2E_AUTH_USER, withAuth } from './auth-e2e.helper';

jest.mock('../src/users/password.util', () => ({
  verifyPassword: jest.fn(),
  hashPassword: jest.fn(),
}));

describe('Auth (e2e)', () => {
  const prisma = {
    onModuleInit: jest.fn().mockResolvedValue(undefined),
    onModuleDestroy: jest.fn().mockResolvedValue(undefined),
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    unit: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let app: INestApplication<App>;

  beforeEach(async () => {
    jest.clearAllMocks();
    attachAuthUserMock(prisma);
    prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof prisma) => Promise<unknown>) =>
        callback(prisma),
    );
    (hashPassword as jest.Mock).mockResolvedValue('hashed:new');

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

  it('POST /api/v1/auth/login returns access token and sets refresh cookie', async () => {
    prisma.user.findUnique.mockImplementation(
      (args: { where?: { id?: string; username?: string } }) => {
        if (args?.where?.id === E2E_AUTH_USER.id) {
          return Promise.resolve({ ...E2E_AUTH_USER });
        }
        if (args?.where?.username === E2E_AUTH_USER.username) {
          return Promise.resolve({ ...E2E_AUTH_USER, passwordHash: 'hash' });
        }
        return Promise.resolve(null);
      },
    );
    (verifyPassword as jest.Mock).mockResolvedValue(true);
    prisma.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: E2E_AUTH_USER.username, password: 'ChangeMe123!' })
      .expect(200);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.tokenType).toBe('Bearer');
    expect(response.body.expiresIn).toBe(86400);
    expect(response.body.user).toEqual({
      id: E2E_AUTH_USER.id,
      username: E2E_AUTH_USER.username,
      fullName: E2E_AUTH_USER.fullName,
      isSuperAdmin: E2E_AUTH_USER.isSuperAdmin,
    });
    expect(response.body).not.toHaveProperty('passwordHash');
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('refresh_token=')]),
    );
  });

  it('POST /api/v1/auth/login rejects bad password with 401', async () => {
    prisma.user.findUnique.mockImplementation(
      (args: { where?: { username?: string } }) => {
        if (args?.where?.username === E2E_AUTH_USER.username) {
          return Promise.resolve({ ...E2E_AUTH_USER, passwordHash: 'hash' });
        }
        return Promise.resolve(null);
      },
    );
    (verifyPassword as jest.Mock).mockResolvedValue(false);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: E2E_AUTH_USER.username, password: 'wrong' })
      .expect(401);
  });

  it('protected route returns 401 without Bearer token', async () => {
    await request(app.getHttpServer()).get('/api/v1/units').expect(401);
  });

  it('protected route succeeds with valid Bearer token', async () => {
    prisma.unit.findMany.mockResolvedValue([]);
    prisma.unit.count.mockResolvedValue(0);

    const response = await withAuth(request(app.getHttpServer()))
      .get('/api/v1/units')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        data: [],
        meta: expect.objectContaining({ total: 0 }),
      }),
    );
  });

  it('POST /api/v1/auth/logout clears session cookie', async () => {
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', ['refresh_token=opaque-value'])
      .expect(200);

    expect(response.body).toEqual({ ok: true });
    expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
  });

  it('POST /api/v1/auth/change-password requires auth', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/change-password')
      .send({
        currentPassword: 'ChangeMe123!',
        newPassword: 'NewPass123!',
        newPasswordConfirmation: 'NewPass123!',
      })
      .expect(401);
  });

  it('POST /api/v1/auth/change-password rejects mismatched confirmation', async () => {
    await withAuth(request(app.getHttpServer()))
      .post('/api/v1/auth/change-password')
      .send({
        currentPassword: 'ChangeMe123!',
        newPassword: 'NewPass123!',
        newPasswordConfirmation: 'OtherPass1!',
      })
      .expect(400);
  });

  it('POST /api/v1/auth/change-password rejects weak new password', async () => {
    await withAuth(request(app.getHttpServer()))
      .post('/api/v1/auth/change-password')
      .send({
        currentPassword: 'ChangeMe123!',
        newPassword: 'short',
        newPasswordConfirmation: 'short',
      })
      .expect(400);
  });

  it('POST /api/v1/auth/change-password rejects wrong current password', async () => {
    (verifyPassword as jest.Mock).mockResolvedValue(false);

    await withAuth(request(app.getHttpServer()))
      .post('/api/v1/auth/change-password')
      .send({
        currentPassword: 'WrongPass1!',
        newPassword: 'NewPass123!',
        newPasswordConfirmation: 'NewPass123!',
      })
      .expect(401);
  });

  it('POST /api/v1/auth/change-password succeeds and revokes refresh tokens', async () => {
    (verifyPassword as jest.Mock).mockResolvedValue(true);
    prisma.user.update.mockResolvedValue({ id: E2E_AUTH_USER.id });
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });

    const response = await withAuth(request(app.getHttpServer()))
      .post('/api/v1/auth/change-password')
      .send({
        currentPassword: 'ChangeMe123!',
        newPassword: 'NewPass123!',
        newPasswordConfirmation: 'NewPass123!',
      })
      .expect(200);

    expect(response.body).toEqual({ ok: true, requiresReauth: true });
    expect(response.body).not.toHaveProperty('passwordHash');
    expect(hashPassword).toHaveBeenCalledWith('NewPass123!');
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: {
        userId: E2E_AUTH_USER.id,
        revokedAt: null,
      },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
