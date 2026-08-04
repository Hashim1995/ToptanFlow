import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  PUSH_NOTIFICATION_TITLE,
  PushEventKey,
  type PushEventKeyValue,
} from './push-event-keys.js';
import {
  buildCashAccountCreatedBody,
  buildCashExpenseBody,
  buildCashInBody,
  buildCashOutBody,
  buildCashTransactionCancelBody,
  buildCashTransferBody,
  buildCashTransferCancelBody,
  buildInventoryAdjustedBody,
  buildOpeningBalanceCorrectedBody,
  buildPurchaseCancelledBody,
  buildPurchaseCreatedBody,
  buildPurchasePostedBody,
  buildSaleCancelledBody,
  buildSaleCreatedBody,
  buildSalePostedBody,
} from './push-message-builder.js';
import { PushDispatcherService } from './push-dispatcher.service.js';

export type EnqueuePushInput = {
  idempotencyKey: string;
  eventKey: PushEventKeyValue;
  actorUserId: string;
  body: string;
  title?: string;
  payload?: Record<string, string | number | boolean | null>;
};

/**
 * Push outbox + dispatch. Business mutation services must only call the
 * fire-and-forget `notify*` methods AFTER their business `$transaction`
 * commits. Those methods never throw and never run inside the business tx.
 */
