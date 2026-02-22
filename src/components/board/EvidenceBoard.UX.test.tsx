import { render, screen, fireEvent, act } from "@testing-library/react";
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

describe("EvidenceBoard UX", () => {
  it("announces search results count to screen readers", () => {
    render(<EvidenceBoard entries={entries} activeId="case-alpha" onSelect={vi.fn()} />);

    // Initially, search is empty, so no status message or empty message
    const statusRegion = screen.getByRole("status", { hidden: true });
    expect(statusRegion).toBeInTheDocument();
    expect(statusRegion).toHaveTextContent("");

    // Type "Alpha" -> Should match 1 item
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: "Alpha" } });

    expect(statusRegion).toHaveTextContent(/1 evidence item found/i);

    // Type "z" -> Should match 0 items
    fireEvent.change(searchInput, { target: { value: " Alphaz" } });
    expect(statusRegion).toHaveTextContent(/No evidence matches/i);

    // Clear search
    fireEvent.change(searchInput, { target: { value: "" } });
    expect(statusRegion).toHaveTextContent("");
  });
});
