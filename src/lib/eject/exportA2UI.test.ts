import { describe, it, expect } from "vitest";
import { exportA2UI, exportA2UIAsJSON, exportA2UIMultiFile } from "./exportA2UI";
import type { A2UIInput } from "@/lib/protocol/schema";

describe("exportA2UI", () => {
  it("exports a simple form layout", () => {
    const data: A2UIInput = {
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
    expect(output).toMatch(/function EvidenceComponent/);
    expect(output).toMatch(/Case Intake/);
    expect(output).toMatch(/<input/);
    expect(output).toMatch(/placeholder=\{"Jane Doe"\}/);
    expect(output).toMatch(/<button/);
    expect(output).toMatch(/Submit/);
  });

  it("exports a text component with priority", () => {
    const data: A2UIInput = {
      type: "text",
      content: "Critical evidence found",
      priority: "critical",
    };

    const output = exportA2UI(data);
    expect(output).toContain("Critical evidence found");
    expect(output).toContain("text-red-400");
    expect(output).toContain("font-bold");
  });

  it("exports a card with status", () => {
    const data: A2UIInput = {
      type: "card",
      title: "Suspect Profile",
      description: "Primary person of interest",
      status: "active",
    };

    const output = exportA2UI(data);
    expect(output).toContain("Suspect Profile");
    expect(output).toContain("Primary person of interest");
    expect(output).toContain("border-amber");
  });

  it("exports a grid layout", () => {
    const data: A2UIInput = {
      type: "grid",
      columns: "3",
      style: { gap: "md" },
      children: [
        { type: "stat", label: "Cases", value: "42" },
        { type: "stat", label: "Solved", value: "38" },
        { type: "stat", label: "Active", value: "4" },
      ],
    };

    const output = exportA2UI(data);
    expect(output).toContain("grid-cols-3");
    expect(output).toContain("gap-4");
    expect(output).toContain("Cases");
    expect(output).toContain("42");
  });

  it("exports a list (ordered)", () => {
    const data: A2UIInput = {
      type: "list",
      ordered: true,
      items: ["First clue", "Second clue", "Third clue"],
    };

    const output = exportA2UI(data);
    expect(output).toContain("<ol");
    expect(output).toContain("list-decimal");
    expect(output).toContain("First clue");
  });

  it("exports a list (unordered)", () => {
    const data: A2UIInput = {
      type: "list",
      ordered: false,
      items: ["Fingerprints", "DNA sample"],
    };

    const output = exportA2UI(data);
    expect(output).toContain("<ul");
    expect(output).toContain("list-disc");
  });

  it("exports a table", () => {
    const data: A2UIInput = {
      type: "table",
      columns: ["Name", "Role", "Status"],
      rows: [
        ["John Doe", "Suspect", "Active"],
        ["Jane Smith", "Witness", "Interviewed"],
      ],
    };

    const output = exportA2UI(data);
    expect(output).toContain("<table");
    expect(output).toContain("<thead");
    expect(output).toContain("Name");
    expect(output).toContain("John Doe");
    expect(output).toContain("Suspect");
  });

  it("exports tabs with useState import", () => {
    const data: A2UIInput = {
      type: "tabs",
      tabs: [
        {
          label: "Evidence",
          content: {
            type: "text",
            content: "Tab 1 content",
            priority: "normal",
          },
        },
        {
          label: "Witnesses",
          content: {
            type: "text",
            content: "Tab 2 content",
            priority: "normal",
          },
        },
      ],
    };

    const output = exportA2UI(data);
    expect(output).toContain("useState");
    expect(output).toContain("activeTab");
    expect(output).toContain("setActiveTab");
    expect(output).toContain("Evidence");
    expect(output).toContain("Witnesses");
  });

  it("gives each tabs group its own state variable", () => {
    const data: A2UIInput = {
      type: "container",
      children: [
        {
          type: "tabs",
          tabs: [
            { label: "A1", content: { type: "text", content: "a1", priority: "normal" } },
            { label: "A2", content: { type: "text", content: "a2", priority: "normal" } },
          ],
        },
        {
          type: "tabs",
          tabs: [
            { label: "B1", content: { type: "text", content: "b1", priority: "normal" } },
            { label: "B2", content: { type: "text", content: "b2", priority: "normal" } },
          ],
        },
      ],
    };

    const output = exportA2UI(data);
    // Two distinct state hooks, not one shared activeTab.
    expect(output).toContain("const [activeTab, setActiveTab] = useState(0);");
    expect(output).toContain("const [activeTab1, setActiveTab1] = useState(0);");
    expect(output).toContain("setActiveTab1(");
    expect(output).toContain("activeTab1 === ");
  });

  it("exports a modal with open/close state", () => {
    const data: A2UIInput = {
      type: "modal",
      trigger: { type: "button", label: "Open", variant: "primary" },
      content: { type: "text", content: "Secret evidence", priority: "high" },
    };

    const output = exportA2UI(data);
    expect(output).toContain("const [modalOpen0, setModalOpen0] = useState(false);");
    expect(output).toContain("setModalOpen0(true)");
    expect(output).toContain("setModalOpen0(false)");
    expect(output).toContain("Open");
    expect(output).toContain("Secret evidence");
  });

  it("exports an image", () => {
    const data: A2UIInput = {
      type: "image",
      src: "/evidence/photo-001.jpg",
      alt: "Crime scene photograph",
    };

    const output = exportA2UI(data);
    expect(output).toContain("<img");
    expect(output).toContain('src={"/evidence/photo-001.jpg"}');
    expect(output).toContain('alt={"Crime scene photograph"}');
  });

  it("exports form elements", () => {
    const data: A2UIInput = {
      type: "container",
      children: [
        { type: "input", label: "Email", placeholder: "detective@noir.com" },
        {
          type: "textarea",
          label: "Notes",
          placeholder: "Enter notes...",
          rows: 5,
        },
        {
          type: "select",
          label: "Priority",
          options: ["Low", "Medium", "High"],
          value: "Medium",
        },
        { type: "checkbox", label: "Mark as reviewed", checked: true },
      ],
    };

    const output = exportA2UI(data);
    expect(output).toContain("<input");
    expect(output).toContain("<textarea");
    expect(output).toContain("<select");
    expect(output).toContain('type="checkbox"');
    expect(output).toContain("defaultChecked");
  });

  it("exports callout and badge", () => {
    const data: A2UIInput = {
      type: "container",
      children: [
        { type: "callout", content: "Important notice", priority: "high" },
        { type: "badge", label: "CLASSIFIED", variant: "danger" },
      ],
    };

    const output = exportA2UI(data);
    expect(output).toContain("border-l-2");
    expect(output).toContain("border-amber");
    expect(output).toContain("CLASSIFIED");
    expect(output).toContain("bg-red-900");
  });

  it("exports divider with label", () => {
    const data: A2UIInput = {
      type: "divider",
      label: "SECTION BREAK",
    };

    const output = exportA2UI(data);
    expect(output).toContain("border-t");
    expect(output).toContain("SECTION BREAK");
  });

  it("exports a video with a real source as a player", () => {
    const data: A2UIInput = {
      type: "video",
      src: "/api/video/file/clip-001.mp4",
      alt: "Surveillance footage",
    };

    const output = exportA2UI(data);
    expect(output).toContain("<video");
    expect(output).toContain('src={"/api/video/file/clip-001.mp4"}');
    expect(output).toContain("controls");
    expect(output).toContain('aria-label={"Surveillance footage"}');
  });

  it("exports a prompt-only video (no real src) as a labelled stub, not a dead <video>", () => {
    const data: A2UIInput = {
      type: "video",
      src: "grainy security-cam footage of a figure in the alley",
      alt: "Footage",
    };

    const output = exportA2UI(data);
    expect(output).not.toContain("<video");
    expect(output).toContain("generate footage");
  });

  it("exports a slider", () => {
    const data: A2UIInput = {
      type: "slider",
      label: "Threat Level",
      min: 0,
      max: 10,
      value: 7,
    };

    const output = exportA2UI(data);
    expect(output).toContain('type="range"');
    expect(output).toContain("min={0}");
    expect(output).toContain("max={10}");
    expect(output).toContain("defaultValue={7}");
    expect(output).toContain("Threat Level");
  });
});

describe("exportA2UI — defensive against malformed / out-of-range input", () => {
  // The JSON editor feeds RAW, unvalidated trees into eject. A partial node must
  // degrade to a comment instead of throwing and crashing the whole panel.
  it("skips a malformed node instead of throwing", () => {
    // `list` without `items` would throw on .map() inside the switch.
    const data = { type: "list" } as unknown as A2UIInput;
    expect(() => exportA2UI(data)).not.toThrow();
    const output = exportA2UI(data);
    expect(output).toContain("Skipped malformed");
  });

  it("keeps exporting valid siblings when one child is malformed", () => {
    const data = {
      type: "container",
      children: [
        { type: "heading", level: 2, text: "Valid Heading" },
        { type: "table" }, // missing columns/rows → would throw
        { type: "text", content: "Valid text", priority: "normal" },
      ],
    } as unknown as A2UIInput;

    const output = exportA2UI(data);
    expect(output).toContain("Valid Heading");
    expect(output).toContain("Valid text");
    expect(output).toContain("Skipped malformed");
  });

  it("tolerates a malformed tabs node in the stateful-node counter", () => {
    // `tabs` without a `tabs` array used to throw in countStatefulNodes.
    const data = { type: "tabs" } as unknown as A2UIInput;
    expect(() => exportA2UI(data)).not.toThrow();
  });

  it("clamps an out-of-range heading level to a valid h1–h4", () => {
    const tooHigh = exportA2UI({ type: "heading", level: 7, text: "Big" } as A2UIInput);
    expect(tooHigh).toContain("<h4");
    expect(tooHigh).not.toContain("<h7");

    const tooLow = exportA2UI({ type: "heading", level: 0, text: "Small" } as A2UIInput);
    expect(tooLow).toContain("<h1");
    expect(tooLow).not.toContain("<h0");
  });
});

describe("exportA2UIAsJSON", () => {
  it("returns formatted JSON string", () => {
    const data: A2UIInput = {
      type: "text",
      content: "Test",
      priority: "normal",
    };

    const output = exportA2UIAsJSON(data);
    const parsed = JSON.parse(output);
    expect(parsed.type).toBe("text");
    expect(parsed.content).toBe("Test");
  });
});

describe("exportA2UIMultiFile", () => {
  it("exports multiple files for a component", () => {
    const data: A2UIInput = {
      type: "container",
      children: [
        { type: "heading", level: 1, text: "Dashboard" },
        { type: "stat", label: "Cases", value: "42" },
      ],
    };

    const files = exportA2UIMultiFile(data, "Dashboard");

    expect(files).toHaveLength(3);

    // Main component file
    const mainFile = files.find((f) => f.path === "Dashboard/Dashboard.tsx");
    expect(mainFile).toBeDefined();
    expect(mainFile?.content).toContain("export function Dashboard");
    expect(mainFile?.content).toContain("Cases");

    // Index file
    const indexFile = files.find((f) => f.path === "Dashboard/index.ts");
    expect(indexFile).toBeDefined();
    expect(indexFile?.content).toContain('export { Dashboard } from "./Dashboard"');

    // Data file
    const dataFile = files.find((f) => f.path === "Dashboard/Dashboard.data.ts");
    expect(dataFile).toBeDefined();
    expect(dataFile?.content).toContain("dashboardData");
    expect(dataFile?.content).toContain('"type": "container"');
  });

  it("uses default component name if not provided", () => {
    const data: A2UIInput = {
      type: "text",
      content: "Test",
      priority: "normal",
    };

    const files = exportA2UIMultiFile(data);

    expect(files[0].path).toBe("Evidence/Evidence.tsx");
  });
});
