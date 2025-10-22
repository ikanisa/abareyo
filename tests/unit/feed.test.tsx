import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Feed from "@/app/_components/home/Feed";

describe("Feed", () => {
  it("renders skeleton placeholders while loading", () => {
    render(<Feed items={[]} isLoading />);

    const skeletons = screen.getAllByRole("status");
    expect(skeletons[0]).toHaveAttribute("aria-busy", "true");
  });

  it("shows an offline message and retry action", () => {
    const onRetry = vi.fn();
    render(<Feed items={[]} isOffline onRetry={onRetry} />);

    expect(screen.getByText(/you're offline/i)).toBeInTheDocument();

    const retryButton = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(retryButton);

    expect(onRetry).toHaveBeenCalled();
  });

  it("renders an empty state when there are no updates", () => {
    render(<Feed items={[]} />);

    expect(screen.getByText(/no club news yet/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /visit community hub/i })).toHaveAttribute(
      "href",
      "/community",
    );
  });

  it("renders feed entries with titles and text", () => {
    render(
      <Feed
        items={[
          { id: "1", title: "Match recap", text: "Rayon secured a 2-0 win." },
          { id: "2", text: "Training resumes tomorrow." },
        ]}
      />,
    );

    expect(screen.getByRole("article", { name: /match recap/i })).toBeInTheDocument();
    expect(screen.getByText(/rayon secured a 2-0 win/i)).toBeInTheDocument();
    expect(screen.getByRole("article", { name: /training resumes tomorrow/i })).toBeInTheDocument();
  });

  it("notifies viewers when offline but cached data exists", () => {
    render(
      <Feed
        isOffline
        items={[{ id: "3", title: "Squad update", text: "New signing announced." }]}
      />,
    );

    expect(screen.getByTestId("feed-offline-banner")).toBeInTheDocument();
  });
});

