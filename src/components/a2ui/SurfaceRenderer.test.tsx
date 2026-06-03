import { render, screen, fireEvent } from "@testing-library/react";
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

  it("wraps a noir Card in the aged-paper dossier frame", () => {
    const surface = makeSurface([
      { id: "root", component: "Card", child: "body" },
      { id: "body", component: "Text", text: "Evidence" },
    ]);
    const { container } = render(<SurfaceRenderer surface={surface} theme="noir" />);
    expect(container.querySelector(".bg-paper")).not.toBeNull();
    expect(screen.getByText("Evidence")).toBeInTheDocument();
  });

  it("uses the clean elevated box for the standard theme", () => {
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
    render(<SurfaceRenderer surface={surface} theme="noir" onAction={onAction} />);
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
});
