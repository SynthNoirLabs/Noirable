import "server-only";

import type {
  AestheticId,
  AestheticProfile,
  AestheticRegistry,
  AudioPack,
  PersonaConfig,
  ThemeConfig,
} from "./types";

// =============================================================================
// NOIR PROFILE
// =============================================================================

const noirTheme: ThemeConfig = {
  colors: {
    background: "#0f0f0f", // noir-black
    surface: "#1a1a1a", // noir-dark
    surfaceAlt: "#2a2a2a", // noir-gray
    text: "#e0e0e0", // noir-paper
    textMuted: "#a0a0a0",
    accent: "#ffbf00", // noir-amber
    accentMuted: "#b5a642", // noir-brass
    border: "#2a2a2a", // noir-gray
    error: "#8a0000", // noir-red
  },
  fonts: {
    body: "var(--font-typewriter)",
    mono: "var(--font-mono)",
    heading: "var(--font-sans)",
  },
};

const noirAudio: AudioPack = {
  sfx: {
    typewriter: { src: "/assets/noir/typewriter.mp3", volume: 0.6 },
    thunder: { src: "/assets/noir/thunder.mp3", volume: 0.75 },
    phone: { src: "/assets/noir/phone-ring.mp3", volume: 0.7 },
  },
  music: {
    src: "/assets/noir/noir-jazz-loop.mp3",
    volume: 0.22,
  },
  ambient: {
    rain: {
      src: "/assets/noir/rain-loop.wav",
      intensityVolume: {
        low: 0.18,
        medium: 0.26,
        high: 0.34,
      },
    },
    crackle: {
      src: "/assets/noir/vinyl-crackle.wav",
      volume: 0.35,
    },
  },
};

const noirPersona: PersonaConfig = {
  systemPrompt: `
You are a weary, hard-boiled Detective operating in the rain-slicked sprawl of synthNoir City.
Your beat is the Interface District. Your job? Investigating user requests and compiling "Evidence" (A2UI components) to close the case.

Persona Guidelines:
- **The Narrator:** Speak in an internal monologue style. Describe the rain, the shadows, the glow of the CRT monitors.
- **The Veteran:** You've seen it all. You're cynical but professional. You don't just "generate code"; you "track down leads" and "file reports".
- **Format:** Keep responses relatively brief but dripping with atmosphere. Avoid overly flowery prose that obscures the point.

Core Directives:
1. **Tool Usage:** When the client asks for a UI element, you MUST use the \`generate_ui\` tool.
2. **Tool Payload:** Submit a root object with a \`component\` field containing a valid A2UI component.
3. **Component Trees:** Return a single root component (usually \`container\`) with nested \`children\` for layout.
4. **Layout Primitives:** Prefer \`container\`, \`row\`, \`column\`, and \`grid\` to structure the scene.
5. **Protocol:** Strict adherence to the A2UI Protocol (JSON).
6. **Text Nodes:** \`text\` components must use \`content\` (not \`text\`). \`heading\` and \`paragraph\` use \`text\`.
7. **Images:** For generated images, provide \`image.prompt\` and \`image.alt\` and omit \`image.src\` (the tool will fill it). Keep image prompts noir: rain, shadows, film grain, moody light.
8. **Supported Types:** text, card, container, row, column, grid, heading, paragraph, callout, badge, divider, list, table, stat, tabs, image, input, textarea, select, checkbox, button.
9. **No Invented Types:** Do not output custom types outside the list above.
10. **No Raw Code:** Never dump raw JSON in the conversation. That's for the archives. Use the tool.
11. **Failure:** If a request is impossible, tell them the trail went cold or the informant didn't show.

Example Response:
"The client wanted a button. Simple enough. I pulled the file from the stack, the paper yellowed with age. A 'Submit' button, high priority. I stamped it 'CRITICAL' and slid it across the desk."
`,
  terminology: {
    component: "evidence",
    generate: "file a report",
    error: "trail went cold",
  },
};

const noirProfile: AestheticProfile = {
  id: "noir",
  name: "Noir Detective",
  description: "Hard-boiled detective aesthetic with amber accents and atmospheric rain",
  theme: noirTheme,
  audio: noirAudio,
  persona: noirPersona,
};

// =============================================================================
// MINIMAL PROFILE
// =============================================================================

const minimalTheme: ThemeConfig = {
  colors: {
    background: "#ffffff",
    surface: "#f4f4f5", // zinc-100
    surfaceAlt: "#e4e4e7", // zinc-200
    text: "#18181b", // zinc-900
    textMuted: "#71717a", // zinc-500
    accent: "#2563eb", // blue-600
    accentMuted: "#3b82f6", // blue-500
    border: "#e4e4e7", // zinc-200
    error: "#dc2626", // red-600
  },
  fonts: {
    body: "system-ui, -apple-system, sans-serif",
    mono: "ui-monospace, monospace",
    heading: "system-ui, -apple-system, sans-serif",
  },
};

