import { render, screen, fireEvent } from "@testing-library/react";
import { DictaphonePanel } from "./DictaphonePanel";
import { describe, it, expect, vi } from "vitest";

const mockTapes = [
  { id: "msg-1", text: "Narrative entry one", hash: "hash1111", createdAt: Date.now() },
  { id: "msg-2", text: "Narrative entry two", hash: "hash2222", createdAt: Date.now() },
];

describe("DictaphonePanel", () => {
  it("renders empty state", () => {
    render(<DictaphonePanel tapes={[]} onDeleteTape={vi.fn()} />);
    expect(screen.getByText(/No cassettes recorded/i)).toBeInTheDocument();
  });

  it("renders tape list and loads the first tape by default", () => {
    render(<DictaphonePanel tapes={mockTapes} onDeleteTape={vi.fn()} />);

    // Check list entries
    expect(screen.getAllByText("Narrative entry one").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Narrative entry two")).toBeInTheDocument();

    // Check loaded cassette details showing slot title
    expect(screen.getByText("Cassette Log #1")).toBeInTheDocument();
  });

  it("changes selected tape on click", () => {
    render(<DictaphonePanel tapes={mockTapes} onDeleteTape={vi.fn()} />);

    // Select second tape
    const secondTape = screen.getByText("Narrative entry two");
    fireEvent.click(secondTape);

    // Cassette log index should update
    expect(screen.getByText("Cassette Log #2")).toBeInTheDocument();
  });

  it("calls onDeleteTape when delete button is clicked", () => {
    const deleteSpy = vi.fn();
    render(<DictaphonePanel tapes={mockTapes} onDeleteTape={deleteSpy} />);

    // Click delete on the first tape
    const deleteBtns = screen.getAllByTitle(/Incinerate Tape/i);
    expect(deleteBtns.length).toBe(2);

    fireEvent.click(deleteBtns[0]);
    expect(deleteSpy).toHaveBeenCalledWith("hash1111");
  });
});
