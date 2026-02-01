import { render, waitFor } from "@testing-library/react";
import { RainOverlay } from "./RainOverlay";
import { describe, it, expect } from "vitest";

describe("RainOverlay", () => {
  it("renders rain drops after mount", async () => {
    const { container } = render(<RainOverlay />);

    await waitFor(() => {
      // Expect 40 drops (as defined in component const count = 40)
      expect(container.querySelectorAll("div.absolute").length).toBe(40);
    });
  });
});
