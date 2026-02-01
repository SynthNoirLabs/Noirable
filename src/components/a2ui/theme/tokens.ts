export interface ThemeTokens {
  colors: {
    background: string;
    surface: string;
    text: string;
    muted: string;
    accent: string;
    border: string;
    ink: string;
  };
  fonts: {
    body: string;
    mono: string;
    heading: string;
  };
}

export const noirTokens: ThemeTokens = {
  colors: {
    background: "#0f0f0f", // noir-black
    surface: "#1a1a1a", // noir-dark
    text: "#e0e0e0", // noir-paper
    muted: "#2a2a2a", // noir-gray
    accent: "#ffbf00", // noir-amber
    border: "#2a2a2a", // noir-gray
    ink: "#111111", // noir-ink
  },
  fonts: {
    body: "var(--font-typewriter)",
    mono: "var(--font-mono)",
    heading: "var(--font-sans)",
  },
};

export const standardTokens: ThemeTokens = {
  colors: {
    background: "#ffffff",
    surface: "#f4f4f5", // zinc-100
    text: "#18181b", // zinc-900
    muted: "#71717a", // zinc-500
    accent: "#2563eb", // blue-600
    border: "#e4e4e7", // zinc-200
    ink: "#18181b", // same as text for standard
  },
  fonts: {
    body: "system-ui, -apple-system, sans-serif",
    mono: "ui-monospace, monospace",
    heading: "system-ui, -apple-system, sans-serif",
  },
};
