"use client";

import { SandpackProvider, SandpackPreview } from "@codesandbox/sandpack-react";

/** The world palette/tokens the sandbox paints itself with, so a foreign widget
 *  reads as part of the current theme rather than a stock dark box. */
export interface SandboxTheme {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  accent: string;
  accentMuted: string;
  border: string;
  radius: string;
}

interface CustomCodeSandboxProps {
  /** A complete self-contained React component module (default export). */
  code: string;
  /** Sandbox pane height in px. */
  height?: number;
  /** Active world theme, injected as `--aesthetic-*` CSS vars inside the frame. */
  theme?: SandboxTheme;
}

const DEFAULT_THEME: SandboxTheme = {
  background: "#0f0f0f",
  surface: "#1a1a1a",
  surfaceAlt: "#2a2a2a",
  text: "#e0e0e0",
  textMuted: "#a0a0a0",
  accent: "#ffbf00",
  accentMuted: "#b5a642",
  border: "#2a2a2a",
  radius: "2px",
};

/**
 * The catalog ESCAPE HATCH's runtime: model-written React rendered inside the
 * same Sandpack sandbox the eject feature uses — a real iframe boundary, so
 * generated code can be a canvas animation or a custom visualization without
 * touching the host app. Preview-only (no editor pane); Tailwind via CDN.
 *
 * The active world's palette is injected into the iframe as `--aesthetic-*` CSS
 * variables (plus a themed `<body>` background/text), so a generated widget can
 * paint itself in the current theme with `bg-[var(--aesthetic-surface)]` etc.,
 * and a widget that uses no theme still sits on the world's background instead
 * of a stock dark box.
 */
export function CustomCodeSandbox({ code, height = 520, theme }: CustomCodeSandboxProps) {
  const t = theme ?? DEFAULT_THEME;

  // World CSS vars + a themed body, injected via a <style> rendered INSIDE the
  // App component (not a custom index.html — whether the react-ts template honors
  // a custom index.html is version-dependent; App.tsx always renders). So a
  // generated widget can paint with `bg-[var(--aesthetic-surface)]` etc., and a
  // widget that uses no theme still sits on the world's background. No forced
  // min-height: the widget sizes to its content and the host frame (set
  // generously below) shows it without an inner scrollbar.
  const themeCss = `
    :root {
      --aesthetic-background: ${t.background};
      --aesthetic-surface: ${t.surface};
      --aesthetic-surface-alt: ${t.surfaceAlt};
      --aesthetic-text: ${t.text};
      --aesthetic-text-muted: ${t.textMuted};
      --aesthetic-accent: ${t.accent};
      --aesthetic-accent-muted: ${t.accentMuted};
      --aesthetic-border: ${t.border};
      --aesthetic-radius: ${t.radius};
    }
    html, body, #root { background: ${t.background}; color: ${t.text}; margin: 0; }
  `;

  // JSON.stringify the CSS so it embeds safely as a JS string literal in the
  // generated module (escapes quotes/newlines).
  const appCode = `import Custom from "./Custom";

const THEME_CSS = ${JSON.stringify(themeCss)};

export default function App() {
  return (
    <div className="p-4" style={{ background: "var(--aesthetic-background)", color: "var(--aesthetic-text)" }}>
      <style dangerouslySetInnerHTML={{ __html: THEME_CSS }} />
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
        showRefreshButton={true}
        showRestartButton={true}
        style={{ height: `${height}px` }}
      />
    </SandpackProvider>
  );
}

export default CustomCodeSandbox;
