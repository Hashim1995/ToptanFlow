import { Module } from '@nestjs/common';
import { NumberSequencesService } from './number-sequences.service';

/**
 * Internal infrastructure for automatic business codes (ADR-024).
 * No controllers — not part of the public HTTP API.
 */
@Module({
  providers: [NumberSequencesService],
  exports: [NumberSequencesService],
})
export class NumberSequencesModule {}
