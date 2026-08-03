import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Form, Input, Modal, Select } from 'antd';
import { appRequiredMark } from '../../../shared/ui/form-required-mark';
import {
  productFormSchema,
  type ProductFormValues,
} from '../forms/product.schemas';
import { useProductCategoriesList } from '../api/product-categories.hooks';
import { useUnitsList } from '../api/units.hooks';
import type { ProductType } from '../api/products.api';
import { DecimalInput } from './decimal-input';
import { MASTER_DATA_LABELS, productTypeLabel } from './labels';
import './product-form-modal.css';

type ProductFormModalProps = {
  open: boolean;
  title: string;
  mode: 'create' | 'edit';
  readOnlyCode?: string;
  fallbackUnitOption?: { value: string; label: string };
  fallbackCategoryOption?: { value: string; label: string };
  initialValues?: ProductFormValues;
  submitting: boolean;
  errorMessage?: string;
  onCancel: () => void;
  onSubmit: (values: ProductFormValues) => Promise<void> | void;
};

const emptyValues: ProductFormValues = {
  name: '',
  type: 'FINISHED_GOOD',
  categoryId: '',
  unitId: '',
  standardSalePrice: '',
  latestPurchasePrice: '',
  criticalStockThreshold: '',
  barcode: '',
  notes: '',
};

