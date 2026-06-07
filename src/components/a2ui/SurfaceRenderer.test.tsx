import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SurfaceRenderer } from "./SurfaceRenderer";
import type { SurfaceState, SurfaceComponent, SurfaceConfig } from "@/lib/a2ui/surfaces/manager";

function makeSurface(
  components: SurfaceComponent[],
  dataModel: Record<string, unknown> = {},
  config: Partial<SurfaceConfig> = {}
): SurfaceState {
  return {
    config: { surfaceId: "s1", catalogId: "standard", ...config },
    components: new Map(components.map((c) => [c.id, c])),
    dataModel,
    createdAt: 0,
  };
}

describe("SurfaceRenderer", () => {
  it("renders catalog components routed by the `component` discriminator", () => {
    const surface = makeSurface([{ id: "root", component: "Text", text: "Closed case" }]);
    render(<SurfaceRenderer surface={surface} theme="noir" />);
    expect(screen.getByText("Closed case")).toBeInTheDocument();
  });

  it("renders a Card as a dark elevated panel (no light paper box on the dark board)", () => {
    const surface = makeSurface([
      { id: "root", component: "Card", child: "body" },
      { id: "body", component: "Text", text: "Evidence" },
    ]);
    const { container } = render(<SurfaceRenderer surface={surface} theme="noir" />);
    // The jarring light aged-paper frame (.bg-paper) is gone; cards now stay in
    // the dark palette with a thin amber top accent.
    expect(container.querySelector(".bg-paper")).toBeNull();
    expect(container.querySelector(".border-t-2")).not.toBeNull();
    expect(screen.getByText("Evidence")).toBeInTheDocument();
  });

  it("renders the same dark card for the standard theme", () => {
    const surface = makeSurface([
      { id: "root", component: "Card", child: "body" },
      { id: "body", component: "Text", text: "Evidence" },
    ]);
    const { container } = render(<SurfaceRenderer surface={surface} theme="standard" />);
    expect(container.querySelector(".bg-paper")).toBeNull();
    expect(screen.getByText("Evidence")).toBeInTheDocument();
  });

  it("shows an unknown-component fallback naming the bad component type", () => {
    const surface = makeSurface([
      { id: "root", component: "Bogus" } as unknown as SurfaceComponent,
    ]);
    render(<SurfaceRenderer surface={surface} theme="noir" />);
    expect(screen.getByText(/Unknown: Bogus/)).toBeInTheDocument();
  });

  it("renders a lowercase legacy component type via the case-insensitive fallback", () => {
    // A raw legacy "column" that slipped past the catalog adapter must still
    // render its children, not an "[Unknown: column]" error box.
    const surface = makeSurface([
      { id: "root", component: "column", children: ["body"] } as unknown as SurfaceComponent,
      { id: "body", component: "Text", text: "Recovered evidence" },
    ]);
    render(<SurfaceRenderer surface={surface} theme="noir" />);
    expect(screen.getByText("Recovered evidence")).toBeInTheDocument();
    expect(screen.queryByText(/Unknown: column/)).not.toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Full 18-component coverage: the 7 that previously rendered as "Unknown".
  // --------------------------------------------------------------------------

  it("renders Tabs and switches the active panel on click", () => {
    const surface = makeSurface([
      {
        id: "root",
        component: "Tabs",
        tabs: [
          { title: "Suspects", child: "p1" },
          { title: "Alibis", child: "p2" },
        ],
      },
      { id: "p1", component: "Text", text: "Panel one" },
      { id: "p2", component: "Text", text: "Panel two" },
    ]);
    render(<SurfaceRenderer surface={surface} theme="noir" />);
    expect(screen.getByText("Panel one")).toBeInTheDocument();
    expect(screen.queryByText("Panel two")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Alibis" }));
    expect(screen.getByText("Panel two")).toBeInTheDocument();
  });

  it("renders Modal trigger and opens the content dialog on click", () => {
    const surface = makeSurface([
      { id: "root", component: "Modal", trigger: "t", content: "c" },
      { id: "t", component: "Text", text: "Open file" },
      { id: "c", component: "Text", text: "Top secret" },
    ]);
    render(<SurfaceRenderer surface={surface} theme="noir" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Open file"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Top secret")).toBeInTheDocument();
  });

  it("renders a Table as a real grid (header + rows), not flattened text", () => {
    const surface = makeSurface([
      {
        id: "root",
        component: "Table",
        columns: ["Item", "Location", "Status"],
        rows: [
          ["Cybernetic Eye", "Alleyway", "Diagnostics"],
          ["Datapad", "Sector 4", "Recovery"],
        ],
      },
    ]);
    const { container } = render(<SurfaceRenderer surface={surface} theme="noir" />);
    expect(container.querySelector("table")).not.toBeNull();
    expect(container.querySelectorAll("thead th")).toHaveLength(3);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(2);
    expect(screen.getByText("Cybernetic Eye")).toBeInTheDocument();
    // Not pipe-joined into one text node.
    expect(screen.queryByText(/Item\s*\|\s*Location/)).not.toBeInTheDocument();
  });

  it("lets a ChoicePicker select an option even without a {path} binding", () => {
    // Regression: an unbound picker (literal value) was fully controlled with a
    // no-op handler, so clicks never registered. It now falls back to local state.
    const surface = makeSurface([
      {
        id: "root",
        component: "ChoicePicker",
        label: "Case",
        variant: "mutuallyExclusive",
        options: [
          { label: "Case 904", value: "904" },
          { label: "Case 887", value: "887" },
        ],
        value: [],
      },
    ]);
    render(<SurfaceRenderer surface={surface} theme="noir" />);
    const radios = screen.getAllByRole("radio");
    expect(radios[0]).not.toBeChecked();
    fireEvent.click(radios[1]);
    expect(radios[1]).toBeChecked();
  });

  it("renders a Badge as a pill (not plain text)", () => {
    const surface = makeSurface([
      { id: "root", component: "Badge", label: "WANTED", variant: "danger" },
    ]);
    render(<SurfaceRenderer surface={surface} theme="noir" />);
    const pill = screen.getByText("WANTED");
    expect(pill).toBeInTheDocument();
    expect(pill.className).toMatch(/rounded-full/);
  });

  it("renders a Grid as a CSS grid containing its children", () => {
    const surface = makeSurface([
      { id: "root", component: "Grid", columns: "3", children: ["a", "b", "c"] },
      { id: "a", component: "Text", text: "One" },
      { id: "b", component: "Text", text: "Two" },
      { id: "c", component: "Text", text: "Three" },
    ]);
    const { container } = render(<SurfaceRenderer surface={surface} theme="noir" />);
    expect(container.querySelector(".grid")).not.toBeNull();
    expect(screen.getByText("One")).toBeInTheDocument();
    expect(screen.getByText("Three")).toBeInTheDocument();
  });

  it("renders a Stat tile with label and value", () => {
    const surface = makeSurface([
      { id: "root", component: "Stat", label: "Open Leads", value: "7", helper: "+2 today" },
    ]);
    render(<SurfaceRenderer surface={surface} theme="noir" />);
    expect(screen.getByText("Open Leads")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("+2 today")).toBeInTheDocument();
  });

  it("renders a Button label with readable text (no nested washed-out Text)", () => {
    const surface = makeSurface([
      {
        id: "root",
        component: "Button",
        child: "lbl",
        action: { event: { name: "submit" } },
      },
      { id: "lbl", component: "Text", text: "Log Suspect" },
    ]);
    render(<SurfaceRenderer surface={surface} theme="noir" actionEndpoint={null} />);
    const btn = screen.getByRole("button", { name: "Log Suspect" });
    expect(btn).toBeInTheDocument();
    // The label is rendered directly on the button (not as a child <p>).
    expect(btn.querySelector("p")).toBeNull();
  });

  it("renders Video and AudioPlayer with their URLs", () => {
    const surface = makeSurface([
      { id: "root", component: "Column", children: ["v", "a"] },
      { id: "v", component: "Video", url: "/clip.mp4" },
      { id: "a", component: "AudioPlayer", url: "/tape.mp3", description: "Wire tap" },
    ]);
    const { container } = render(<SurfaceRenderer surface={surface} theme="noir" />);
    expect(container.querySelector('video[src="/clip.mp4"]')).not.toBeNull();
    expect(container.querySelector('audio[src="/tape.mp3"]')).not.toBeNull();
    expect(screen.getByText("Wire tap")).toBeInTheDocument();
  });

  it("renders Slider, ChoicePicker, and DateTimeInput", () => {
    const surface = makeSurface(
      [
        { id: "root", component: "Column", children: ["s", "cp", "dt"] },
        { id: "s", component: "Slider", label: "Heat", min: 0, max: 10, value: { path: "/heat" } },
        {
          id: "cp",
          component: "ChoicePicker",
          label: "Motive",
          variant: "mutuallyExclusive",
          options: [
            { label: "Greed", value: "greed" },
            { label: "Revenge", value: "revenge" },
          ],
          value: { path: "/motive" },
        },
        { id: "dt", component: "DateTimeInput", value: { path: "/when" }, enableDate: true },
      ],
      { heat: 4, motive: [], when: "" }
    );
    const { container } = render(<SurfaceRenderer surface={surface} theme="noir" />);
    expect(container.querySelector('input[type="range"]')).not.toBeNull();
    expect(screen.getByText("Greed")).toBeInTheDocument();
    expect(screen.getByText("Revenge")).toBeInTheDocument();
    expect(container.querySelector('input[type="date"]')).not.toBeNull();
  });

  // --------------------------------------------------------------------------
  // Two-way data binding
  // --------------------------------------------------------------------------

  it("renders a bound TextField value from the data model", () => {
    const surface = makeSurface(
      [{ id: "root", component: "TextField", label: "Name", value: { path: "/name" } }],
      { name: "Sam Spade" }
    );
    render(<SurfaceRenderer surface={surface} theme="noir" />);
    expect(screen.getByLabelText("Name")).toHaveValue("Sam Spade");
  });

  it("writes TextField edits back into the working data model (two-way binding)", () => {
    const surface = makeSurface(
      [{ id: "root", component: "TextField", label: "Name", value: { path: "/name" } }],
      { name: "" }
    );
    render(<SurfaceRenderer surface={surface} theme="noir" />);
    const input = screen.getByLabelText("Name");
    fireEvent.change(input, { target: { value: "Brigid" } });
    // Controlled input reflects the committed data-model value.
    expect(input).toHaveValue("Brigid");
  });

  it("toggles a bound CheckBox through the data model", () => {
    const surface = makeSurface(
      [{ id: "root", component: "CheckBox", label: "Urgent", value: { path: "/urgent" } }],
      { urgent: false }
    );
    render(<SurfaceRenderer surface={surface} theme="noir" />);
    const box = screen.getByRole("checkbox");
    expect(box).not.toBeChecked();
    fireEvent.click(box);
    expect(box).toBeChecked();
  });

  // --------------------------------------------------------------------------
  // Actions
  // --------------------------------------------------------------------------

  it("emits a client→server ActionMessage when a Button server event fires", () => {
    const onAction = vi.fn();
    const surface = makeSurface([
      {
        id: "root",
        component: "Button",
        child: "lbl",
        action: { event: { name: "submit_case", context: { caseId: "42" } } },
      },
      { id: "lbl", component: "Text", text: "File it" },
    ]);
    render(
      <SurfaceRenderer surface={surface} theme="noir" onAction={onAction} actionEndpoint={null} />
    );
    fireEvent.click(screen.getByText("File it"));

    expect(onAction).toHaveBeenCalledTimes(1);
    const msg = onAction.mock.calls[0][0];
    expect(msg).toMatchObject({
      type: "action",
      surfaceId: "s1",
      sourceComponentId: "root",
      actionName: "submit_case",
    });
  });

  it("handles a local functionCall toggle action against the data model", () => {
    const surface = makeSurface(
      [
        { id: "root", component: "Column", children: ["btn", "flag"] },
        {
          id: "btn",
          component: "Button",
          child: "lbl",
          action: { functionCall: { call: "toggle", args: { path: "/open" } } },
        },
        { id: "lbl", component: "Text", text: "Toggle" },
        { id: "flag", component: "CheckBox", label: "Open", value: { path: "/open" } },
      ],
      { open: false }
    );
    render(<SurfaceRenderer surface={surface} theme="noir" />);
    const box = screen.getByRole("checkbox");
    expect(box).not.toBeChecked();
    fireEvent.click(screen.getByText("Toggle"));
    expect(box).toBeChecked();
  });

  // --------------------------------------------------------------------------
  // Object theme
  // --------------------------------------------------------------------------

  it("applies a v0.9 object theme as CSS-variable overrides", () => {
    const surface = makeSurface(
      [{ id: "root", component: "Text", text: "Themed" }],
      {},
      {
        theme: { primaryColor: "rgb(0, 191, 255)" },
      }
    );
    const { container } = render(<SurfaceRenderer surface={surface} theme="noir" />);
    const wrapper = container.querySelector("[style]") as HTMLElement | null;
    expect(wrapper?.style.getPropertyValue("--aesthetic-accent")).toBe("rgb(0, 191, 255)");
  });

  // --------------------------------------------------------------------------
  // Function-call data bindings
  // --------------------------------------------------------------------------

  it("resolves a functionCall binding (concat) in Text", () => {
    const surface = makeSurface(
      [
        {
          id: "root",
          component: "Text",
          text: { call: "concat", args: { values: [{ path: "/first" }, " ", { path: "/last" }] } },
        },
      ],
      { first: "Sam", last: "Spade" }
    );
    render(<SurfaceRenderer surface={surface} theme="noir" />);
    expect(screen.getByText("Sam Spade")).toBeInTheDocument();
  });

  it("resolves a nested/uppercase functionCall binding", () => {
    const surface = makeSurface(
      [
        {
          id: "root",
          component: "Text",
          text: { call: "uppercase", args: { v: { path: "/name" } } },
        },
      ],
      { name: "redacted" }
    );
    render(<SurfaceRenderer surface={surface} theme="noir" />);
    expect(screen.getByText("REDACTED")).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Template children (dynamic child lists)
  // --------------------------------------------------------------------------

  it("expands a template child list over an array with per-item scope", () => {
    const surface = makeSurface(
      [
        {
          id: "root",
          component: "Column",
          children: { componentId: "itemTpl", path: "/suspects" },
        },
        // Relative pointer "name" (no leading slash) resolves against each
        // scoped array element; absolute "/..." would hit the surface root.
        { id: "itemTpl", component: "Text", text: { path: "name" } },
      ],
      { suspects: [{ name: "Brigid" }, { name: "Joel" }, { name: "Wilmer" }] }
    );
    render(<SurfaceRenderer surface={surface} theme="noir" />);
    expect(screen.getByText("Brigid")).toBeInTheDocument();
    expect(screen.getByText("Joel")).toBeInTheDocument();
    expect(screen.getByText("Wilmer")).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Validation (checks)
  // --------------------------------------------------------------------------

  it("shows a validation error after an invalid edit and clears it when fixed", () => {
    const surface = makeSurface(
      [
        {
          id: "root",
          component: "TextField",
          label: "Email",
          value: { path: "/email" },
          checks: [{ call: "email", message: "Bad email, gumshoe." }],
        },
      ],
      { email: "" }
    );
    render(<SurfaceRenderer surface={surface} theme="noir" />);
    const input = screen.getByLabelText("Email");

    // No error before the field is touched.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: "not-an-email" } });
    expect(screen.getByRole("alert")).toHaveTextContent("Bad email, gumshoe.");

    fireEvent.change(input, { target: { value: "sam@spade.io" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Server action round-trip (HTTP back-channel)
  // --------------------------------------------------------------------------

  it("posts a server event to the action endpoint and applies returned messages", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        messages: [{ type: "updateDataModel", surfaceId: "s1", path: "/status", value: "Filed." }],
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const surface = makeSurface(
      [
        { id: "root", component: "Column", children: ["btn", "status"] },
        {
          id: "btn",
          component: "Button",
          child: "lbl",
          action: { event: { name: "submit" } },
        },
        { id: "lbl", component: "Text", text: "File it" },
        { id: "status", component: "Text", text: { path: "/status" } },
      ],
      { status: "" }
    );

    render(<SurfaceRenderer surface={surface} theme="noir" actionEndpoint="/api/a2ui/action" />);
    fireEvent.click(screen.getByText("File it"));

    // The returned updateDataModel is applied to the working model → re-render.
    expect(await screen.findByText("Filed.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/a2ui/action",
      expect.objectContaining({ method: "POST" })
    );

    vi.unstubAllGlobals();
  });
});

import { useA2UIStore } from "@/lib/store/useA2UIStore";

describe("KanbanBoard Renderer", () => {
  it("renders columns and cards with long text wrapping", () => {
    const board = {
      id: "root",
      component: "KanbanBoard",
      title: "Suspect List",
      columns: [
        {
          id: "todo",
          title: "To Do",
          cards: [
            {
              id: "c1",
              title: "John Doe",
              description:
                "A very long description that should wrap correctly without causing horizontal overflow or breaking layout boundaries.",
              assignee: "Spade",
              tags: ["suspect"],
            },
          ],
        },
      ],
    };

    const surface = makeSurface([board as unknown as SurfaceComponent]);
    render(<SurfaceRenderer surface={surface} theme="noir" />);

    expect(screen.getByText("Suspect List")).toBeInTheDocument();
    expect(screen.getByText("To Do (1)")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText(/A very long description/)).toBeInTheDocument();
    expect(screen.getByText(/Spade/)).toBeInTheDocument();
    expect(screen.getByText("suspect")).toBeInTheDocument();
  });
});

describe("DataDashboard Renderer", () => {
  it("renders metric, progress and chart widgets", () => {
    const dashboard = {
      id: "root",
      component: "DataDashboard",
      title: "System Analytics",
      widgets: [
        {
          id: "w1",
          title: "Total Files",
          type: "metric",
          value: "105",
          unit: "files",
          trend: { value: 10, direction: "up" },
        },
        {
          id: "w2",
          title: "Scan Progress",
          type: "progress",
          progress: 75,
        },
        {
          id: "w3",
          title: "Activity Chart",
          type: "chart",
          chartType: "bar",
          data: [{ label: "Mon", value: 10 }],
        },
      ],
    };

    const surface = makeSurface([dashboard as unknown as SurfaceComponent]);
    render(<SurfaceRenderer surface={surface} theme="noir" />);

    expect(screen.getByText("System Analytics")).toBeInTheDocument();
    expect(screen.getByText("Total Files")).toBeInTheDocument();
    expect(screen.getByText("105")).toBeInTheDocument();
    expect(screen.getByText("files")).toBeInTheDocument();
    expect(screen.getByText("Scan Progress")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("Activity Chart")).toBeInTheDocument();
  });
});

describe("A2UI Templates Aesthetic Styles", () => {
  it("adapts styling class based on baseAestheticId from Zustand store", () => {
    const board = {
      id: "root",
      component: "KanbanBoard",
      title: "Aesthetic Board",
      columns: [],
    };
    const surface = makeSurface([board as unknown as SurfaceComponent]);

    // 1. Nostromo Console
    act(() => {
      useA2UIStore.setState({
        settings: {
          ...useA2UIStore.getState().settings,
          aestheticId: "nostromo-console",
        },
      });
    });
    const { container: container1, rerender } = render(
      <SurfaceRenderer surface={surface} theme="noir" />
    );
    // Boards are now var-driven (color via CSS vars so custom profiles adapt);
    // only genuinely preset-unique DECORATION stays keyed on the aesthetic.
    // Nostromo keeps its CRT scanlines and uses the shared --aesthetic-* text.
    expect(container1.querySelector(".crt-scanlines")).toBeInTheDocument();
    // Var-driven: the board container styles via --aesthetic-* CSS vars.
    expect(container1.querySelector('[class*="--aesthetic-"]')).toBeInTheDocument();

    // 2. Gothic Manor — fully var-driven now (no hardcoded #eae2cf parchment);
    // it differs from nostromo only by CSS vars, so it carries no scanlines.
    act(() => {
      useA2UIStore.setState({
        settings: {
          ...useA2UIStore.getState().settings,
          aestheticId: "gothic-manor",
        },
      });
    });
    rerender(<SurfaceRenderer surface={surface} theme="noir" />);
    expect(container1.querySelector(".crt-scanlines")).not.toBeInTheDocument();
    expect(container1.querySelector('[class*="--aesthetic-"]')).toBeInTheDocument();

    // 3. Cyber-Fixer — keeps its neon glow box-shadow decoration.
    act(() => {
      useA2UIStore.setState({
        settings: {
          ...useA2UIStore.getState().settings,
          aestheticId: "cyber-fixer",
        },
      });
    });
    rerender(<SurfaceRenderer surface={surface} theme="noir" />);
    expect(
      container1.querySelector(".shadow-\\[0_0_10px_\\#06b6d4\\,inset_0_0_5px_\\#06b6d4\\]")
    ).toBeInTheDocument();

    // Reset store state
    act(() => {
      useA2UIStore.setState({
        settings: {
          ...useA2UIStore.getState().settings,
          aestheticId: "noir",
        },
      });
    });
  });
});

describe("Look-and-feel uplift", () => {
  it("tags generated headings with `a2ui-heading` so per-preset type treatment applies", () => {
    // The editorial heading voice (per-preset letter-spacing/weight) is keyed in
    // globals.css off the `a2ui-heading` hook — without the class on the live
    // heading, the treatment never reaches generated content.
    const surface = makeSurface([{ id: "root", component: "Text", variant: "h1", text: "DOSSIER" }]);
    render(<SurfaceRenderer surface={surface} theme="noir" />);
    const heading = screen.getByText("DOSSIER");
    expect(heading.tagName).toBe("H1");
    expect(heading.className).toMatch(/a2ui-heading/);
  });

  it("keeps noir's signature typewriter heading font (does NOT swap to the sans heading face)", () => {
    // Guard against the tempting-but-wrong 'wire the heading font' change: noir's
    // body and heading fonts differ (typewriter vs sans), and noir headers are
    // defined as typewriter. The heading must stay on `font-typewriter`, never
    // `font-sans`, or noir loses its identity.
    const surface = makeSurface([{ id: "root", component: "Text", variant: "h2", text: "CASE" }]);
    render(<SurfaceRenderer surface={surface} theme="noir" />);
    const heading = screen.getByText("CASE");
    expect(heading.className).toMatch(/font-typewriter/);
    expect(heading.className).not.toMatch(/font-sans/);
  });

  it("drives Button corner radius from the aesthetic radius token (not a fixed rounded-sm)", () => {
    const surface = makeSurface([
      { id: "root", component: "Button", label: "FILE IT", action: { call: "noop" } },
    ]);
    render(<SurfaceRenderer surface={surface} theme="noir" />);
    const button = screen.getByRole("button", { name: "FILE IT" });
    expect(button.className).toMatch(/rounded-\[var\(--aesthetic-radius/);
    expect(button.className).not.toMatch(/\brounded-sm\b/);
  });

  it("drives TextField corner radius from the aesthetic radius token", () => {
    const surface = makeSurface([
      { id: "root", component: "TextField", label: "Name", value: "" },
    ]);
    const { container } = render(<SurfaceRenderer surface={surface} theme="noir" />);
    const input = container.querySelector("input");
    expect(input).not.toBeNull();
    expect(input?.className).toMatch(/rounded-\[var\(--aesthetic-radius/);
  });

  it("emits the resolved card material as data-effect-card on the live card", () => {
    // The material-aware border/glow/gradient in globals.css all hang off
    // data-effect-card; noir resolves to the paper material.
    const surface = makeSurface([
      { id: "root", component: "Card", child: "body" },
      { id: "body", component: "Text", text: "Evidence" },
    ]);
    act(() => {
      useA2UIStore.setState({
        settings: { ...useA2UIStore.getState().settings, aestheticId: "noir" },
      });
    });
    const { container } = render(<SurfaceRenderer surface={surface} theme="noir" />);
    expect(container.querySelector('[data-effect-card="paper"]')).not.toBeNull();
    act(() => {
      useA2UIStore.setState({
        settings: { ...useA2UIStore.getState().settings, aestheticId: "noir" },
      });
    });
  });
});
