import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { resolve } from 'path';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { BusinessPartnersService } from '../src/business-partners/business-partners.service';
import { ProductTypeApi } from '../src/products/dto/product-type.enum';
import { ProductsService } from '../src/products/products.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { loadApiEnvFiles } from '../src/config/load-api-env';

loadApiEnvFiles(resolve(__dirname, '..'));

function sortBigIntAsc(values: bigint[]): bigint[] {
  return [...values].sort((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });
}

function assertUniqueContiguousCodes(codes: string[]): void {
  expect(codes).toHaveLength(20);
  const asBigInt = codes.map((code) => BigInt(code));
  expect(new Set(asBigInt).size).toBe(20);

  const sorted = sortBigIntAsc(asBigInt);
  for (let i = 1; i < sorted.length; i += 1) {
    expect(sorted[i] - sorted[i - 1]).toBe(1n);
  }
}

describe('Business code sequences (concurrency)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let productsService: ProductsService;
  let businessPartnersService: BusinessPartnersService;

  const createdProductIds: string[] = [];
  const createdPartnerIds: string[] = [];
  let unitId: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    productsService = app.get(ProductsService);
    businessPartnersService = app.get(BusinessPartnersService);

    const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

    const unit = await prisma.unit.create({
      data: {
        code: `CU${suffix}`.slice(0, 32),
        name: `Concurrency unit ${suffix}`,
        isActive: true,
      },
    });
    unitId = unit.id;
  });

  afterAll(async () => {
    if (createdProductIds.length > 0) {
      await prisma.product.deleteMany({
        where: { id: { in: createdProductIds } },
      });
    }
    if (createdPartnerIds.length > 0) {
      await prisma.businessPartner.deleteMany({
        where: { id: { in: createdPartnerIds } },
      });
    }
    if (unitId) {
      await prisma.unit
        .delete({ where: { id: unitId } })
        .catch(() => undefined);
    }
    await app.close();
  });

  it('allocates independent unique contiguous sequences under concurrent load', async () => {
    const [productResults, partnerResults] = await Promise.all([
      Promise.all(
        Array.from({ length: 20 }, (_, index) =>
          productsService.create({
            name: `Concurrent product ${index}`,
            type: ProductTypeApi.FINISHED_GOOD,
            unitId,
          }),
        ),
      ),
      Promise.all(
        Array.from({ length: 20 }, (_, index) =>
          businessPartnersService.create({
            name: `Concurrent partner ${index}`,
            isCustomer: true,
            isSupplier: false,
          }),
        ),
      ),
    ]);

    createdProductIds.push(...productResults.map((row) => row.id));
    createdPartnerIds.push(...partnerResults.map((row) => row.id));

    const productCodes = productResults.map((row) => row.code);
    const partnerCodes = partnerResults.map((row) => row.code);

    assertUniqueContiguousCodes(productCodes);
    assertUniqueContiguousCodes(partnerCodes);

    expect(productCodes.every((code) => typeof code === 'string')).toBe(true);
    expect(partnerCodes.every((code) => typeof code === 'string')).toBe(true);
  });
});
