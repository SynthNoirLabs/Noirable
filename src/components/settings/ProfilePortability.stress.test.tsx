import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProfilePortability } from "./ProfilePortability";
import { saveCustomProfile } from "@/lib/customization/storage";

// Mock stores
const mockLoadProfiles = vi.fn();
const mockSetActiveProfile = vi.fn();

const mockStoreState = {
  customProfiles: [],
  activeCustomProfileId: null,
  loadProfiles: mockLoadProfiles,
  setActiveProfile: mockSetActiveProfile,
};

vi.mock("@/lib/store/useCustomProfileStore", () => ({
  useCustomProfileStore: Object.assign(
    (selector?: (state: typeof mockStoreState) => unknown) => {
      if (selector) return selector(mockStoreState);
      return mockStoreState;
    },
    {
      getState: () => mockStoreState,
      subscribe: vi.fn(),
    }
  ),
}));

const mockUpdateSettings = vi.fn();
const mockSettingsState = {
  settings: { aestheticId: "noir" },
  updateSettings: mockUpdateSettings,
};

vi.mock("@/lib/store/useA2UIStore", () => ({
  useA2UIStore: Object.assign(
    (selector?: (state: typeof mockSettingsState) => unknown) => {
      if (selector) return selector(mockSettingsState);
      return mockSettingsState;
    },
    {
      getState: () => mockSettingsState,
      subscribe: vi.fn(),
    }
  ),
}));

vi.mock("@/lib/customization/storage", () => ({
  saveCustomProfile: vi.fn(),
}));

describe("ProfilePortability Stress Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const triggerImport = (fileContent: string, fileName = "profiles.json") => {
    render(<ProfilePortability />);
    const fileInput = screen.getByTestId("profile-import-input");
    const file = new File([fileContent], fileName, { type: "application/json" });
    fireEvent.change(fileInput, { target: { files: [file] } });
  };

  it("handles corrupt/invalid JSON file gracefully", async () => {
    triggerImport("{ corrupt json: [ }");

    await waitFor(() => {
      expect(saveCustomProfile).not.toHaveBeenCalled();
      const errorDiv = screen.getByTestId("portability-error");
      expect(errorDiv).toBeInTheDocument();
      expect(errorDiv.textContent).toContain("Failed to import:");
    });
  });

  it("handles empty files gracefully", async () => {
    triggerImport("");

    await waitFor(() => {
      expect(saveCustomProfile).not.toHaveBeenCalled();
      const errorDiv = screen.getByTestId("portability-error");
      expect(errorDiv).toBeInTheDocument();
      expect(errorDiv.textContent).toContain("Failed to import:");
    });
  });

  it("handles missing required properties in JSON", async () => {
    // Missing schemaVersion and profiles
    const invalidPayload = {
      exportedAt: Date.now(),
    };
    triggerImport(JSON.stringify(invalidPayload));

    await waitFor(() => {
      expect(saveCustomProfile).not.toHaveBeenCalled();
      const errorDiv = screen.getByTestId("portability-error");
      expect(errorDiv).toBeInTheDocument();
      expect(errorDiv.textContent).toContain("Validation failed:");
      expect(errorDiv.textContent).toContain("schemaVersion");
      expect(errorDiv.textContent).toContain("profiles");
    });
  });

  it("handles schema version mismatch", async () => {
    const invalidPayload = {
      schemaVersion: 2, // Unsupported schema version
      exportedAt: Date.now(),
      profiles: [],
    };
    triggerImport(JSON.stringify(invalidPayload));

    await waitFor(() => {
      expect(saveCustomProfile).not.toHaveBeenCalled();
      const errorDiv = screen.getByTestId("portability-error");
      expect(errorDiv).toBeInTheDocument();
      expect(errorDiv.textContent).toContain("Validation failed:");
      expect(errorDiv.textContent).toContain("schemaVersion");
    });
  });

  it("handles activeProfileId mismatch (id not in imported profiles)", async () => {
    const payload = {
      schemaVersion: 1,
      exportedAt: Date.now(),
      profiles: [
        {
          id: "custom-import-1",
          name: "Imported Profile",
          baseAestheticId: "noir",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      activeProfileId: "custom-different-id", // Mismatched active profile ID
    };
    triggerImport(JSON.stringify(payload));

    await waitFor(() => {
      expect(saveCustomProfile).toHaveBeenCalledTimes(1);
      expect(mockLoadProfiles).toHaveBeenCalled();
      // Should NOT set active profile or update settings because of the mismatch
      expect(mockSetActiveProfile).not.toHaveBeenCalled();
      expect(mockUpdateSettings).not.toHaveBeenCalled();
      expect(screen.getByTestId("portability-success")).toHaveTextContent(
        "Imported 1 profile(s) successfully!"
      );
    });
  });

  it("fails validation if profile id does not start with custom-", async () => {
    const payload = {
      schemaVersion: 1,
      exportedAt: Date.now(),
      profiles: [
        {
          id: "not-prefixed-with-custom",
          name: "Imported Profile",
          baseAestheticId: "noir",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
    };
    triggerImport(JSON.stringify(payload));

    await waitFor(() => {
      expect(saveCustomProfile).not.toHaveBeenCalled();
      const errorDiv = screen.getByTestId("portability-error");
      expect(errorDiv).toBeInTheDocument();
      expect(errorDiv.textContent).toContain("Validation failed:");
      expect(errorDiv.textContent).toContain("profiles.0.id");
    });
  });

  it("fails validation if name is empty or too long", async () => {
    const payloadEmptyName = {
      schemaVersion: 1,
      exportedAt: Date.now(),
      profiles: [
        {
          id: "custom-p1",
          name: "", // Too short
          baseAestheticId: "noir",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
    };
    triggerImport(JSON.stringify(payloadEmptyName));

    await waitFor(() => {
      const errorDiv = screen.getByTestId("portability-error");
      expect(errorDiv).toBeInTheDocument();
      expect(errorDiv.textContent).toContain("profiles.0.name: Too small");
    });
  });

  it("fails validation if name is too long", async () => {
    const payloadTooLongName = {
      schemaVersion: 1,
      exportedAt: Date.now(),
      profiles: [
        {
          id: "custom-p1",
          name: "a".repeat(51), // Too long (> 50 chars)
          baseAestheticId: "noir",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
    };
    triggerImport(JSON.stringify(payloadTooLongName));

    await waitFor(() => {
      const errorDiv = screen.getByTestId("portability-error");
      expect(errorDiv).toBeInTheDocument();
      expect(errorDiv.textContent).toContain("profiles.0.name: Too big");
    });
  });

  it("handles very large payloads (many profiles) successfully", async () => {
    const largeProfiles = Array.from({ length: 200 }, (_, i) => ({
      id: `custom-large-${i}`,
      name: `Profile ${i}`,
      baseAestheticId: "noir" as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    const payload = {
      schemaVersion: 1,
      exportedAt: Date.now(),
      profiles: largeProfiles,
    };

    triggerImport(JSON.stringify(payload));

    await waitFor(() => {
      expect(saveCustomProfile).toHaveBeenCalledTimes(200);
      expect(mockLoadProfiles).toHaveBeenCalled();
      expect(screen.getByTestId("portability-success")).toHaveTextContent(
        "Imported 200 profile(s) successfully!"
      );
    });
  });
});
