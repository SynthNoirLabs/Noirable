import { describe, it, expect, beforeEach } from "vitest";
import { useA2UIStore, type EvidenceEntry } from "./useA2UIStore";

describe("useA2UIStore", () => {
  beforeEach(() => {
    // Reset store to initial state
    useA2UIStore.setState({
      evidence: null,
      evidenceHistory: [],
      activeEvidenceId: null,
      settings: {
        typewriterSpeed: 30,
        soundEnabled: true,
        modelConfig: { provider: "auto", model: "" },
      },
      layout: {
        showEditor: true,
        showSidebar: true,
        showEject: false,
        editorWidth: 300,
        sidebarWidth: 360,
      },
    });
  });

  describe("evidence management", () => {
    it("sets evidence correctly", () => {
      const evidence = {
        type: "text" as const,
        content: "Test",
        priority: "normal" as const,
      };
      useA2UIStore.getState().setEvidence(evidence);
      expect(useA2UIStore.getState().evidence).toEqual(evidence);
    });

    it("adds evidence to history", () => {
      const entry: EvidenceEntry = {
        id: "test-1",
        createdAt: Date.now(),
        label: "Test Evidence",
        data: {
          type: "text" as const,
          content: "Test",
          priority: "normal" as const,
        },
      };
      useA2UIStore.getState().addEvidence(entry);

      const state = useA2UIStore.getState();
      expect(state.evidenceHistory).toHaveLength(1);
      expect(state.evidenceHistory[0]).toEqual(entry);
      expect(state.activeEvidenceId).toBe("test-1");
    });

    it("removes evidence from history", () => {
      const entry1: EvidenceEntry = {
        id: "test-1",
        createdAt: Date.now(),
        label: "Test 1",
        data: {
          type: "text" as const,
          content: "Test 1",
          priority: "normal" as const,
        },
      };
      const entry2: EvidenceEntry = {
        id: "test-2",
        createdAt: Date.now(),
        label: "Test 2",
        data: {
          type: "text" as const,
          content: "Test 2",
          priority: "normal" as const,
        },
      };

      useA2UIStore.getState().addEvidence(entry1);
      useA2UIStore.getState().addEvidence(entry2);
      useA2UIStore.getState().setEvidence(entry2.data);

      // Remove active evidence
      useA2UIStore.getState().removeEvidence("test-2");

      const state = useA2UIStore.getState();
      expect(state.evidenceHistory).toHaveLength(1);
      expect(state.activeEvidenceId).toBe("test-1");
      expect(state.evidence).toEqual(entry1.data);
    });

    it("clears all history", () => {
      const entry: EvidenceEntry = {
        id: "test-1",
        createdAt: Date.now(),
        label: "Test",
        data: {
          type: "text" as const,
          content: "Test",
          priority: "normal" as const,
        },
      };

      useA2UIStore.getState().addEvidence(entry);
      useA2UIStore.getState().setEvidence(entry.data);
      useA2UIStore.getState().clearHistory();

      const state = useA2UIStore.getState();
      expect(state.evidenceHistory).toHaveLength(0);
      expect(state.activeEvidenceId).toBeNull();
      expect(state.evidence).toBeNull();
    });

    it("sets active evidence id", () => {
      useA2UIStore.getState().setActiveEvidenceId("custom-id");
      expect(useA2UIStore.getState().activeEvidenceId).toBe("custom-id");
    });
  });

  describe("settings management", () => {
    it("updates settings partially", () => {
      useA2UIStore.getState().updateSettings({ typewriterSpeed: 50 });

      const settings = useA2UIStore.getState().settings;
      expect(settings.typewriterSpeed).toBe(50);
      expect(settings.soundEnabled).toBe(true); // unchanged
    });

    it("updates model config", () => {
      useA2UIStore.getState().updateSettings({
        modelConfig: { provider: "openai", model: "gpt-4o" },
      });

      const settings = useA2UIStore.getState().settings;
      expect(settings.modelConfig.provider).toBe("openai");
      expect(settings.modelConfig.model).toBe("gpt-4o");
    });
  });

  describe("layout management", () => {
    it("updates layout partially", () => {
      useA2UIStore.getState().updateLayout({ showEject: true });

      const layout = useA2UIStore.getState().layout;
      expect(layout.showEject).toBe(true);
      expect(layout.showEditor).toBe(true); // unchanged
    });

    it("updates editor width", () => {
      useA2UIStore.getState().updateLayout({ editorWidth: 400 });
      expect(useA2UIStore.getState().layout.editorWidth).toBe(400);
    });
  });
});
