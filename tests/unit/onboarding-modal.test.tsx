import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import OnboardingModal from "@/app/_components/onboarding/OnboardingModal";

describe("OnboardingModal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("sends a user message and schedules an assistant reply", async () => {
    render(<OnboardingModal open onClose={() => {}} />);

    const input = screen.getByPlaceholderText("Type your message…") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "0788000000" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    expect(input.value).toBe("");
    expect(screen.getByText("0788000000")).toBeTruthy();

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.getByText(/Murakoze!/i)).toBeTruthy();
  });

  it("resets messages when reopened", () => {
    const onClose = vi.fn();
    const { rerender } = render(<OnboardingModal open onClose={onClose} />);

    const input = screen.getByPlaceholderText("Type your message…");
    fireEvent.change(input, { target: { value: "Optional details" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    rerender(<OnboardingModal open={false} onClose={onClose} />);
    rerender(<OnboardingModal open onClose={onClose} />);

    expect(screen.queryByText("Optional details")).toBeNull();
    expect(screen.getByText(/Muraho!/i)).toBeTruthy();
  });
});