@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatcher: PushDispatcherService,
  ) {}

  // ---------------------------------------------------------------------------
  // Fire-and-forget domain emits (safe for all business call sites)
  // ---------------------------------------------------------------------------

  notifyCashIn(input: {
    actorUserId: string;
    transactionId: string;
    cashAccountId: string;
    amount: string;
  }): void {
    this.emitSafe(async () => {
      const [actorName, account] = await Promise.all([
        this.resolveActorName(input.actorUserId),
        this.prisma.cashAccount.findUnique({
          where: { id: input.cashAccountId },
          select: { name: true },
        }),
      ]);
      if (!account) return null;
      return {
        idempotencyKey: `cash.in:${input.transactionId}`,
        eventKey: PushEventKey.CASH_IN,
        actorUserId: input.actorUserId,
        body: buildCashInBody({
          actorName,
          amount: input.amount,
          accountName: account.name,
        }),
      };
    });
  }

  notifyCashOut(input: {
    actorUserId: string;
    transactionId: string;
    cashAccountId: string;
    amount: string;
  }): void {
    this.emitSafe(async () => {
      const [actorName, account] = await Promise.all([
        this.resolveActorName(input.actorUserId),
        this.prisma.cashAccount.findUnique({
          where: { id: input.cashAccountId },
          select: { name: true },
        }),
      ]);
      if (!account) return null;
      return {
        idempotencyKey: `cash.out:${input.transactionId}`,
        eventKey: PushEventKey.CASH_OUT,
        actorUserId: input.actorUserId,
        body: buildCashOutBody({
          actorName,
          amount: input.amount,
          accountName: account.name,
        }),
      };
    });
  }

  notifyCashExpense(input: {
    actorUserId: string;
    transactionId: string;
    cashAccountId: string;
    amount: string;
  }): void {
    this.emitSafe(async () => {
      const [actorName, account] = await Promise.all([
        this.resolveActorName(input.actorUserId),
        this.prisma.cashAccount.findUnique({
          where: { id: input.cashAccountId },
          select: { name: true },
        }),
      ]);
      if (!account) return null;
      return {
        idempotencyKey: `cash.expense:${input.transactionId}`,
        eventKey: PushEventKey.CASH_EXPENSE,
        actorUserId: input.actorUserId,
        body: buildCashExpenseBody({
          actorName,
          amount: input.amount,
          accountName: account.name,
        }),
      };
    });
  }

  notifyCashTransfer(input: {
    actorUserId: string;
    transferId: string;
    sourceCashAccountId: string;
    destinationCashAccountId: string;
    amount: string;
  }): void {
    this.emitSafe(async () => {
      const [actorName, source, destination] = await Promise.all([
        this.resolveActorName(input.actorUserId),
        this.prisma.cashAccount.findUnique({
          where: { id: input.sourceCashAccountId },
          select: { name: true },
        }),
        this.prisma.cashAccount.findUnique({
          where: { id: input.destinationCashAccountId },
          select: { name: true },
        }),
      ]);
      if (!source || !destination) return null;
      return {
        idempotencyKey: `cash.transfer:${input.transferId}`,
        eventKey: PushEventKey.CASH_TRANSFER,
        actorUserId: input.actorUserId,
        body: buildCashTransferBody({
          actorName,
          amount: input.amount,
          sourceAccountName: source.name,
          destinationAccountName: destination.name,
        }),
      };
    });
  }

  notifyCashTransferCancel(input: {
    actorUserId: string;
    transferId: string;
    transferNumber: string;
  }): void {
    this.emitSafe(async () => {
      const actorName = await this.resolveActorName(input.actorUserId);
      return {
        idempotencyKey: `cash.transfer.cancel:${input.transferId}`,
        eventKey: PushEventKey.CASH_TRANSFER_CANCEL,
        actorUserId: input.actorUserId,
        body: buildCashTransferCancelBody({
          actorName,
          transferNumber: input.transferNumber,
        }),
      };
    });
  }

  notifyCashTransactionCancel(input: {
    actorUserId: string;
    transactionId: string;
    transactionNumber: string;
  }): void {
    this.emitSafe(async () => {
      const actorName = await this.resolveActorName(input.actorUserId);
      return {
        idempotencyKey: `cash.cancel:${input.transactionId}`,
        eventKey: PushEventKey.CASH_TRANSACTION_CANCEL,
        actorUserId: input.actorUserId,
        body: buildCashTransactionCancelBody({
          actorName,
          transactionNumber: input.transactionNumber,
        }),
      };
    });
  }

  notifyCashAccountCreated(input: {
    actorUserId: string;
    accountId: string;
    accountName: string;
  }): void {
    this.emitSafe(async () => {
      const actorName = await this.resolveActorName(input.actorUserId);
      return {
        idempotencyKey: `cash.account.create:${input.accountId}`,
        eventKey: PushEventKey.CASH_ACCOUNT_CREATED,
        actorUserId: input.actorUserId,
        body: buildCashAccountCreatedBody({
          actorName,
          accountName: input.accountName,
        }),
      };
    });
  }

  notifyOpeningBalanceCorrected(input: {
    actorUserId: string;
    accountId: string;
    accountName: string;
    correctionKey: string;
  }): void {
    this.emitSafe(async () => {
      const actorName = await this.resolveActorName(input.actorUserId);
      return {
        idempotencyKey: `cash.opening.correct:${input.accountId}:${input.correctionKey}`,
        eventKey: PushEventKey.CASH_OPENING_BALANCE_CORRECTED,
        actorUserId: input.actorUserId,
        body: buildOpeningBalanceCorrectedBody({
          actorName,
          accountName: input.accountName,
        }),
      };
    });
  }

  notifySaleCreated(input: { actorUserId: string; saleId: string }): void {
    this.emitSafe(async () => {
      const actorName = await this.resolveActorName(input.actorUserId);
      return {
        idempotencyKey: `sale.create:${input.saleId}`,
        eventKey: PushEventKey.SALE_CREATED,
        actorUserId: input.actorUserId,
        body: buildSaleCreatedBody({ actorName }),
      };
    });
  }

  notifySalePosted(input: {
    actorUserId: string;
    saleId: string;
    documentNumber: string;
    amount: string;
  }): void {
    this.emitSafe(async () => {
      const actorName = await this.resolveActorName(input.actorUserId);
      return {
        idempotencyKey: `sale.post:${input.saleId}`,
        eventKey: PushEventKey.SALE_POSTED,
        actorUserId: input.actorUserId,
        body: buildSalePostedBody({
          actorName,
          documentNumber: input.documentNumber,
          amount: input.amount,
        }),
      };
    });
  }

  notifySaleCancelled(input: {
    actorUserId: string;
    saleId: string;
    documentNumber: string;
  }): void {
    this.emitSafe(async () => {
      const actorName = await this.resolveActorName(input.actorUserId);
      return {
        idempotencyKey: `sale.cancel:${input.saleId}`,
        eventKey: PushEventKey.SALE_CANCELLED,
        actorUserId: input.actorUserId,
        body: buildSaleCancelledBody({
          actorName,
          documentNumber: input.documentNumber,
        }),
      };
    });
  }

  notifyPurchaseCreated(input: {
    actorUserId: string;
    purchaseId: string;
  }): void {
    this.emitSafe(async () => {
      const actorName = await this.resolveActorName(input.actorUserId);
      return {
        idempotencyKey: `purchase.create:${input.purchaseId}`,
        eventKey: PushEventKey.PURCHASE_CREATED,
        actorUserId: input.actorUserId,
        body: buildPurchaseCreatedBody({ actorName }),
      };
    });
  }

  notifyPurchasePosted(input: {
    actorUserId: string;
    purchaseId: string;
    documentNumber: string;
    amount: string;
  }): void {
    this.emitSafe(async () => {
      const actorName = await this.resolveActorName(input.actorUserId);
      return {
        idempotencyKey: `purchase.post:${input.purchaseId}`,
        eventKey: PushEventKey.PURCHASE_POSTED,
        actorUserId: input.actorUserId,
        body: buildPurchasePostedBody({
          actorName,
          documentNumber: input.documentNumber,
          amount: input.amount,
        }),
      };
    });
  }

  notifyPurchaseCancelled(input: {
    actorUserId: string;
    purchaseId: string;
    documentNumber: string;
  }): void {
    this.emitSafe(async () => {
      const actorName = await this.resolveActorName(input.actorUserId);
      return {
        idempotencyKey: `purchase.cancel:${input.purchaseId}`,
        eventKey: PushEventKey.PURCHASE_CANCELLED,
        actorUserId: input.actorUserId,
        body: buildPurchaseCancelledBody({
          actorName,
          documentNumber: input.documentNumber,
        }),
      };
    });
  }

  notifyInventoryAdjusted(input: {
    actorUserId: string;
    historyId: string;
  }): void {
    this.emitSafe(async () => {
      const actorName = await this.resolveActorName(input.actorUserId);
      return {
        idempotencyKey: `inventory.adjust:${input.historyId}`,
        eventKey: PushEventKey.INVENTORY_QUANTITY_ADJUSTED,
        actorUserId: input.actorUserId,
        body: buildInventoryAdjustedBody({ actorName }),
      };
    });
  }

  /**
   * Schedules push work off the request critical path. Never throws.
   */
  private emitSafe(
    build: () => Promise<EnqueuePushInput | null | undefined>,
  ): void {
    void (async () => {
      try {
        const input = await build();
        if (!input) return;
        await this.enqueueBestEffort(input);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'unknown';
        this.logger.error(
          JSON.stringify({
            msg: 'push_emit_safe_failed',
            error: message.slice(0, 300),
          }),
        );
      }
    })();
  }

  /**
   * Write outbox in an isolated transaction, then dispatch. Never throws.
   */
  async enqueueBestEffort(input: EnqueuePushInput): Promise<void> {
    try {
      const eventId = await this.prisma.$transaction((tx) =>
        this.enqueueInTransaction(tx, input),
      );
      this.scheduleDispatch(eventId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'unknown';
      this.logger.error(
        JSON.stringify({
          msg: 'push_outbox_enqueue_failed',
          eventKey: input.eventKey,
          idempotencyKey: input.idempotencyKey,
          error: message.slice(0, 300),
        }),
      );
    }
  }

  async enqueueInTransaction(
    tx: Prisma.TransactionClient,
    input: EnqueuePushInput,
  ): Promise<string | null> {
    const title = input.title?.trim() || PUSH_NOTIFICATION_TITLE;
    const body = input.body.trim();
    if (!body) {
      this.logger.warn(
        `Skipping empty push body for eventKey=${input.eventKey}`,
      );
      return null;
    }

    let event: { id: string };
    try {
      event = await tx.pushNotificationEvent.create({
        data: {
          idempotencyKey: input.idempotencyKey,
          eventKey: input.eventKey,
          actorUserId: input.actorUserId,
          title,
          body,
          payloadJson: input.payload
            ? (input.payload as Prisma.InputJsonValue)
            : undefined,
        },
        select: { id: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        this.logger.log(
          `Duplicate push event ignored key=${input.idempotencyKey}`,
        );
        return null;
      }
      throw error;
    }

    const subscriptions = await tx.pushSubscription.findMany({
      where: {
        isActive: true,
        userId: { not: input.actorUserId },
        user: { isActive: true },
      },
      select: { id: true },
    });

    const uniqueIds = [...new Set(subscriptions.map((s) => s.id))];

    if (uniqueIds.length > 0) {
      await tx.pushDelivery.createMany({
        data: uniqueIds.map((subscriptionId) => ({
          eventId: event.id,
          subscriptionId,
          status: 'PENDING',
          nextAttemptAt: new Date(),
        })),
        skipDuplicates: true,
      });
    }

    this.logger.log(
      JSON.stringify({
        msg: 'push_event_created',
        eventKey: input.eventKey,
        eventId: event.id,
        recipientSubscriptionCount: uniqueIds.length,
      }),
    );

    return event.id;
  }

  scheduleDispatch(eventId: string | null | undefined): void {
    if (!eventId) return;
    void this.dispatcher.dispatchEvent(eventId).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'unknown';
      this.logger.error(
        `Immediate push dispatch failed eventId=${eventId}: ${message}`,
      );
    });
  }

  async resolveActorName(actorUserId: string): Promise<string> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: actorUserId },
        select: { fullName: true, username: true },
      });
      const full = user?.fullName?.trim();
      if (full) return full;
      const username = user?.username?.trim();
      if (username) return username;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'unknown';
      this.logger.warn(`resolveActorName failed: ${message.slice(0, 200)}`);
    }
    return 'İstifadəçi';
  }
}
