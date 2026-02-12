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
        ambient: {
          rainEnabled: true,
          rainVolume: 1,
          fogEnabled: true,
          intensity: "medium",
          crackleEnabled: false,
          crackleVolume: 0.35,
        },
      },
    });
  });

  it("renders evidence with a case header", () => {
    render(<PrintPage />);
    expect(screen.getByText(/Case File/i)).toBeInTheDocument();
    // TypewriterText renders duplicate text for accessibility
    expect(screen.getAllByText("Evidence #1")[0]).toBeInTheDocument();
  });
});
