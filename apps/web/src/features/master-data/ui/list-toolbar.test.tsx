import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Input } from "antd";
import { FilterBar, FilterField } from "./list-toolbar";

describe("FilterBar", () => {
  it("is collapsed by default and exposes standard actions when opened", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onReset = vi.fn();

    render(
      <FilterBar onSearch={onSearch} onReset={onReset}>
        <FilterField label="Kod">
          <Input aria-label="Kod" />
        </FilterField>
      </FilterBar>,
    );

    expect(screen.queryByLabelText("Kod")).not.toBeInTheDocument();
    await user.click(screen.getByText("Axtarış və filtrlər"));
    expect(screen.getByLabelText("Kod")).toBeVisible();

    await user.click(screen.getByRole("button", { name: /^Axtar$/ }));
    await user.click(screen.getByRole("button", { name: /Təmizlə/ }));
    expect(onSearch).toHaveBeenCalledOnce();
    expect(onReset).toHaveBeenCalledOnce();
  });
});
