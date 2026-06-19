import { describe, it, expect, beforeEach } from "vitest";
import { useA2UIStore } from "../useA2UIStore";
import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";

const sampleComponents: SurfaceComponent[] = [{ id: "c1", component: "Text", text: "hello" }];

function makeEntry(prompt: string) {
  return {
    prompt,
    aestheticId: "noir",
    catalogId: "standard",
    theme: "noir",
    components: sampleComponents,
    dataModel: { foo: "bar" },
  };
}

describe("archiveSlice", () => {
  beforeEach(() => {
    useA2UIStore.setState({ archive: [] });
  });

  it("adds a completed generation newest-first with derived title/timestamp", () => {
    useA2UIStore.getState().addToArchive(makeEntry("Find the missing dossier"));
    const [entry] = useA2UIStore.getState().archive;
    expect(entry.prompt).toBe("Find the missing dossier");
    expect(entry.title).toBe("Find the missing dossier");
    expect(entry.id).toBeTruthy();
    expect(entry.archivedAt).toBeGreaterThan(0);
    expect(entry.components).toEqual(sampleComponents);
    expect(entry.dataModel).toEqual({ foo: "bar" });
  });

  it("derives a clamped title from the prompt's first line", () => {
    const long = "x".repeat(80);
    useA2UIStore.getState().addToArchive(makeEntry(`${long}\nsecond line`));
    expect(useA2UIStore.getState().archive[0].title.length).toBeLessThanOrEqual(48);
    expect(useA2UIStore.getState().archive[0].title.endsWith("…")).toBe(true);
  });

  it("keeps newest first", () => {
    useA2UIStore.getState().addToArchive(makeEntry("first"));
    useA2UIStore.getState().addToArchive(makeEntry("second"));
    expect(useA2UIStore.getState().archive.map((c) => c.prompt)).toEqual(["second", "first"]);
  });

  it("caps the archive at 24 with oldest-eviction", () => {
    for (let i = 0; i < 30; i++) {
      useA2UIStore.getState().addToArchive(makeEntry(`case ${i}`));
    }
    const archive = useA2UIStore.getState().archive;
    expect(archive).toHaveLength(24);
    // Newest-first: the most recent (case 29) is at the front, oldest survivor is case 6.
    expect(archive[0].prompt).toBe("case 29");
    expect(archive[archive.length - 1].prompt).toBe("case 6");
  });

  it("removes a case by id", () => {
    useA2UIStore.getState().addToArchive(makeEntry("keep"));
    useA2UIStore.getState().addToArchive(makeEntry("drop"));
    const dropId = useA2UIStore.getState().archive[0].id;
    useA2UIStore.getState().removeFromArchive(dropId);
    expect(useA2UIStore.getState().archive.map((c) => c.prompt)).toEqual(["keep"]);
  });

  it("clears the archive", () => {
    useA2UIStore.getState().addToArchive(makeEntry("a"));
    useA2UIStore.getState().clearArchive();
    expect(useA2UIStore.getState().archive).toEqual([]);
  });
});
