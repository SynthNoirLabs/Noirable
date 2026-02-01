import { render, screen, fireEvent } from "@testing-library/react";
import { TemplatePanel } from "./TemplatePanel";
import { describe, it, expect, vi } from "vitest";

// Mock templates
vi.mock("@/lib/templates", () => ({
  TEMPLATES: [
    {
      id: "t1",
      name: "Mock Template 1",
      description: "Desc 1",
      category: "form",
      data: { type: "text", content: "1" },
    },
    {
      id: "t2",
      name: "Mock Template 2",
      description: "Desc 2",
      category: "dashboard",
      data: { type: "text", content: "2" },
    },
  ],
}));

// Mock icons
vi.mock("lucide-react", () => ({
  X: () => <span data-testid="icon-x" />,
  FileText: () => <span />,
  LayoutGrid: () => <span />,
  CreditCard: () => <span />,
  Table: () => <span />,
  Columns: () => <span />,
}));

describe("TemplatePanel", () => {
  it("renders template list", () => {
    render(<TemplatePanel onSelect={() => {}} onClose={() => {}} />);
    expect(screen.getByText("Mock Template 1")).toBeInTheDocument();
    expect(screen.getByText("Mock Template 2")).toBeInTheDocument();
  });

  it("calls onSelect with template data when clicked", () => {
    const onSelect = vi.fn();
    render(<TemplatePanel onSelect={onSelect} onClose={() => {}} />);

    fireEvent.click(screen.getByText("Mock Template 1"));
    expect(onSelect).toHaveBeenCalledWith({ type: "text", content: "1" });
  });

  it("filters by category", () => {
    render(<TemplatePanel onSelect={() => {}} onClose={() => {}} />);

    // Click dashboard tab (there are multiple "Dashboards" text - one in tab, one in list item)
    // The tabs are rendered first, so the first button with "Dashboards" should be the tab
    const tabs = screen.getAllByText("Dashboards");
    fireEvent.click(tabs[0]);

    // Should show template 2 (dashboard) but not 1 (form)
    expect(screen.queryByText("Mock Template 1")).not.toBeInTheDocument();
    expect(screen.getByText("Mock Template 2")).toBeInTheDocument();
  });
});
