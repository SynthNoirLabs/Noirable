import { describe, it, expect } from "vitest";
import { exportA2UI } from "./exportA2UI";

describe("exportA2UI", () => {
  it("exports a simple form layout", () => {
    const data = {
      type: "container",
      style: { padding: "md", gap: "sm" },
      children: [
        { type: "heading", level: 2, text: "Case Intake" },
        {
          type: "row",
          style: { gap: "sm" },
          children: [
            { type: "input", label: "Name", placeholder: "Jane Doe" },
            { type: "button", label: "Submit", variant: "primary" },
          ],
        },
      ],
    };

    const output = exportA2UI(data);
    expect(output).toMatch(/function CaseIntake/);
    expect(output).toMatch(/<h2>Case Intake<\/h2>/);
    expect(output).toMatch(/<input/);
    expect(output).toMatch(/placeholder=\"Jane Doe\"/);
    expect(output).toMatch(/<button/);
    expect(output).toMatch(/Submit/);
  });
});
