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

describe("ProfilePortability - Empirical Challenges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("handles empty files gracefully by failing parsing", async () => {
    render(<ProfilePortability />);
    const fileInput = screen.getByTestId("profile-import-input");

    const file = new File([""], "empty.json", {
      type: "application/json",
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(saveCustomProfile).not.toHaveBeenCalled();
      expect(mockLoadProfiles).not.toHaveBeenCalled();
      const errorDiv = screen.getByTestId("portability-error");
      expect(errorDiv).toBeInTheDocument();
      expect(errorDiv.textContent).toContain("Failed to import:");
    });
  });

  it("handles corrupt JSON files gracefully by failing parsing", async () => {
    render(<ProfilePortability />);
    const fileInput = screen.getByTestId("profile-import-input");

    const file = new File(["{ schemaVersion: 1,"], "corrupt.json", {
      type: "application/json",
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(saveCustomProfile).not.toHaveBeenCalled();
      expect(mockLoadProfiles).not.toHaveBeenCalled();
      const errorDiv = screen.getByTestId("portability-error");
      expect(errorDiv).toBeInTheDocument();
      expect(errorDiv.textContent).toContain("Failed to import:");
    });
  });

  it("handles schema version mismatch gracefully (schemaVersion 2)", async () => {
    render(<ProfilePortability />);
    const fileInput = screen.getByTestId("profile-import-input");

    const invalidPayload = {
      schemaVersion: 2, // version mismatch, must be 1
      exportedAt: Date.now(),
      profiles: [],
    };

    const file = new File([JSON.stringify(invalidPayload)], "version_mismatch.json", {
      type: "application/json",
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(saveCustomProfile).not.toHaveBeenCalled();
      expect(mockLoadProfiles).not.toHaveBeenCalled();
      const errorDiv = screen.getByTestId("portability-error");
      expect(errorDiv).toBeInTheDocument();
      expect(errorDiv.textContent).toContain("Validation failed: schemaVersion");
    });
  });

  it("handles missing required properties gracefully", async () => {
    render(<ProfilePortability />);
    const fileInput = screen.getByTestId("profile-import-input");

    const invalidPayload = {
      schemaVersion: 1,
      // missing exportedAt and profiles
    };

    const file = new File([JSON.stringify(invalidPayload)], "missing_props.json", {
      type: "application/json",
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(saveCustomProfile).not.toHaveBeenCalled();
      expect(mockLoadProfiles).not.toHaveBeenCalled();
      const errorDiv = screen.getByTestId("portability-error");
      expect(errorDiv).toBeInTheDocument();
      expect(errorDiv.textContent).toContain("Validation failed:");
      expect(errorDiv.textContent).toContain("exportedAt");
      expect(errorDiv.textContent).toContain("profiles");
    });
  });

  it("handles invalid profile schema nested in file", async () => {
    render(<ProfilePortability />);
    const fileInput = screen.getByTestId("profile-import-input");

    const invalidPayload = {
      schemaVersion: 1,
      exportedAt: Date.now(),
      profiles: [
        {
          id: "custom-invalid-profile-missing-name-and-base-aesthetic",
          // name and baseAestheticId are missing
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
    };

    const file = new File([JSON.stringify(invalidPayload)], "invalid_profile_schema.json", {
      type: "application/json",
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(saveCustomProfile).not.toHaveBeenCalled();
      expect(mockLoadProfiles).not.toHaveBeenCalled();
      const errorDiv = screen.getByTestId("portability-error");
      expect(errorDiv).toBeInTheDocument();
      expect(errorDiv.textContent).toContain("Validation failed: profiles.0.name");
      expect(errorDiv.textContent).toContain("profiles.0.baseAestheticId");
    });
  });

  it("handles activeProfileId mismatch where activeProfileId is not in the imported list", async () => {
    render(<ProfilePortability />);
    const fileInput = screen.getByTestId("profile-import-input");

    const payload = {
      schemaVersion: 1,
      exportedAt: Date.now(),
      profiles: [
        {
          id: "custom-import-id-1",
          name: "Imported Profile 1",
          baseAestheticId: "noir",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      activeProfileId: "custom-mismatch-id", // Mismatch! Not in profiles
    };

    const file = new File([JSON.stringify(payload)], "active_profile_mismatch.json", {
      type: "application/json",
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      // It should save the profile
      expect(saveCustomProfile).toHaveBeenCalledTimes(1);
      expect(saveCustomProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "custom-import-id-1",
          name: "Imported Profile 1",
        })
      );
      // But it should NOT update active profile or settings
      expect(mockSetActiveProfile).not.toHaveBeenCalled();
      expect(mockUpdateSettings).not.toHaveBeenCalled();
      // It should still report success because profiles were loaded
      expect(screen.getByTestId("portability-success")).toHaveTextContent(
        "Imported 1 profile(s) successfully!"
      );
    });
  });

  it("handles very large profile payloads (stress testing)", async () => {
    render(<ProfilePortability />);
    const fileInput = screen.getByTestId("profile-import-input");

    // Let's generate a very large set of profiles (e.g. 50 profiles)
    const largeProfiles = Array.from({ length: 50 }, (_, i) => ({
      id: `custom-large-${i}`,
      name: `Large Profile Name ${i}`.padEnd(40, "x"), // fill some space
      description: `Large Profile Description ${i}`.padEnd(150, "y"),
      baseAestheticId: "noir" as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      colors: {
        background: "#000000",
        surface: "#111111",
        text: "#eeeeee",
        accent: "#ff3333",
      },
    }));

    const payload = {
      schemaVersion: 1,
      exportedAt: Date.now(),
      profiles: largeProfiles,
      activeProfileId: "custom-large-0",
    };

    const file = new File([JSON.stringify(payload)], "large_profiles.json", {
      type: "application/json",
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(saveCustomProfile).toHaveBeenCalledTimes(50);
      expect(mockLoadProfiles).toHaveBeenCalled();
      expect(mockSetActiveProfile).toHaveBeenCalledWith("custom-large-0");
      expect(mockUpdateSettings).toHaveBeenCalledWith({ aestheticId: "custom-large-0" });
      expect(screen.getByTestId("portability-success")).toHaveTextContent(
        "Imported 50 profile(s) successfully!"
      );
    });
  });
});
