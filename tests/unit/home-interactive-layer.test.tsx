import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

expect.extend(matchers);

import HomeInteractiveLayer from "@/app/(routes)/_components/HomeInteractiveLayer";

vi.mock("@/app/_components/onboarding/OnboardingModal", () => ({
  default: ({ open }: { open: boolean }) => (open ? <div data-testid="onboarding-modal" /> : null),
}));

vi.mock("@/app/_components/ui/BottomNav", () => ({
  default: () => <nav data-testid="bottom-nav" />, // minimal stub
}));

vi.mock("@/app/_components/ui/TopAppBar", () => ({
  default: ({ onOpenOnboarding }: { onOpenOnboarding: () => void }) => (
    <button onClick={onOpenOnboarding} type="button">
      open onboarding
    </button>
  ),
}));

describe("HomeInteractiveLayer", () => {
  let originalOnline: boolean;

  beforeEach(() => {
    originalOnline = window.navigator.onLine;
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: false,
    });
  });

  afterEach(() => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: originalOnline,
    });
  });

  it("surfaces offline state and clears it when connectivity returns", () => {
    render(
      <HomeInteractiveLayer>
        <div>child</div>
      </HomeInteractiveLayer>,
    );

    expect(screen.getByText(/You are offline/i)).toBeInTheDocument();

    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: true,
    });

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(screen.queryByText(/You are offline/i)).toBeNull();
  });
});
