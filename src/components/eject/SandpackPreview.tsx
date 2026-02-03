"use client";

import React from "react";
import { Sandpack } from "@codesandbox/sandpack-react";
import type { A2UIInput } from "@/lib/protocol/schema";
import { exportA2UI } from "@/lib/eject/exportA2UI";

interface SandpackPreviewProps {
  evidence: A2UIInput | null;
}

export function SandpackPreview({ evidence }: SandpackPreviewProps) {
  if (!evidence) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--aesthetic-text)]/50 font-typewriter text-xs uppercase tracking-wider">
        No evidence to preview
      </div>
    );
  }

  const componentCode = exportA2UI(evidence);

  // Wrap the component in an App.tsx that renders it
  const appCode = `import { EvidenceComponent } from "./EvidenceComponent";

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-900 p-8">
      <EvidenceComponent />
    </div>
  );
}`;

  return (
    <div className="h-full">
      <Sandpack
        template="react-ts"
        theme="dark"
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
