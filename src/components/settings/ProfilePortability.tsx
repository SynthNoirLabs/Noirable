"use client";

import { useState, useRef } from "react";
import { Download, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { useCustomProfileStore } from "@/lib/store/useCustomProfileStore";
import { useA2UIStore } from "@/lib/store/useA2UIStore";
import { exportedSettingsSchema } from "@/lib/customization/types";
import { saveCustomProfile } from "@/lib/customization/storage";
import type { CustomProfileId } from "@/lib/aesthetic/types";

export function ProfilePortability() {
  const { customProfiles, activeCustomProfileId, loadProfiles, setActiveProfile } =
    useCustomProfileStore();
  const { updateSettings } = useA2UIStore();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const payload = {
        schemaVersion: 1 as const,
        exportedAt: Date.now(),
        profiles: customProfiles,
        activeProfileId: activeCustomProfileId || undefined,
      };

      // Validate payload before exporting to ensure it conforms to the schema
      const validation = exportedSettingsSchema.safeParse(payload);
      if (!validation.success) {
        const errors = validation.error.issues.map((err) => {
          const path = err.path.join(".");
          return path ? `${path}: ${err.message}` : err.message;
        });
        setErrorMessage(`Failed to export: validation error - ${errors.join("; ")}`);
        setSuccessMessage(null);
        return;
      }

      const jsonStr = JSON.stringify(validation.data, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      link.href = url;
      link.download = `synthnoir-profiles-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMessage("Profiles exported successfully!");
      setErrorMessage(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setErrorMessage(`Failed to export: ${msg}`);
      setSuccessMessage(null);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== "string") {
          throw new Error("Could not read file content");
        }

        const parsed = JSON.parse(text);
        const validation = exportedSettingsSchema.safeParse(parsed);

        if (!validation.success) {
          const errors = validation.error.issues.map((err) => {
            const path = err.path.join(".");
            return path ? `${path}: ${err.message}` : err.message;
          });
          setErrorMessage(`Validation failed: ${errors.join("; ")}`);
          setSuccessMessage(null);
          return;
        }

        const { profiles, activeProfileId } = validation.data;

        // Save each profile using saveCustomProfile
        for (const profile of profiles) {
          saveCustomProfile(profile);
        }

        // Reload the store
        loadProfiles();

        // Update the active profile if present and matching
        if (activeProfileId) {
          const matchingProfile = profiles.find((p) => p.id === activeProfileId);
          if (matchingProfile) {
            setActiveProfile(activeProfileId as CustomProfileId);
            updateSettings({ aestheticId: matchingProfile.id });
          }
        }

        setSuccessMessage(`Imported ${profiles.length} profile(s) successfully!`);
        setErrorMessage(null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Invalid JSON format";
        setErrorMessage(`Failed to import: ${msg}`);
        setSuccessMessage(null);
      } finally {
        // Reset file input value so the same file can be imported again if needed
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };

    reader.onerror = () => {
      setErrorMessage("Failed to read file.");
      setSuccessMessage(null);
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--aesthetic-text)]">
          Profile Portability
        </h3>
        <p className="text-[11px] font-mono text-[var(--aesthetic-text-muted)] leading-relaxed">
          Export your custom profiles to a JSON file or import them from another device.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={handleExport}
          data-testid="profile-export-button"
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono uppercase tracking-wider border border-[var(--aesthetic-accent)] text-[var(--aesthetic-accent)] hover:bg-[var(--aesthetic-accent)]/10 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]"
        >
          <Download className="w-3.5 h-3.5" />
          Export JSON
        </button>

        <button
          onClick={handleImportClick}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono uppercase tracking-wider border border-[var(--aesthetic-text)]/30 text-[var(--aesthetic-text)] hover:bg-[var(--aesthetic-text)]/5 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]"
        >
          <Upload className="w-3.5 h-3.5" />
          Import JSON
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="hidden"
          data-testid="profile-import-input"
        />
      </div>

      {successMessage && (
        <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-sm text-green-500 font-mono text-[11px] leading-relaxed">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span data-testid="portability-success">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-2 p-3 bg-[var(--aesthetic-error)]/10 border border-[var(--aesthetic-error)]/30 rounded-sm text-[var(--aesthetic-error)] font-mono text-[11px] leading-relaxed">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span data-testid="portability-error">{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
