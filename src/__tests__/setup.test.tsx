import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Home from "@/app/page";

// Mock Vercel AI SDK
vi.mock("@ai-sdk/react", () => ({
  useChat: () => ({
    messages: [],
    status: "ready",
    sendMessage: vi.fn(),
    append: vi.fn(),
  }),
}));

describe("Home Page Smoke Test", () => {
  it("renders the Detective Desk layout", () => {
    render(<Home />);
    expect(screen.getByText(/CASE FILE \/\/ JSON DATA/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Evidence #1/i)[0]).toBeInTheDocument();
  });
});
