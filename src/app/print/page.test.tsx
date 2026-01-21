import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useA2UIStore } from "@/lib/store/useA2UIStore";
import PrintPage from "./page";

describe("Print page", () => {
  beforeEach(() => {
    useA2UIStore.setState({
      evidence: { type: "text", content: "Evidence #1", priority: "normal" },
      evidenceHistory: [],
      activeEvidenceId: null,
      settings: {
        typewriterSpeed: 30,
        soundEnabled: true,
        modelConfig: { provider: "auto", model: "" },
      },
    });
  });

  it("renders evidence with a case header", () => {
    render(<PrintPage />);
    expect(screen.getByText(/Case File/i)).toBeInTheDocument();
    expect(screen.getByText("Evidence #1")).toBeInTheDocument();
  });
});
