import { formatQuantity } from '../../../shared/ui/format';

export type QuantityShortage = {
  productId: string;
  code: string;
  name: string;
  available: number;
  requested: number;
  after: number;
  shortage: number;
};

type LineLike = {
  productId: string;
  quantity: string;
  productCodeSnapshot?: string;
  productNameSnapshot?: string;
};

type ProductLike = {
  id: string;
  code: string;
  name: string;
  currentQuantity: string;
};

/**
 * Aggregates sale line quantities per product and returns shortages when
 * available quantity would go below zero after posting.
 */
export function computeQuantityShortages(
  lines: LineLike[],
  products: ProductLike[],
): QuantityShortage[] {
  const productById = new Map(products.map((product) => [product.id, product]));
  const requestedByProduct = new Map<string, number>();

  for (const line of lines) {
    const qty = Number.parseFloat(line.quantity);
    if (!Number.isFinite(qty) || qty <= 0) continue;
    requestedByProduct.set(
      line.productId,
      (requestedByProduct.get(line.productId) ?? 0) + qty,
    );
  }

  const shortages: QuantityShortage[] = [];
  for (const [productId, requested] of requestedByProduct) {
    const product = productById.get(productId);
    // Skip when live quantity is unavailable client-side; backend still enforces.
    if (!product) continue;
    const available = Number.parseFloat(product.currentQuantity);
    const safeAvailable = Number.isFinite(available) ? available : 0;
    const after = safeAvailable - requested;
    if (after >= 0) continue;

    shortages.push({
      productId,
      code: product.code,
      name: product.name,
      available: safeAvailable,
      requested,
      after,
      shortage: Math.abs(after),
    });
  }

  return shortages;
}

export function formatShortageLine(shortage: QuantityShortage): string {
  return `${shortage.code} — ${shortage.name}: cari ${formatQuantity(shortage.available)}, tələb ${formatQuantity(shortage.requested)}, nəticə ${formatQuantity(shortage.after)}`;
}
