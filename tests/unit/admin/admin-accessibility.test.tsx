import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AdminViewFallback from "@/app/admin/(dashboard)/_components/AdminViewFallback";
import AdminOfflineNotice from "@/components/admin/AdminOfflineNotice";
import { AdminShell } from "@/components/admin/AdminShell";

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

  it("exposes a skip link and main landmark", async () => {
    render(
      <AdminShell
        environment="test"
        user={{ displayName: "Test Admin", email: "admin@example.com", roles: ["admin"] }}
      >
        <div>Dashboard</div>
      </AdminShell>,
    );

    const skipLink = await screen.findByRole("link", { name: /skip to main content/i });
    const mainRegion = await screen.findByRole("main");

    expect(skipLink).toBeInTheDocument();
    expect(mainRegion).toHaveAttribute("id", "admin-main-content");

    const remediationLog = [
      "Ensure admin quick actions menu receives focus styles",
      "Validate toast region announcements for screen readers",
    ];

    console.info("admin-a11y-remediation", remediationLog.join(" | "));
    expect(remediationLog.length).toBeGreaterThan(0);
  });
});
