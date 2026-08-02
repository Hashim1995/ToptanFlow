import { ConfigProvider, Modal, Select } from 'antd';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../index.css';

describe('mobile modal popup interaction', () => {
  afterEach(() => vi.restoreAllMocks());

  it('keeps a Select dropdown open and interactive inside a modal', async () => {
    const user = userEvent.setup();
    const getComputedStyle = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element) =>
      getComputedStyle(element),
    );

    render(
      <ConfigProvider>
        <Modal className="app-mobile-modal" open title="Sınaq" footer={null}>
          <Select
            aria-label="Seçim"
            options={[
              { value: 'first', label: 'Birinci seçim' },
              { value: 'second', label: 'İkinci seçim' },
            ]}
          />
        </Modal>
      </ConfigProvider>,
    );

    const combobox = screen.getByRole('combobox', { name: 'Seçim' });
    await user.click(combobox);

    expect(combobox).toHaveAttribute('aria-expanded', 'true');
    const secondOption = document.querySelector<HTMLElement>(
      '.ant-select-item-option[title="İkinci seçim"]',
    );
    expect(secondOption).not.toBeNull();
    fireEvent.click(secondOption!);
    expect(combobox.parentElement).toHaveTextContent('İkinci seçim');
  });
});
