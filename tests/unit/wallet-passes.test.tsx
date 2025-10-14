import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import WalletPasses from "@/app/more/wallet/_components/WalletPasses";

describe("WalletPasses", () => {
  it("marks comped passes as free perks", () => {
    render(
      <WalletPasses
        items={[
          {
            id: "pass-free",
            zone: "BLUE",
            state: "active",
            match: { opponent: "APR FC", kickoff: "2024-06-21T18:00:00+02:00" },
          },
        ]}
      />,
    );

    const card = screen.getByText(/APR FC/i).closest("[data-ticket-free]") as HTMLElement;
    expect(card).toHaveAttribute("data-ticket-free", "1");
    expect(screen.getByText(/Free perk/i)).toBeInTheDocument();
  });

  it("renders order metadata for paid passes", () => {
    render(
      <WalletPasses
        items={[
          {
            id: "pass-paid",
            order_id: "order-7781",
            zone: "VIP",
            state: "used",
            match: { opponent: "Police FC", kickoff: "2024-06-14T19:30:00+02:00" },
          },
        ]}
      />,
    );

    const card = screen.getByText(/Police FC/i).closest("[data-ticket-free]") as HTMLElement;
    expect(card).toHaveAttribute("data-ticket-free", "0");
    expect(screen.getByText(/Order order-7781/i)).toBeInTheDocument();
  });

  it("exposes a QR link when the token hash is present", () => {
    render(
      <WalletPasses
        items={[
          {
            id: "pass-qr",
            order_id: "order-9900",
            zone: "FAN",
            state: "active",
            qr_token_hash: "hash-9900",
            match: { opponent: "Gasogi United", kickoff: "2024-06-30T17:00:00+02:00" },
          },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: /Show QR/i })).toHaveAttribute("href", "/mytickets?pass=pass-qr");
  });
});
