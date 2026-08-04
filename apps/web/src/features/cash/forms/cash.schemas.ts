import { z } from 'zod';
import { CASH_LABELS } from '../ui/labels';

const MONEY_PATTERN = /^\d{1,16}(?:\.\d{1,2})?$/;

const moneyRequired = z
  .string()
  .trim()
  .min(1, { message: CASH_LABELS.validation.amountRequired })
  .regex(MONEY_PATTERN, {
    message: CASH_LABELS.validation.amountFormat,
  })
  .refine((value) => Number(value) > 0, {
    message: CASH_LABELS.validation.amountPositive,
  });

const moneyOptionalNonNegative = z
  .string()
  .trim()
  .refine((value) => value === '' || MONEY_PATTERN.test(value), {
    message: CASH_LABELS.validation.amountFormat,
  });

/** Required non-negative money including zero (Super Admin opening edit). */
const moneyNonNegativeRequired = z
  .string()
  .trim()
  .min(1, { message: CASH_LABELS.validation.amountRequired })
  .regex(MONEY_PATTERN, {
    message: CASH_LABELS.validation.amountFormat,
  });

export const cashAccountFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: CASH_LABELS.validation.nameRequired })
    .max(255),
  notes: z.string().trim().max(2000),
  openingBalance: moneyOptionalNonNegative,
  responsibleUserId: z
    .string()
    .uuid({ message: CASH_LABELS.validation.responsibleUserRequired }),
});

export const cashAccountEditSuperAdminFormSchema = cashAccountFormSchema.extend({
  openingBalance: moneyNonNegativeRequired,
});

export type CashAccountFormValues = z.infer<typeof cashAccountFormSchema>;

export const cashInFormSchema = z.object({
  cashAccountId: z
    .string()
    .uuid({ message: CASH_LABELS.validation.accountRequired }),
  partnerId: z
    .string()
    .uuid({ message: CASH_LABELS.validation.partnerRequired }),
  amount: moneyRequired,
  transactionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: CASH_LABELS.validation.dateRequired,
    }),
  saleId: z.union([
    z.literal(''),
    z.string().uuid({ message: CASH_LABELS.validation.accountRequired }),
  ]),
  notes: z.string().trim().max(2000),
});

export type CashInFormValues = z.infer<typeof cashInFormSchema>;

export const cashOutFormSchema = z
  .object({
    cashAccountId: z
      .string()
      .uuid({ message: CASH_LABELS.validation.accountRequired }),
    partnerId: z
      .string()
      .uuid({ message: CASH_LABELS.validation.partnerRequired }),
    amount: moneyRequired,
    transactionDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: CASH_LABELS.validation.dateRequired,
      }),
    purchaseId: z.union([
      z.literal(''),
      z.string().uuid({ message: CASH_LABELS.validation.accountRequired }),
    ]),
    notes: z.string().trim().max(2000),
    negativeBalanceOverrideReason: z.string().trim().max(2000),
    /** Snapshot of account balance when the modal opened (client preview + validation). */
    balanceBefore: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    const before = Number.parseFloat(values.balanceBefore ?? '');
    const amount = Number.parseFloat(values.amount);
    if (!Number.isFinite(before) || !Number.isFinite(amount)) return;
    const after = before - amount;
    if (after < 0 && values.negativeBalanceOverrideReason.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['negativeBalanceOverrideReason'],
        message: CASH_LABELS.validation.reasonRequired,
      });
    }
  });

export type CashOutFormValues = z.infer<typeof cashOutFormSchema>;

export const expenseFormSchema = z
  .object({
    cashAccountId: z
      .string()
      .uuid({ message: CASH_LABELS.validation.accountRequired }),
    expenseCategoryId: z
      .string()
      .uuid({ message: CASH_LABELS.validation.categoryRequired }),
    amount: moneyRequired,
    transactionDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: CASH_LABELS.validation.dateRequired,
      }),
    notes: z
      .string()
      .trim()
      .min(1, { message: CASH_LABELS.validation.notesRequired })
      .max(2000),
    negativeBalanceOverrideReason: z.string().trim().max(2000),
    balanceBefore: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    const before = Number.parseFloat(values.balanceBefore ?? '');
    const amount = Number.parseFloat(values.amount);
    if (!Number.isFinite(before) || !Number.isFinite(amount)) return;
    const after = before - amount;
    if (after < 0 && values.negativeBalanceOverrideReason.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['negativeBalanceOverrideReason'],
        message: CASH_LABELS.validation.reasonRequired,
      });
    }
  });

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export const transferFormSchema = z
  .object({
    sourceCashAccountId: z
      .string()
      .uuid({ message: CASH_LABELS.validation.accountRequired }),
    destinationCashAccountId: z
      .string()
      .uuid({ message: CASH_LABELS.validation.destinationAccountRequired }),
    amount: moneyRequired,
    transactionDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: CASH_LABELS.validation.dateRequired,
      }),
    notes: z.string().trim().max(2000),
    negativeBalanceOverrideReason: z.string().trim().max(2000),
    balanceBefore: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.sourceCashAccountId === values.destinationCashAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['destinationCashAccountId'],
        message: CASH_LABELS.validation.transferAccountsDifferent,
      });
    }
    const before = Number.parseFloat(values.balanceBefore ?? '');
    const amount = Number.parseFloat(values.amount);
    if (!Number.isFinite(before) || !Number.isFinite(amount)) return;
    if (before - amount < 0 && values.negativeBalanceOverrideReason.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['negativeBalanceOverrideReason'],
        message: CASH_LABELS.validation.reasonRequired,
      });
    }
  });

export type TransferFormValues = z.infer<typeof transferFormSchema>;

export const expenseCategoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: CASH_LABELS.validation.nameRequired })
    .max(255),
});

export type ExpenseCategoryFormValues = z.infer<
  typeof expenseCategoryFormSchema
>;
