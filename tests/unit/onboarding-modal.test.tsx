import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OnboardingModal from "@/app/_components/onboarding/OnboardingModal";

type UpsertPayload = {
  id: string;
  whatsapp: string;
  momo: string;
  consent_whatsapp: boolean;
};

const mocks = vi.hoisted(() => {
  const upsert = vi.fn();
  const from = vi.fn().mockReturnValue({ upsert });
  const getSupabaseBrowserClient = vi.fn(() => ({ from }));
  return { upsert, from, getSupabaseBrowserClient };
});

vi.mock("@/lib/supabase/client", () => ({ getSupabaseBrowserClient: mocks.getSupabaseBrowserClient }));

describe("OnboardingModal", () => {
  beforeEach(() => {
    mocks.upsert.mockReset();
    mocks.from.mockClear();
    mocks.getSupabaseBrowserClient.mockClear();
    localStorage.clear();
  });

  it("submits contact details and stores profile completion", async () => {
    const onClose = vi.fn();
    render(<OnboardingModal open onClose={onClose} />);

    const whatsappInput = screen.getByPlaceholderText("7xxxxxxxx");
    fireEvent.change(whatsappInput, { target: { value: "788888888" } });

    const submitButton = screen.getByRole("button", { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => expect(onClose).toHaveBeenCalled());

    expect(mocks.getSupabaseBrowserClient).toHaveBeenCalled();
    const payload = mocks.upsert.mock.calls[0]?.[0] as UpsertPayload | undefined;
    expect(payload?.id).toMatch(/^\d{6}$/);
    expect(payload?.whatsapp).toBe("+250788888888");
    expect(payload?.momo).toBe("+250788888888");
    expect(payload?.consent_whatsapp).toBe(true);
    expect(localStorage.getItem("profileComplete")).toBe("1");
  });

  it("resets form state when modal is reopened", () => {
    const onClose = vi.fn();
    const { rerender } = render(<OnboardingModal open onClose={onClose} />);

    const whatsappInput = screen.getByPlaceholderText("7xxxxxxxx");
    fireEvent.change(whatsappInput, { target: { value: "799999999" } });

    const momoToggle = screen.getByLabelText(/same as whatsapp/i) as HTMLInputElement;
    fireEvent.click(momoToggle);
    const momoInput = screen.getByPlaceholderText("07xxxxxxx");
    fireEvent.change(momoInput, { target: { value: "0788000000" } });

    rerender(<OnboardingModal open={false} onClose={onClose} />);
    rerender(<OnboardingModal open onClose={onClose} />);

    expect(screen.getByPlaceholderText("7xxxxxxxx")).toHaveValue("");
    expect(screen.queryByPlaceholderText("07xxxxxxx")).toBeNull();
    expect(screen.getByLabelText(/same as whatsapp/i)).toBeChecked();
    expect(screen.getByLabelText(/country code/i)).toHaveValue("+250");
  });

  it("allows skipping without marking profile complete", () => {
    const onClose = vi.fn();
    render(<OnboardingModal open onClose={onClose} />);

    const laterButton = screen.getByRole("button", { name: /later/i });
    fireEvent.click(laterButton);

    expect(onClose).toHaveBeenCalled();
    expect(localStorage.getItem("profileComplete")).toBeNull();
  });
});
