import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { I18nProvider } from "@/providers/i18n-provider";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/shop",
}));

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    pushMock.mockReset();
    window.localStorage.clear();
  });

  afterEach(() => {
    pushMock.mockReset();
    window.localStorage.clear();
  });

  const renderSwitcher = () =>
    render(
      <I18nProvider>
        <LanguageSwitcher />
      </I18nProvider>,
    );

  it("announces the current locale in the trigger label", () => {
    renderSwitcher();

    expect(screen.getByRole("button", { name: /change language, current english/i })).toBeInTheDocument();
  });

  it("updates the locale context and route when a new language is chosen", async () => {
    renderSwitcher();

    const trigger = screen.getByRole("button", { name: /current english/i });
    const user = userEvent.setup();
    await user.click(trigger);

    const option = await screen.findByRole("menuitemradio", { name: "Français" });
    await user.click(option);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/fr/shop");
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /current français/i })).toBeInTheDocument();
    });
  });
});
