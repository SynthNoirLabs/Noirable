import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProfilePortability } from "./ProfilePortability";
import { saveCustomProfile } from "@/lib/customization/storage";

// Mock framer-motion (just in case)
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Mock stores
const mockCustomProfiles = [
  {
    id: "custom-1" as const,
    name: "Test Profile",
    baseAestheticId: "noir" as const,
    createdAt: 123456789,
    updatedAt: 123456789,
    colors: {},
    fonts: {},
    audio: {},
    voice: {},
    effects: {},
  },
];
const mockLoadProfiles = vi.fn();
const mockSetActiveProfile = vi.fn();
const mockActiveCustomProfileId = "custom-1";

const mockStoreState = {
  customProfiles: mockCustomProfiles,
  activeCustomProfileId: mockActiveCustomProfileId,
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

describe("ProfilePortability", () => {
  let createdElements: HTMLAnchorElement[] = [];
  let exportedBlob: Blob | null = null;
  const mockCreateObjectURL = vi.fn((blob: Blob) => {
    exportedBlob = blob;
    return "blob:url";
  });
  const mockRevokeObjectURL = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    createdElements = [];
    exportedBlob = null;

    vi.stubGlobal("URL", {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    });

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName) => {
      const element = originalCreateElement(tagName);
      if (tagName.toLowerCase() === "a") {
        vi.spyOn(element, "click").mockImplementation(() => {});
        createdElements.push(element as HTMLAnchorElement);
      }
      return element;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders export and import buttons", () => {
    render(<ProfilePortability />);
    expect(screen.getByText("Export JSON")).toBeInTheDocument();
    expect(screen.getByText("Import JSON")).toBeInTheDocument();
  });

  it("triggers file download with correct format during export", async () => {
    render(<ProfilePortability />);
    const exportButton = screen.getByText("Export JSON");
    fireEvent.click(exportButton);

    expect(mockCreateObjectURL).toHaveBeenCalled();
    const aElement = createdElements[0];
    expect(aElement).toBeDefined();
    expect(aElement.download).toMatch(/^synthnoir-profiles-\d{4}-\d{2}-\d{2}\.json$/);
    expect(aElement.click).toHaveBeenCalled();

    // Verify payload schema version, content and structure
    expect(exportedBlob).not.toBeNull();
    if (exportedBlob) {
      const text = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(exportedBlob!);
      });
      const payload = JSON.parse(text);
      expect(payload.schemaVersion).toBe(1);
      expect(payload.activeProfileId).toBe("custom-1");
      expect(payload.profiles).toHaveLength(1);
      expect(payload.profiles[0].id).toBe("custom-1");
      expect(payload.profiles[0].name).toBe("Test Profile");
    }
  });

  it("successfully imports a valid JSON file and updates store and settings", async () => {
    render(<ProfilePortability />);
    const importButton = screen.getByText("Import JSON");
    const fileInput = screen.getByTestId("profile-import-input");

    const validPayload = {
      schemaVersion: 1,
      exportedAt: Date.now(),
      profiles: [
        {
          id: "custom-2",
          name: "Imported Profile",
          baseAestheticId: "minimal",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          colors: {},
        },
      ],
      activeProfileId: "custom-2",
    };

    const file = new File([JSON.stringify(validPayload)], "profiles.json", {
      type: "application/json",
    });

    // Simulate clicking the import button to trigger input click
    fireEvent.click(importButton);

    // Trigger file change event
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(saveCustomProfile).toHaveBeenCalledTimes(1);
      expect(saveCustomProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "custom-2",
          name: "Imported Profile",
        })
      );
      expect(mockLoadProfiles).toHaveBeenCalled();
      expect(mockSetActiveProfile).toHaveBeenCalledWith("custom-2");
      expect(mockUpdateSettings).toHaveBeenCalledWith({ aestheticId: "custom-2" });
      expect(screen.getByTestId("portability-success")).toHaveTextContent(
        "Imported 1 profile(s) successfully!"
      );
    });
  });

  it("fails validation and shows detailed error messages on invalid JSON schema", async () => {
    render(<ProfilePortability />);
    const fileInput = screen.getByTestId("profile-import-input");

    const invalidPayload = {
      schemaVersion: 2, // Invalid schema version (must be 1)
      exportedAt: Date.now(),
      profiles: [
        {
          id: "invalid-id-no-custom-prefix", // Must start with custom-
          name: "", // Cannot be empty
          baseAestheticId: "invalid-aesthetic", // Invalid enum value
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
    };

    const file = new File([JSON.stringify(invalidPayload)], "invalid.json", {
      type: "application/json",
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(saveCustomProfile).not.toHaveBeenCalled();
      expect(mockLoadProfiles).not.toHaveBeenCalled();
      const errorDiv = screen.getByTestId("portability-error");
      expect(errorDiv).toBeInTheDocument();
      expect(errorDiv.textContent).toContain("Validation failed:");
      expect(errorDiv.textContent).toContain("schemaVersion");
      expect(errorDiv.textContent).toContain("id");
      expect(errorDiv.textContent).toContain("name");
      expect(errorDiv.textContent).toContain("baseAestheticId");
    });
  });
});
