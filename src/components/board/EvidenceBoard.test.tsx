import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { EvidenceEntry } from "@/lib/store/useA2UIStore";
import { EvidenceBoard } from "./EvidenceBoard";

vi.mock("@/components/renderer/A2UIRenderer", () => ({
  A2UIRenderer: ({ data }: { data: { type: string } }) => (
    <div data-testid="a2ui-renderer">{data.type}</div>
  ),
}));

const entries: EvidenceEntry[] = [
  {
    id: "case-alpha",
    createdAt: 1700000000000,
    label: "Case Alpha",
    status: "missing",
    data: { type: "text", content: "Alpha", priority: "normal" },
  },
  {
    id: "case-bravo",
    createdAt: 1700000005000,
    label: "Case Bravo",
    status: "archived",
    data: { type: "text", content: "Bravo", priority: "normal" },
  },
];

describe("EvidenceBoard", () => {
  it("renders timeline view in newest-first order and calls onSelect", () => {
    const onSelect = vi.fn();
    const localeSpy = vi.spyOn(Date.prototype, "toLocaleString").mockImplementation(function () {
      return new Date(this.valueOf()).toISOString();
    });

    try {
      render(<EvidenceBoard entries={entries} activeId="case-alpha" onSelect={onSelect} />);

      fireEvent.click(screen.getByRole("button", { name: /timeline/i }));

      const labels = screen.getAllByText(/Case/);
      expect(labels[0]?.textContent).toBe("Case Bravo");

      const newestDate = new Date(entries[1]?.createdAt ?? 0).toISOString();
      expect(screen.getAllByText(newestDate).length).toBeGreaterThan(0);

      const bravoButton = screen.getByText("Case Bravo").closest("button");
      if (!bravoButton) throw new Error("Timeline entry not found");
      fireEvent.click(bravoButton);
      expect(onSelect).toHaveBeenCalledWith("case-bravo");
    } finally {
      localeSpy.mockRestore();
    }
  });

  it("shows a status stamp for the active evidence", () => {
    render(<EvidenceBoard entries={entries} activeId="case-alpha" onSelect={vi.fn()} />);

    const stamp = screen.getByTestId("evidence-stamp");
    expect(stamp.textContent?.toLowerCase()).toContain("missing");
  });
});
