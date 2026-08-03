import type { FormProps } from 'antd';

const REQUIRED_FIELD_LABEL = 'Mütləq sahə';
const OPTIONAL_FIELD_LABEL = 'İstəyə bağlı';

/** Presentation-only marker driven by each existing Form.Item `required` flag. */
export const appRequiredMark: Exclude<
  FormProps['requiredMark'],
  boolean | 'optional' | undefined
> = (label, { required }) => (
  <span className="ui-field-label">
    <span>{label}</span>
    {required ? (
      <span
        className="ui-required-mark"
        aria-label={REQUIRED_FIELD_LABEL}
        title={REQUIRED_FIELD_LABEL}
      >
        *
      </span>
    ) : (
      <span className="ui-optional-mark">{OPTIONAL_FIELD_LABEL}</span>
    )}
  </span>
);
