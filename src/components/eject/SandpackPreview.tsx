"use client";

import { Sandpack, type SandpackTheme } from "@codesandbox/sandpack-react";
import type { A2UIInput } from "@/lib/protocol/schema";
import { exportA2UI } from "@/lib/eject/exportA2UI";
import { useA2UIStore } from "@/lib/store/useA2UIStore";
import { useCustomProfileStore } from "@/lib/store/useCustomProfileStore";
import { getAestheticDefinition } from "@/lib/aesthetic/definitions";

interface SandpackPreviewProps {
  evidence: A2UIInput | null;
}

export function SandpackPreview({ evidence }: SandpackPreviewProps) {
  // Resolve the active aesthetic (same logic as useBaseAestheticId in binding.ts)
  const activeProfile = useCustomProfileStore((state) => {
    if (!state.activeCustomProfileId) return null;
    return state.customProfiles.find((p) => p.id === state.activeCustomProfileId) ?? null;
  });
  const fallbackAestheticId = useA2UIStore((state) => state.settings.aestheticId || "noir");
  const baseAestheticId = activeProfile?.baseAestheticId ?? fallbackAestheticId;

  // Get the active aesthetic colors to theme the Sandpack preview
  const aesthetic = getAestheticDefinition(baseAestheticId);
  const bgColor = aesthetic.theme.colors.background;
  const accentColor = aesthetic.theme.colors.accent;

  if (!evidence) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--aesthetic-text)]/50 font-typewriter text-xs uppercase tracking-wider">
        No evidence to preview
      </div>
    );
  }

  const componentCode = exportA2UI(evidence);

  // Wrap the component in an App.tsx that renders it, using the active aesthetic background
  const appCode = `import { EvidenceComponent } from "./EvidenceComponent";

export default function App() {
  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: "${bgColor}" }}>
      <EvidenceComponent />
    </div>
  );
}`;

  // Build a custom Sandpack theme from the active aesthetic palette
  const customTheme: SandpackTheme = {
    colors: {
      surface1: bgColor,
      surface2: aesthetic.theme.colors.surface,
      surface3: aesthetic.theme.colors.surfaceAlt,
      clickable: accentColor,
      base: aesthetic.theme.colors.text,
      disabled: aesthetic.theme.colors.textMuted,
      hover: accentColor,
      accent: accentColor,
      error: aesthetic.theme.colors.error,
      errorSurface: aesthetic.theme.colors.error + "20",
    },
    syntax: {
      plain: aesthetic.theme.colors.text,
      comment: { color: aesthetic.theme.colors.textMuted, fontStyle: "italic" as const },
      keyword: accentColor,
      tag: accentColor,
      punctuation: aesthetic.theme.colors.textMuted,
      definition: aesthetic.theme.colors.text,
      property: aesthetic.theme.colors.text,
      static: accentColor,
      string: aesthetic.theme.colors.accentMuted,
    },
    font: {
      body: aesthetic.theme.fonts.body,
      mono: aesthetic.theme.fonts.mono,
      size: "13px",
      lineHeight: "20px",
    },
  };

  return (
    <div className="h-full">
      <Sandpack
        template="react-ts"
        theme={customTheme}
        options={{
          showLineNumbers: true,
          showInlineErrors: true,
          editorHeight: "100%",
          externalResources: ["https://cdn.tailwindcss.com"],
        }}
        customSetup={{
          dependencies: {
            react: "^18.0.0",
            "react-dom": "^18.0.0",
          },
        }}
        files={{
          "/App.tsx": appCode,
          "/EvidenceComponent.tsx": componentCode,
        }}
      />
    </div>
  );
}
