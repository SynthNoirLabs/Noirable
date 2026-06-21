import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CaseArchive } from "./CaseArchive";
import type { ArchivedCase } from "@/lib/store/useA2UIStore";

// framer-motion's AnimatePresence/motion are heavy in jsdom; stub to plain DOM.
vi.mock("framer-motion", () => ({
  motion: {
    aside: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <aside {...props}>{children}</aside>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

const cases: ArchivedCase[] = [
  {
    id: "a1",
    archivedAt: Date.now(),
    prompt: "Map the smuggling routes",
    title: "Map the smuggling routes",
    aestheticId: "noir",
    catalogId: "standard",
    theme: "noir",
    components: [{ id: "c1", component: "Text" }],
    dataModel: {},
  },
  {
    id: "a2",
    archivedAt: Date.now(),
    prompt: "Build a dashboard of the suspects",
    title: "Build a dashboard of the suspects",
    aestheticId: "noir",
    catalogId: "standard",
    theme: "noir",
    components: [{ id: "c2", component: "Text" }],
    dataModel: {},
  },
];

describe("CaseArchive", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders nothing when closed", () => {
    const { queryByTestId } = render(
      <CaseArchive
        cases={cases}
        isOpen={false}
        onClose={vi.fn()}
        onRestore={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(queryByTestId("case-archive")).not.toBeInTheDocument();
  });

  it("lists archived case cards when open", () => {
    render(
      <CaseArchive cases={cases} isOpen onClose={vi.fn()} onRestore={vi.fn()} onRemove={vi.fn()} />
    );
    expect(screen.getAllByTestId("case-archive-card")).toHaveLength(2);
    expect(screen.getByText("Map the smuggling routes")).toBeInTheDocument();
  });

  it("restores a case on click", () => {
    const onRestore = vi.fn();
    render(
      <CaseArchive
        cases={cases}
        isOpen
        onClose={vi.fn()}
        onRestore={onRestore}
        onRemove={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Restore case Map the smuggling routes/i }));
    expect(onRestore).toHaveBeenCalledWith(cases[0]);
  });

  it("filters cases by prompt text", () => {
    render(
      <CaseArchive cases={cases} isOpen onClose={vi.fn()} onRestore={vi.fn()} onRemove={vi.fn()} />
    );
    fireEvent.change(screen.getByLabelText("Search the files"), {
      target: { value: "dashboard" },
    });
    expect(screen.getByText("Build a dashboard of the suspects")).toBeInTheDocument();
    expect(screen.queryByText("Map the smuggling routes")).not.toBeInTheDocument();
  });

  it("removes a case", () => {
    const onRemove = vi.fn();
    render(
      <CaseArchive cases={cases} isOpen onClose={vi.fn()} onRestore={vi.fn()} onRemove={onRemove} />
    );
    fireEvent.click(screen.getByRole("button", { name: /Remove case Map the smuggling routes/i }));
    expect(onRemove).toHaveBeenCalledWith("a1");
  });

  it("shows an empty hint when there are no cases", () => {
    render(
      <CaseArchive cases={[]} isOpen onClose={vi.fn()} onRestore={vi.fn()} onRemove={vi.fn()} />
    );
    expect(screen.getByText(/No case files yet/i)).toBeInTheDocument();
  });
});
