import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import {
  BusinessCodeSequenceKey,
  type BusinessCodeSequenceKey as SequenceKey,
} from './business-code-sequence-key';
import { formatBusinessCode } from './business-code.formatter';

type SequenceAllocationRow = {
  currentValue: bigint;
  padding: number;
};

/**
 * Internal NumberSequence allocator. No HTTP controller / DTO.
 * Must be called with the active Prisma transaction client so the increment
 * rolls back with a failed entity create (ADR-024).
 */
@Injectable()
export class NumberSequencesService {
  /**
   * Atomically allocates the next code for an approved internal sequence key.
   * Equivalent to:
   *   UPDATE "NumberSequence"
   *   SET "currentValue" = "currentValue" + 1
   *   WHERE key = $key
   *   RETURNING "currentValue", padding
   */
  async nextCode(
    tx: Prisma.TransactionClient,
    sequenceKey: SequenceKey,
  ): Promise<string> {
    if (!this.isApprovedSequenceKey(sequenceKey)) {
      throw new InternalServerErrorException(
        'Unsupported business code sequence key',
      );
    }

    const rows = await tx.$queryRaw<SequenceAllocationRow[]>`
      UPDATE "NumberSequence"
      SET
        "currentValue" = "currentValue" + 1,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE key = ${sequenceKey}
      RETURNING "currentValue", padding
    `;

    if (rows.length === 0) {
      throw new InternalServerErrorException(
        `Number sequence is not configured for key ${sequenceKey}`,
      );
    }

    const row = rows[0];
    return formatBusinessCode(row.currentValue, row.padding);
  }

  private isApprovedSequenceKey(key: string): key is SequenceKey {
    return (
      key === BusinessCodeSequenceKey.PRODUCT ||
      key === BusinessCodeSequenceKey.BUSINESS_PARTNER ||
      key === BusinessCodeSequenceKey.WAREHOUSE
    );
  }
}