export function ProductFormModal({
  open,
  title,
  mode,
  readOnlyCode,
  fallbackUnitOption,
  fallbackCategoryOption,
  initialValues,
  submitting,
  errorMessage,
  onCancel,
  onSubmit,
}: ProductFormModalProps) {
  const labels = MASTER_DATA_LABELS.products;
  const common = MASTER_DATA_LABELS.common;

  const unitsQuery = useUnitsList({
    isActive: true,
    pageSize: 100,
    sortBy: 'code',
    sortOrder: 'asc',
  });

  const categoriesQuery = useProductCategoriesList({
    isActive: true,
    pageSize: 100,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialValues ?? emptyValues,
  });

  useEffect(() => {
    if (open) {
      reset(initialValues ?? emptyValues);
    }
  }, [open, initialValues, reset]);

  const unitOptions = useMemo(() => {
    const units = unitsQuery.data?.data ?? [];
    const options = units.map((unit) => ({
      value: unit.id,
      label: `${unit.code} — ${unit.name}`,
    }));

    if (
      fallbackUnitOption &&
      !options.some((option) => option.value === fallbackUnitOption.value)
    ) {
      options.unshift(fallbackUnitOption);
    }

    return options;
  }, [unitsQuery.data?.data, fallbackUnitOption]);

  const categoryOptions = useMemo(() => {
    const categories = categoriesQuery.data?.data ?? [];
    const options = categories.map((category) => ({
      value: category.id,
      label: category.name,
    }));

    if (
      fallbackCategoryOption &&
      !options.some((option) => option.value === fallbackCategoryOption.value)
    ) {
      options.unshift(fallbackCategoryOption);
    }

    return options;
  }, [categoriesQuery.data?.data, fallbackCategoryOption]);

  const typeOptions = (Object.keys(labels.types) as ProductType[]).map(
    (type) => ({
      value: type,
      label: productTypeLabel(type),
    }),
  );

  return (
    <Modal
      className="ui-form-modal ui-master-data-form-modal product-form-modal"
      wrapClassName="product-form-modal-wrap"
      title={title}
      open={open}
      centered
      onCancel={onCancel}
      onOk={handleSubmit(onSubmit)}
      okText={common.save}
      cancelText={common.cancel}
      confirmLoading={submitting}
      destroyOnHidden
      forceRender
      width={720}
    >
      {errorMessage ? (
        <Alert
          className="product-form-alert"
          type="error"
          showIcon
          message={errorMessage}
        />
      ) : null}
      <Form
        className="product-form"
        layout="vertical"
        requiredMark={appRequiredMark}
      >
        <section className="product-form-section">
          <div className="product-form-section-heading">Əsas məlumatlar</div>
          <div className="product-form-grid">
            {mode === 'edit' && readOnlyCode ? (
              <Form.Item
                className="ui-form-field-readonly"
                label={common.code}
                help={labels.codeReadonlyHint}
              >
                <Input value={readOnlyCode} disabled readOnly />
              </Form.Item>
            ) : null}

            <Form.Item
              className="product-form-field-wide"
              label={common.name}
              required
              validateStatus={errors.name ? 'error' : undefined}
              help={errors.name?.message}
            >
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    autoComplete="off"
                    placeholder={common.namePlaceholder}
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label={labels.type}
              required
              validateStatus={errors.type ? 'error' : undefined}
              help={errors.type?.message}
            >
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={typeOptions}
                    placeholder={labels.typePlaceholder}
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label={labels.category}
              validateStatus={errors.categoryId ? 'error' : undefined}
              help={errors.categoryId?.message}
            >
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Select
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    loading={categoriesQuery.isLoading}
                    options={categoryOptions}
                    placeholder={labels.categoryPlaceholder}
                    value={field.value || undefined}
                    onChange={(value) => field.onChange(value ?? '')}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label={labels.unit}
              required
              validateStatus={errors.unitId ? 'error' : undefined}
              help={errors.unitId?.message}
            >
              <Controller
                name="unitId"
                control={control}
                render={({ field }) => (
                  <Select
                    showSearch
                    optionFilterProp="label"
                    loading={unitsQuery.isLoading}
                    options={unitOptions}
                    placeholder={labels.unitPlaceholder}
                    value={field.value || undefined}
                    onChange={(value) => field.onChange(value ?? '')}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </Form.Item>
          </div>
        </section>

        <section className="product-form-section">
          <div className="product-form-section-heading">Qiymət və miqdar</div>
          <div className="product-form-grid product-form-price-grid">
            <Form.Item
              label={labels.standardSalePrice}
              validateStatus={errors.standardSalePrice ? 'error' : undefined}
              help={errors.standardSalePrice?.message}
            >
              <Controller
                name="standardSalePrice"
                control={control}
                render={({ field }) => (
                  <DecimalInput
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder={labels.decimalPlaceholder}
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label={labels.latestPurchasePrice}
              validateStatus={errors.latestPurchasePrice ? 'error' : undefined}
              help={errors.latestPurchasePrice?.message}
            >
              <Controller
                name="latestPurchasePrice"
                control={control}
                render={({ field }) => (
                  <DecimalInput
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder={labels.decimalPlaceholder}
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label={labels.criticalStockThreshold}
              validateStatus={
                errors.criticalStockThreshold ? 'error' : undefined
              }
              help={errors.criticalStockThreshold?.message}
            >
              <Controller
                name="criticalStockThreshold"
                control={control}
                render={({ field }) => (
                  <DecimalInput
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder={labels.decimalPlaceholder}
                  />
                )}
              />
            </Form.Item>
          </div>
        </section>

        <section className="product-form-section">
          <div className="product-form-section-heading">Əlavə məlumatlar</div>
          <div className="product-form-grid">
            <Form.Item
              label={labels.barcode}
              validateStatus={errors.barcode ? 'error' : undefined}
              help={errors.barcode?.message}
            >
              <Controller
                name="barcode"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder={labels.barcodePlaceholder}
                    maxLength={128}
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              className="product-form-field-wide"
              label={labels.notes}
              validateStatus={errors.notes ? 'error' : undefined}
              help={errors.notes?.message}
            >
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <Input.TextArea
                    {...field}
                    placeholder={labels.notesPlaceholder}
                    rows={3}
                    maxLength={4000}
                  />
                )}
              />
            </Form.Item>
          </div>
        </section>
      </Form>
    </Modal>
  );
}
