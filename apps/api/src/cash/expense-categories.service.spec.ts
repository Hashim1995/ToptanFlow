import { ConflictException, NotFoundException } from '@nestjs/common';
import { ExpenseCategoriesService } from './expense-categories.service';

describe('ExpenseCategoriesService', () => {
  const actorId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const categoryId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  const row = {
    id: categoryId,
    name: 'Ofis',
    isActive: true,
    deactivatedAt: null as Date | null,
    deactivationReason: null as string | null,
    createdAt: new Date('2026-08-01'),
    updatedAt: new Date('2026-08-01'),
    createdByUserId: actorId,
  };

  const prisma = {
    expenseCategory: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const service = new ExpenseCategoriesService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a category', async () => {
    prisma.expenseCategory.create.mockResolvedValue(row);
    const result = await service.create({ name: 'Ofis' }, actorId);
    expect(result.name).toBe('Ofis');
    expect(prisma.expenseCategory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Ofis',
          createdByUserId: actorId,
        }),
      }),
    );
  });

  it('maps unique conflict', async () => {
    prisma.expenseCategory.create.mockRejectedValue({ code: 'P2002' });
    await expect(
      service.create({ name: 'Ofis' }, actorId),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('deactivates and reactivates', async () => {
    prisma.expenseCategory.findUnique.mockResolvedValue(row);
    prisma.expenseCategory.update.mockResolvedValue({
      ...row,
      isActive: false,
      deactivatedAt: new Date(),
    });
    const deactivated = await service.deactivate(categoryId, {
      reason: 'unused',
    });
    expect(deactivated.isActive).toBe(false);

    prisma.expenseCategory.findUnique.mockResolvedValue({
      ...row,
      isActive: false,
    });
    prisma.expenseCategory.update.mockResolvedValue(row);
    const reactivated = await service.reactivate(categoryId);
    expect(reactivated.isActive).toBe(true);
  });

  it('assertActiveCategory rejects missing/inactive', async () => {
    prisma.expenseCategory.findUnique.mockResolvedValue(null);
    await expect(
      service.assertActiveCategory(categoryId),
    ).rejects.toBeInstanceOf(NotFoundException);

    prisma.expenseCategory.findUnique.mockResolvedValue({
      id: categoryId,
      isActive: false,
    });
    await expect(
      service.assertActiveCategory(categoryId),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'EXPENSE_CATEGORY_INACTIVE' }),
    });
  });
});
