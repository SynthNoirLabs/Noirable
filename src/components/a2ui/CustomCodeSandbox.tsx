"use client";

import { SandpackProvider, SandpackPreview } from "@codesandbox/sandpack-react";

interface CustomCodeSandboxProps {
  /** A complete self-contained React component module (default export). */
  code: string;
  /** Sandbox pane height in px. */
  height?: number;
}

/**
 * The catalog ESCAPE HATCH's runtime: model-written React rendered inside the
 * same Sandpack sandbox the eject feature uses — a real iframe boundary, so
 * generated code can be a canvas animation or a custom visualization without
 * touching the host app. Preview-only (no editor pane); Tailwind via CDN to
 * match the eject pipeline's conventions.
 */
export function CustomCodeSandbox({ code, height = 360 }: CustomCodeSandboxProps) {
  const appCode = `import Custom from "./Custom";

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 p-4">
      <Custom />
    </div>
  );
}`;

  return (
    <SandpackProvider
      template="react-ts"
      theme="dark"
      options={{ externalResources: ["https://cdn.tailwindcss.com"] }}
      customSetup={{
        dependencies: {
          react: "^18.0.0",
          "react-dom": "^18.0.0",
        },
      }}
      files={{
        "/App.tsx": appCode,
        "/Custom.tsx": code,
      }}
    >
      <SandpackPreview
        showOpenInCodeSandbox={false}
        showRefreshButton
        style={{ height: `${height}px` }}
      />
    </SandpackProvider>
  );
}

export default CustomCodeSandbox;
