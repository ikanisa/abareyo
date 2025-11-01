import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AdminViewFallback from "@/app/admin/(dashboard)/_components/AdminViewFallback";
import AdminOfflineNotice from "@/components/admin/AdminOfflineNotice";

describe("admin accessibility focus management", () => {
  it("focuses the loading region when fallback renders", async () => {
    render(<AdminViewFallback title="Loading" description="Preparing dashboard" />);

    const status = await screen.findByRole("status");
    await waitFor(() => {
      expect(status).toBe(document.activeElement);
    });
  });

  it("focuses the alert when the dashboard is unavailable", async () => {
    render(<AdminOfflineNotice message="Backend offline" />);

    const alert = await screen.findByRole("alert");
    await waitFor(() => {
      expect(alert).toBe(document.activeElement);
    });
  });
});