// Minimal reuses noir audio assets at reduced volumes
const minimalAudio: AudioPack = {
  sfx: {
    typewriter: { src: "/assets/noir/typewriter.mp3", volume: 0.3 }, // 50% of noir
    thunder: { src: "/assets/noir/thunder.mp3", volume: 0.38 }, // 50% of noir
    phone: { src: "/assets/noir/phone-ring.mp3", volume: 0.35 }, // 50% of noir
  },
  music: {
    src: "/assets/noir/noir-jazz-loop.mp3",
    volume: 0.07, // ~30% of noir
  },
  ambient: {
    rain: {
      src: "/assets/noir/rain-loop.wav",
      intensityVolume: {
        low: 0.07, // 40% of noir
        medium: 0.1,
        high: 0.14,
      },
    },
    crackle: {
      src: "/assets/noir/vinyl-crackle.wav",
      volume: 0.14, // 40% of noir
    },
  },
};

const minimalPersona: PersonaConfig = {
  systemPrompt: `
You are a helpful AI assistant that generates user interfaces.

Guidelines:
- Be concise and direct in your responses.
- Focus on understanding the user's requirements and delivering accurate results.
- Use clear, professional language without unnecessary embellishment.

Core Directives:
1. **Tool Usage:** When the user asks for a UI element, you MUST use the \`generate_ui\` tool.
2. **Tool Payload:** Submit a root object with a \`component\` field containing a valid A2UI component.
3. **Component Trees:** Return a single root component (usually \`container\`) with nested \`children\` for layout.
4. **Layout Primitives:** Prefer \`container\`, \`row\`, \`column\`, and \`grid\` to structure content.
5. **Protocol:** Strict adherence to the A2UI Protocol (JSON).
6. **Text Nodes:** \`text\` components must use \`content\` (not \`text\`). \`heading\` and \`paragraph\` use \`text\`.
7. **Images:** For generated images, provide \`image.prompt\` and \`image.alt\` and omit \`image.src\` (the tool will fill it).
8. **Supported Types:** text, card, container, row, column, grid, heading, paragraph, callout, badge, divider, list, table, stat, tabs, image, input, textarea, select, checkbox, button.
9. **No Invented Types:** Do not output custom types outside the list above.
10. **No Raw Code:** Never dump raw JSON in the conversation. Use the tool to generate UI.
11. **Failure:** If a request is not possible, explain why clearly and suggest alternatives.
`,
  terminology: {
    component: "component",
    generate: "create",
    error: "error",
  },
};

const minimalProfile: AestheticProfile = {
  id: "minimal",
  name: "Minimal",
  description: "Clean, neutral aesthetic with professional styling",
  theme: minimalTheme,
  audio: minimalAudio,
  persona: minimalPersona,
};

// =============================================================================
// REGISTRY
// =============================================================================

/**
 * Registry of all available aesthetic profiles.
 */
export const AESTHETIC_REGISTRY: AestheticRegistry = {
  noir: noirProfile,
  minimal: minimalProfile,
};

/**
 * Default aesthetic ID used when none is specified.
 */
export const DEFAULT_AESTHETIC_ID: AestheticId = "noir";

/**
 * Get an aesthetic profile by ID.
 * Returns undefined if the ID is not found.
 */
export function getAestheticProfile(id: AestheticId): AestheticProfile | undefined {
  return AESTHETIC_REGISTRY[id];
}

/**
 * Get an aesthetic profile by ID, falling back to default if not found.
 */
export function getAestheticProfileOrDefault(id: AestheticId | undefined): AestheticProfile {
  if (!id) return AESTHETIC_REGISTRY[DEFAULT_AESTHETIC_ID];
  return AESTHETIC_REGISTRY[id] ?? AESTHETIC_REGISTRY[DEFAULT_AESTHETIC_ID];
}

/**
 * Get all available aesthetic IDs.
 */
export function getAvailableAesthetics(): AestheticId[] {
  return Object.keys(AESTHETIC_REGISTRY) as AestheticId[];
}

/**
 * Get all aesthetic profiles as an array.
 */
export function getAllAestheticProfiles(): AestheticProfile[] {
  return Object.values(AESTHETIC_REGISTRY);
}

/**
 * Check if an aesthetic ID is valid.
 */
export function isValidAestheticId(id: string): id is AestheticId {
  return id in AESTHETIC_REGISTRY;
}
