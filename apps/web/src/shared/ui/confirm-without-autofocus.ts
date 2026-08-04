import { Modal } from 'antd';
import type { ModalFuncProps } from 'antd';

/**
 * Confirm dialog without automatic button/input focus (CHANGE-029).
 * Print helpers may still call window.focus(); form fields must not.
 */
export function confirmWithoutAutofocus(config: ModalFuncProps) {
  return Modal.confirm({
    autoFocusButton: null,
    ...config,
    focusable: {
      autoFocusButton: null,
      ...(config.focusable ?? {}),
    },
  });
}
