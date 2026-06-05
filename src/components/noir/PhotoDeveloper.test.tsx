import { render, screen, act } from "@testing-library/react";
import { PhotoDeveloper } from "./PhotoDeveloper";
import { describe, it, expect, vi } from "vitest";

describe("PhotoDeveloper", () => {
  it("renders block image with Polaroid border and custom caption", () => {
    render(<PhotoDeveloper src="/test-img.png" alt="Crime Scene" caption="Autopsy #3" />);

    // Renders the exhibit title
    expect(screen.getByText("Autopsy #3")).toBeInTheDocument();

    // Renders image elements with source
    const imgElement = screen.getByRole("img");
    expect(imgElement).toBeInTheDocument();
    expect(imgElement).toHaveAttribute("src", "/test-img.png");
    expect(imgElement).toHaveAttribute("alt", "Crime Scene");
  });

  it("applies development animations initially and turns them off after timeout", () => {
    vi.useFakeTimers();
    render(<PhotoDeveloper src="/test-img.png" alt="Crime Scene" />);

    // Starts with develop animations
    const imgElement = screen.getByRole("img");
    expect(imgElement.className).toContain("animate-photo-develop");

    // Fast-forward 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Development is complete, has standard sepia class
    expect(imgElement.className).toContain("sepia-[0.15]");
    expect(imgElement.className).not.toContain("animate-photo-develop");

    vi.useRealTimers();
  });

  it("renders inline avatar/icon layout directly", () => {
    render(<PhotoDeveloper src="/avatar.png" alt="Detective Avatar" variant="avatar" />);

    // Renders image Directly
    const imgElement = screen.getByRole("img");
    expect(imgElement).toBeInTheDocument();
    expect(imgElement.className).toContain("rounded-full");

    // Polaroid tags shouldn't render for inline images
    expect(screen.queryByText(/Exhibit/i)).not.toBeInTheDocument();
  });
});
