"use client";

import { useState } from "react";

export interface FileUploadFieldProps {
  /** Allowed MIME types (e.g., ["image/png", "image/jpeg"]) */
  acceptTypes: string[];
  /** Maximum file size in bytes */
  maxSizeBytes: number;
  /** Label for the upload button */
  label?: string;
  /** Called with the uploaded URL on success */
  onUploadSuccess: (url: string) => void;
  /** Optional: current uploaded file URL to display */
  currentUrl?: string;
  /** Optional: callback when the user removes the current file */
  onRemove?: () => void;
  /** Optional: test ID prefix for UI elements */
  testIdPrefix?: string;
}

/**
 * Shared file upload component with type/size validation and unified error handling.
 * Handles the full flow: file selection → validation → POST /api/uploads → callback.
 */
export function FileUploadField({
  acceptTypes,
  maxSizeBytes,
  label = "Click to upload file",
  onUploadSuccess,
  currentUrl,
  onRemove,
  testIdPrefix = "file-upload",
}: FileUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formatSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)}MB`;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Type validation
    if (!acceptTypes.includes(file.type)) {
      const allowed = acceptTypes.map((t) => t.split("/")[1]?.toUpperCase()).join(", ");
      setError(`Invalid file type. Only ${allowed} files are allowed.`);
      setSuccess(null);
      return;
    }

    // Size validation
    if (file.size > maxSizeBytes) {
      setError(`File is too large. Max size is ${formatSize(maxSizeBytes)}.`);
      setSuccess(null);
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      const { url } = await response.json();
      onUploadSuccess(url);
      setSuccess("File uploaded successfully.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong during upload.";
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const acceptString = acceptTypes.join(", ");

  return (
    <div className="space-y-3">
      {currentUrl && onRemove ? (
        <div className="flex flex-col gap-2 p-3 bg-[var(--aesthetic-surface)] border border-[var(--aesthetic-border)] rounded-sm">
          <span
            className="text-xs font-mono text-[var(--aesthetic-text-muted)] truncate"
            data-testid={`${testIdPrefix}-url`}
          >
            Current: {currentUrl}
          </span>
          <button
            onClick={onRemove}
            className="w-full sm:w-auto px-3 py-1.5 text-xs font-mono uppercase tracking-wide bg-[var(--aesthetic-error)] hover:opacity-90 text-[var(--aesthetic-text)] transition-colors rounded-sm"
            data-testid={`remove-${testIdPrefix}`}
          >
            Remove File
          </button>
        </div>
      ) : currentUrl ? (
        <p className="text-xs text-[var(--aesthetic-text-muted)] italic">Current: {currentUrl}</p>
      ) : (
        <p className="text-xs text-[var(--aesthetic-text-muted)] italic">No file uploaded.</p>
      )}

      <div className="flex flex-col gap-2">
        <label className="relative flex items-center justify-center border border-dashed border-[var(--aesthetic-border)] hover:border-[var(--aesthetic-accent)] hover:bg-[var(--aesthetic-surface)] p-6 rounded-sm cursor-pointer transition-all">
          <input
            type="file"
            accept={acceptString}
            onChange={handleFileChange}
            disabled={isUploading}
            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
            data-testid={`${testIdPrefix}-input`}
          />
          <span className="text-sm font-mono text-[var(--aesthetic-text-muted)]">
            {isUploading ? "Uploading..." : `${label} (Max ${formatSize(maxSizeBytes)})`}
          </span>
        </label>
      </div>

      {error && (
        <p
          className="text-xs font-mono text-[var(--aesthetic-error)]"
          data-testid={`${testIdPrefix}-error`}
        >
          {error}
        </p>
      )}
      {success && (
        <p
          className="text-xs font-mono text-[var(--aesthetic-accent)]"
          data-testid={`${testIdPrefix}-success`}
        >
          {success}
        </p>
      )}
    </div>
  );
}
