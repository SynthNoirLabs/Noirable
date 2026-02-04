import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProfileSelector } from "./ProfileSelector";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Mock stores
const mockCustomProfiles: Array<{ id: string; name: string; baseAestheticId: string }> = [];
const mockCreateProfile = vi.fn(() => ({ id: "custom-new", name: "New Profile" }));
const mockDeleteProfile = vi.fn();
const mockCloneProfile = vi.fn(() => ({ id: "custom-clone", name: "Clone" }));
const mockSetActiveProfile = vi.fn();
const mockUpdateSettings = vi.fn();

vi.mock("@/lib/store/useCustomProfileStore", () => ({
  useCustomProfileStore: () => ({
    customProfiles: mockCustomProfiles,
    createProfile: mockCreateProfile,
    deleteProfile: mockDeleteProfile,
    cloneProfile: mockCloneProfile,
    setActiveProfile: mockSetActiveProfile,
    activeCustomProfileId: null,
  }),
}));

vi.mock("@/lib/store/useA2UIStore", () => ({
  useA2UIStore: () => ({
    settings: { aestheticId: "noir" },
    updateSettings: mockUpdateSettings,
  }),
}));

vi.mock("@/lib/aesthetic/types", () => ({
  isBuiltInAestheticId: (id: string) => id === "noir" || id === "minimal",
}));

describe("ProfileSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCustomProfiles.length = 0;
  });

  it("renders current profile name", () => {
    render(<ProfileSelector />);
    expect(screen.getByText("Noir Detective")).toBeInTheDocument();
  });

  it("opens dropdown on click", () => {
    render(<ProfileSelector />);
    fireEvent.click(screen.getByText("Noir Detective"));
    expect(screen.getByText("Built-in")).toBeInTheDocument();
  });

  it("shows built-in profiles", () => {
    render(<ProfileSelector />);
    fireEvent.click(screen.getByText("Noir Detective"));
    expect(screen.getByText("Minimal")).toBeInTheDocument();
  });

  it("selects a different profile", () => {
    render(<ProfileSelector />);
    fireEvent.click(screen.getByText("Noir Detective"));
    fireEvent.click(screen.getByText("Minimal"));
    expect(mockUpdateSettings).toHaveBeenCalledWith({ aestheticId: "minimal" });
  });

  it("shows create new profile button", () => {
    render(<ProfileSelector />);
    fireEvent.click(screen.getByText("Noir Detective"));
    expect(screen.getByText("Create New Profile")).toBeInTheDocument();
  });

  it("opens new profile dialog", () => {
    render(<ProfileSelector />);
    fireEvent.click(screen.getByText("Noir Detective"));
    fireEvent.click(screen.getByText("Create New Profile"));
    expect(screen.getByPlaceholderText("Profile name...")).toBeInTheDocument();
  });

  it("creates new profile", () => {
    render(<ProfileSelector />);
    fireEvent.click(screen.getByText("Noir Detective"));
    fireEvent.click(screen.getByText("Create New Profile"));

    const input = screen.getByPlaceholderText("Profile name...");
    fireEvent.change(input, { target: { value: "My Theme" } });
    fireEvent.click(screen.getByText("Create"));

    expect(mockCreateProfile).toHaveBeenCalledWith("My Theme", "noir");
  });

  it("shows custom profiles when available", () => {
    mockCustomProfiles.push({ id: "custom-1", name: "Custom Theme", baseAestheticId: "noir" });
    render(<ProfileSelector />);
    fireEvent.click(screen.getByText("Noir Detective"));
    expect(screen.getByText("Custom Theme")).toBeInTheDocument();
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });
});
