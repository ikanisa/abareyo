import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import WhatsAppLoginClient from "@/app/(routes)/auth/whatsapp/WhatsAppLoginClient";

const mocks = vi.hoisted(() => {
  const startWhatsappAuth = vi.fn();
  const verifyWhatsappOtp = vi.fn();
  const resendWhatsappOtp = vi.fn();
  const dispatchTelemetryEvent = vi.fn(() => Promise.resolve());
  const completeWhatsappLogin = vi.fn(() => Promise.resolve());
  const toast = vi.fn();
  const replace = vi.fn();
  const refresh = vi.fn();

  return {
    startWhatsappAuth,
    verifyWhatsappOtp,
    resendWhatsappOtp,
    dispatchTelemetryEvent,
    completeWhatsappLogin,
    toast,
    replace,
    refresh,
  };
});

vi.mock("@/lib/api/whatsapp-auth", () => ({
  startWhatsappAuth: mocks.startWhatsappAuth,
  verifyWhatsappOtp: mocks.verifyWhatsappOtp,
  resendWhatsappOtp: mocks.resendWhatsappOtp,
}));

vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => ({
    completeWhatsappLogin: mocks.completeWhatsappLogin,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    session: null,
    user: null,
    onboardingStatus: null,
    loading: false,
  }),
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/observability", () => ({
  dispatchTelemetryEvent: mocks.dispatchTelemetryEvent,
}));

const renderWithClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <WhatsAppLoginClient />
    </QueryClientProvider>,
  );
};

describe("WhatsAppLoginClient", () => {
  beforeEach(() => {
    vi.useRealTimers();
    mocks.startWhatsappAuth.mockReset();
    mocks.verifyWhatsappOtp.mockReset();
    mocks.resendWhatsappOtp.mockReset();
    mocks.dispatchTelemetryEvent.mockClear();
    mocks.completeWhatsappLogin.mockClear();
    mocks.toast.mockClear();
    mocks.replace.mockClear();
    mocks.refresh.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("validates the phone number before requesting a code", async () => {
    const user = userEvent.setup();
    renderWithClient();

    const submitButton = screen.getByRole("button", { name: /send whatsapp code/i });
    await user.click(submitButton);

    expect(await screen.findByText(/enter a valid whatsapp number/i)).toBeInTheDocument();
    expect(mocks.startWhatsappAuth).not.toHaveBeenCalled();
  });

  it("disables resend until the cooldown elapses", async () => {
    const user = userEvent.setup();
    mocks.startWhatsappAuth.mockResolvedValue({ requestId: "req-1", expiresIn: 300, resendAfter: 30 });

    renderWithClient();

    const input = screen.getByLabelText(/whatsapp number/i);
    await user.type(input, "0788888888");
    await user.click(screen.getByRole("button", { name: /send whatsapp code/i }));

    await waitFor(() => expect(mocks.startWhatsappAuth).toHaveBeenCalled());

    const resendButton = await screen.findByRole("button", { name: /resend in 30s/i });
    expect(resendButton).toBeDisabled();

    await user.click(resendButton);
    expect(mocks.resendWhatsappOtp).not.toHaveBeenCalled();
  });

  it("verifies the OTP and completes login", async () => {
    mocks.startWhatsappAuth.mockResolvedValue({ requestId: "req-2", expiresIn: 300, resendAfter: 5 });
    mocks.verifyWhatsappOtp.mockResolvedValue({ accessToken: "jwt", refreshToken: "refresh", userId: "fan-1" });

    const user = userEvent.setup();
    renderWithClient();

    const phoneInput = screen.getByLabelText(/whatsapp number/i);
    await user.type(phoneInput, "0780000000");
    await user.click(screen.getByRole("button", { name: /send whatsapp code/i }));

    await waitFor(() => expect(mocks.startWhatsappAuth).toHaveBeenCalled());

    const codeInput = await screen.findByLabelText(/6-digit code/i);
    await user.clear(codeInput);
    await user.type(codeInput, "123456");
    await user.click(screen.getByRole("button", { name: /verify and continue/i }));

    await waitFor(() => expect(mocks.verifyWhatsappOtp).toHaveBeenCalledWith({ requestId: "req-2", code: "123456" }));
    await waitFor(() => expect(mocks.completeWhatsappLogin).toHaveBeenCalledWith({ accessToken: "jwt", refreshToken: "refresh" }));
    expect(mocks.replace).toHaveBeenCalledWith("/onboarding");
    expect(mocks.refresh).toHaveBeenCalled();
  });
});
