import { describe, it, expect, beforeEach } from "vitest";
import { useA2UIStore, type EvidenceEntry } from "./useA2UIStore";

describe("useA2UIStore", () => {
  beforeEach(() => {
    // Reset store to initial state
    useA2UIStore.setState({
      evidence: null,
      evidenceHistory: [],
      activeEvidenceId: null,
      undoStack: [],
      redoStack: [],
      promptHistory: [],
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
        aestheticId: "noir",
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
      expect(settings.ambient.rainEnabled).toBe(true); // unchanged
    });

    it("updates ambient settings partially", () => {
      useA2UIStore.getState().updateSettings({
        ambient: { crackleVolume: 0.8 },
      });

      const settings = useA2UIStore.getState().settings;
      expect(settings.ambient.crackleVolume).toBe(0.8);
      expect(settings.ambient.rainEnabled).toBe(true); // unchanged
      expect(settings.ambient.rainVolume).toBe(1); // unchanged
      expect(settings.ambient.fogEnabled).toBe(true); // unchanged
    });

    it("updates rain volume", () => {
      useA2UIStore.getState().updateSettings({
        ambient: { rainVolume: 0.42 },
      });

      const settings = useA2UIStore.getState().settings;
      expect(settings.ambient.rainVolume).toBe(0.42);
    });

    it("updates model config", () => {
      useA2UIStore.getState().updateSettings({
        modelConfig: { provider: "openai", model: "gpt-4o" },
      });

      const settings = useA2UIStore.getState().settings;
      expect(settings.modelConfig.provider).toBe("openai");
      expect(settings.modelConfig.model).toBe("gpt-4o");
    });

    it("updates aestheticId", () => {
      expect(useA2UIStore.getState().settings.aestheticId).toBe("noir");

      useA2UIStore.getState().updateSettings({ aestheticId: "minimal" });

      const settings = useA2UIStore.getState().settings;
      expect(settings.aestheticId).toBe("minimal");
      // Other settings unchanged
      expect(settings.soundEnabled).toBe(true);
      expect(settings.ambient.rainEnabled).toBe(true);
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

  describe("undo/redo", () => {
    it("initially has empty undo/redo stacks", () => {
      expect(useA2UIStore.getState().canUndo()).toBe(false);
      expect(useA2UIStore.getState().canRedo()).toBe(false);
    });

    it("pushes state to undo stack", () => {
      const evidence = {
        type: "text" as const,
        content: "Test",
        priority: "normal" as const,
      };
      useA2UIStore.getState().setEvidence(evidence);
      useA2UIStore.getState().pushUndoState();

      expect(useA2UIStore.getState().canUndo()).toBe(true);
      expect(useA2UIStore.getState().undoStack).toHaveLength(1);
    });

    it("undoes to previous state", () => {
      const evidence1 = {
        type: "text" as const,
        content: "First",
        priority: "normal" as const,
      };
      const evidence2 = {
        type: "text" as const,
        content: "Second",
        priority: "normal" as const,
      };

      useA2UIStore.getState().setEvidence(evidence1);
      useA2UIStore.getState().pushUndoState();
      useA2UIStore.getState().setEvidence(evidence2);

      expect(useA2UIStore.getState().evidence).toEqual(evidence2);

      useA2UIStore.getState().undo();

      expect(useA2UIStore.getState().evidence).toEqual(evidence1);
      expect(useA2UIStore.getState().canRedo()).toBe(true);
    });

    it("redoes to next state", () => {
      const evidence1 = {
        type: "text" as const,
        content: "First",
        priority: "normal" as const,
      };
      const evidence2 = {
        type: "text" as const,
        content: "Second",
        priority: "normal" as const,
      };

      useA2UIStore.getState().setEvidence(evidence1);
      useA2UIStore.getState().pushUndoState();
      useA2UIStore.getState().setEvidence(evidence2);
      useA2UIStore.getState().undo();
      useA2UIStore.getState().redo();

      expect(useA2UIStore.getState().evidence).toEqual(evidence2);
    });

    it("clears redo stack on new push", () => {
      const evidence1 = {
        type: "text" as const,
        content: "First",
        priority: "normal" as const,
      };
      const evidence2 = {
        type: "text" as const,
        content: "Second",
        priority: "normal" as const,
      };
      const evidence3 = {
        type: "text" as const,
        content: "Third",
        priority: "normal" as const,
      };

      useA2UIStore.getState().setEvidence(evidence1);
      useA2UIStore.getState().pushUndoState();
      useA2UIStore.getState().setEvidence(evidence2);
      useA2UIStore.getState().undo();

      expect(useA2UIStore.getState().canRedo()).toBe(true);

      // New action should clear redo
      useA2UIStore.getState().pushUndoState();
      useA2UIStore.getState().setEvidence(evidence3);

      expect(useA2UIStore.getState().canRedo()).toBe(false);
    });
  });

  describe("prompt history", () => {
    it("adds prompts to history", () => {
      useA2UIStore.getState().addPrompt("Create a card");

      const history = useA2UIStore.getState().promptHistory;
      expect(history).toHaveLength(1);
      expect(history[0].text).toBe("Create a card");
      expect(history[0].id).toBeDefined();
      expect(history[0].createdAt).toBeDefined();
    });

    it("adds prompt with evidence id", () => {
      useA2UIStore.getState().addPrompt("Create a card", "evidence-123");

      const history = useA2UIStore.getState().promptHistory;
      expect(history[0].evidenceId).toBe("evidence-123");
    });

    it("clears prompt history", () => {
      useA2UIStore.getState().addPrompt("First prompt");
      useA2UIStore.getState().addPrompt("Second prompt");
      useA2UIStore.getState().clearPromptHistory();

      expect(useA2UIStore.getState().promptHistory).toHaveLength(0);
    });

    it("preserves multiple prompts in order", () => {
      useA2UIStore.getState().addPrompt("First");
      useA2UIStore.getState().addPrompt("Second");
      useA2UIStore.getState().addPrompt("Third");

      const history = useA2UIStore.getState().promptHistory;
      expect(history).toHaveLength(3);
      expect(history[0].text).toBe("First");
      expect(history[1].text).toBe("Second");
      expect(history[2].text).toBe("Third");
    });
  });
});
