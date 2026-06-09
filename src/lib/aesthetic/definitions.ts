/**
 * Single, client-safe source of truth for the built-in aesthetic presets.
 *
 * This module is deliberately FREE of `server-only` so client components (CSS
 * injection, renderers, settings panels, the music composer, voice preview) and
 * the server (registry.ts, prompts.ts, tts/route.ts, images.ts) can all read
 * the SAME data. The only thing that stays server-only is the long persona
 * system-prompt body, which lives in personas.ts and is attached by registry.ts.
 *
 * Everything that used to be hand-copied across registry.ts, audio-packs.ts,
 * voice-defaults.ts and ColorCustomization.PRESET_COLORS now derives from here,
 * so a preset's literals live in exactly one place. Keep noir byte-identical to
 * its historical registry values — the e2e layout snapshots depend on it.
 */
import type { AestheticDefinition, BuiltInAestheticId } from "./types";

// =============================================================================
// NOIR
// =============================================================================

const noir: AestheticDefinition = {
  id: "noir",
  name: "Noir Detective",
  description: "Hard-boiled detective aesthetic with amber accents and atmospheric rain",
  theme: {
    colors: {
      background: "#0f0f0f",
      surface: "#1a1a1a",
      surfaceAlt: "#2a2a2a",
      text: "#e0e0e0",
      textMuted: "#a0a0a0",
      accent: "#ffbf00",
      accentMuted: "#b5a642",
      border: "#2a2a2a",
      error: "#8a0000",
    },
    fonts: {
      body: "var(--font-typewriter)",
      mono: "var(--font-mono)",
      heading: "var(--font-sans)",
    },
  },
  audio: {
    sfx: {
      typewriter: { src: "/assets/noir/typewriter.mp3", volume: 0.6 },
      thunder: { src: "/assets/noir/thunder.mp3", volume: 0.75 },
      phone: { src: "/assets/noir/phone-ring.mp3", volume: 0.7 },
    },
    music: { src: "/assets/noir/noir-jazz-loop.mp3", volume: 0.22 },
    ambient: {
      rain: {
        src: "/assets/noir/rain-loop.wav",
        intensityVolume: { low: 0.18, medium: 0.26, high: 0.34 },
      },
      crackle: { src: "/assets/noir/vinyl-crackle.wav", volume: 0.35 },
    },
  },
  terminology: {
    component: "evidence",
    generate: "file a report",
    error: "trail went cold",
  },
  voiceId: "r5wMVcYycQezNCms1jJb",
  imageStylePrompt:
    "shot as a 1940s detective's evidence photograph, noir cinematic, rain-slicked streets, moody low-key lighting, hard chiaroscuro contrast, heavy film grain, 35mm black-and-white photography, deep shadows, light fog, desaturated palette, no bright saturated color, no text or watermark",
  // Photoreal evidence look — Imagen renders film-grain B&W photography cleanly.
  imageModel: "imagen-4.0-generate-001",
  identity: {
    glowStrength: 1,
    voiceDirection: { stability: 0.35, similarityBoost: 0.5, style: 0.55, speed: 0.85 },
    musicStylePrompt:
      "a slow, smoky 1940s film noir jazz piece — melancholic muted trumpet, brushed snare, upright bass, distant rain, brooding and cinematic",
    musicPresets: [
      {
        icon: "🎷",
        name: "Sax Solo",
        prompt:
          "A slow, smoky 1940s film noir jazz track with a melancholic saxophone solo, gentle upright bass, and quiet brushed snare drum.",
      },
      {
        icon: "🎺",
        name: "Muted Trumpet",
        prompt:
          "A dark, suspenseful detective theme with a muted trumpet melody, distant sirens, low piano chords, and a rainy atmosphere.",
      },
      {
        icon: "🎹",
        name: "Rainy Piano",
        prompt:
          "A slow, solitary piano melody echoing in a rainy alleyway, wet pavement ambience, minor chords, reflective and nostalgic mood.",
      },
      {
        icon: "🎻",
        name: "Low Strings",
        prompt:
          "Low, brooding orchestral string chords with a slow tempo, building tension, cinematic and mysterious detective atmosphere.",
      },
    ],
    copy: {
      editorTitle: "CASE FILE // JSON DATA",
      workspaceTitle: "Evidence Board",
      imagePending: "IMAGE PENDING",
      audioPending: "WIRE TAP PENDING",
      videoPending: "FOOTAGE PENDING",
      dictaphoneTitle: "Dictaphone Logs",
      dictaphoneItemLabel: "Cassette Log",
      dictaphoneDeleteLabel: "Incinerate Tape",
      dictaphoneEmptyHint: "Load a recording from the archive",
      loadingImageLabel: "Generating...",
      loadingStatus: "Compiling evidence",
    },
    samplePrompts: [
      "Open a case file on three suspects with mugshots, status badges, and an evidence log table",
      "Build a surveillance dashboard tracking a stakeout — stats, a watch list, and a notes panel",
      "Draft a witness contact form with name, last-seen location, and a statement field",
    ],
    voicePreviewLine: "The rain never stops in this town. Neither does the code.",
    layoutDoctrine: `LAYOUT DOCTRINE (Noir — case-file dossier):
When the request is open-ended, lean toward a case-file dossier: a heading, a grid of suspect/evidence cards (2-3 columns), a table acting as an evidence log, and status badges (danger for threats, primary for cleared). Favor a single hero mugshot image inside the top card. Compose like paper laid on a desk — clear hierarchy, terse labels. Alternatives: a surveillance board (dashboard of stats) or an interrogation summary (table + callout).`,
    styleTokens: { radius: "2px", borderStyle: "sharp", headerCase: "uppercase" },
    effects: { card: "paper", stamp: "wax", screen: "none", bloom: 0.4 },
    atmosphere: {
      particle: "rain",
      particleColor: "#bcd2eb",
      lightningColor: "#ffffff",
      vignetteColor: "#000000",
      vignetteIntensity: 0.72,
      lightningFrequency: 0.4,
    },
    motion: {
      entrance: "cinematic",
      durationMs: 600,
      staggerMs: 80,
      easing: "ease-out",
      imageReveal: "darkroom",
    },
    imageSpec: {
      medium: "1940s detective evidence photograph, 35mm black-and-white film, heavy film grain",
      lighting: "moody low-key lighting, hard chiaroscuro contrast, deep shadows, light fog",
      palette: "desaturated black-and-white, no bright saturated color",
      lens: "35mm, shallow depth of field",
      framing: "noir cinematic composition, rain-slicked streets",
      negative: [
        "text",
        "watermark",
        "bright saturated color",
        "color photography",
        "modern technology",
        "cheerful mood",
      ],
      motifs: [
        "rain-slicked alley at night",
        "cigarette smoke drifting through lamplight",
        "venetian-blind shadows across a face",
        "a neon sign reflected in a puddle",
      ],
    },
    compositionSeed: 42,
    audioEvents: { "component.placed": "typewriter", "dramatic.beat": "thunder", error: "phone" },
  },
};

// =============================================================================
// MINIMAL
// =============================================================================

const minimal: AestheticDefinition = {
  id: "minimal",
  name: "Minimal",
  description: "Clean, neutral aesthetic with professional styling",
  theme: {
    colors: {
      background: "#ffffff",
      surface: "#f4f4f5",
      surfaceAlt: "#e4e4e7",
      text: "#18181b",
      textMuted: "#71717a",
      accent: "#2563eb",
      accentMuted: "#3b82f6",
      border: "#e4e4e7",
      error: "#dc2626",
    },
    fonts: {
      body: "system-ui, -apple-system, sans-serif",
      mono: "ui-monospace, monospace",
      heading: "system-ui, -apple-system, sans-serif",
    },
  },
  // Minimal reuses noir audio assets at reduced volumes.
  audio: {
    sfx: {
      typewriter: { src: "/assets/noir/typewriter.mp3", volume: 0.3 },
      thunder: { src: "/assets/noir/thunder.mp3", volume: 0.38 },
      phone: { src: "/assets/noir/phone-ring.mp3", volume: 0.35 },
    },
    music: { src: "/assets/noir/noir-jazz-loop.mp3", volume: 0.07 },
    ambient: {
      rain: {
        src: "/assets/noir/rain-loop.wav",
        intensityVolume: { low: 0.07, medium: 0.1, high: 0.14 },
      },
      crackle: { src: "/assets/noir/vinyl-crackle.wav", volume: 0.14 },
    },
  },
  terminology: {
    component: "component",
    generate: "create",
    error: "error",
  },
  voiceId: "21m00Tcm4TlvDq8ikWAM",
  imageStylePrompt:
    "clean, modern, minimalist aesthetic, bright white and neutral gray tones, professional corporate presentation slide style, crisp vector art, clean lines, high-key lighting, no clutter, no text or watermark",
  // Crisp high-key product/vector look — Imagen handles clean lines well.
  imageModel: "imagen-4.0-generate-001",
  identity: {
    glowStrength: 0,
    voiceDirection: { stability: 0.7, similarityBoost: 0.75, style: 0.1, speed: 1.05 },
    musicStylePrompt:
      "an airy, minimal lo-fi pad — near-ambient, gentle warmth, soft sustained chords, unobtrusive and clean, almost silent background texture",
    musicPresets: [
      {
        icon: "🌿",
        name: "Ambient Pad",
        prompt:
          "A calm, airy ambient pad with soft sustained synth chords, gentle warmth, and a near-silent minimal texture for focus.",
      },
      {
        icon: "🎧",
        name: "Lo-Fi Focus",
        prompt:
          "A clean lo-fi study beat with a soft muted piano, light vinyl warmth, mellow tempo, unobtrusive and modern.",
      },
      {
        icon: "💧",
        name: "Soft Keys",
        prompt:
          "A sparse, contemplative piano motif with lots of space, soft dynamics, neutral and uncluttered.",
      },
      {
        icon: "🔆",
        name: "Bright Air",
        prompt:
          "A bright, high-key ambient texture with airy pads and subtle shimmer, clean and professional.",
      },
    ],
    copy: {
      editorTitle: "SOURCE // JSON",
      workspaceTitle: "Canvas",
      imagePending: "Image loading",
      audioPending: "Audio loading",
      videoPending: "Video loading",
      dictaphoneTitle: "Transcript",
      dictaphoneItemLabel: "Recording",
      dictaphoneDeleteLabel: "Delete recording",
      dictaphoneEmptyHint: "Select a recording to play it",
      loadingImageLabel: "Generating",
      loadingStatus: "Generating",
    },
    samplePrompts: [
      "Create a clean pricing page with three plan cards and a feature comparison",
      "Lay out a simple analytics dashboard with four KPI stats and a trend chart",
      "Build a contact form with name, email, and a message field",
    ],
    voicePreviewLine: "Voice preview. This is how I sound.",
    layoutDoctrine: `LAYOUT DOCTRINE (Minimal — clean cards):
When the request is open-ended, keep it restrained: one clear heading, 2-3 cards in a grid, generous whitespace, and at most a single accent stat. Avoid badges, kanban boards, and dashboards unless explicitly asked. Match complexity to the request — a one-line answer is a single card, not a dashboard. Prefer clarity over decoration.`,
    styleTokens: { radius: "10px", borderStyle: "soft", headerCase: "normal" },
    effects: { card: "flat", stamp: "none", screen: "none", bloom: 0 },
    atmosphere: {
      particle: "none",
      particleColor: "#d4d4d8",
      lightningColor: "#2563eb",
      vignetteColor: "#000000",
      vignetteIntensity: 0,
      lightningFrequency: 0,
    },
    motion: {
      entrance: "crisp",
      durationMs: 120,
      staggerMs: 30,
      easing: "ease-out",
      imageReveal: "crisp",
    },
    imageSpec: {
      medium: "clean modern minimalist illustration, crisp vector art",
      lighting: "bright high-key lighting, even and soft",
      palette: "bright white and neutral gray tones, restrained",
      lens: "flat, no distortion",
      framing: "professional corporate presentation slide, generous negative space, no clutter",
      negative: ["text", "watermark", "clutter", "heavy shadows", "grain", "vintage texture"],
      motifs: [
        "a single accent shape on white",
        "soft geometric composition",
        "minimal line-art icon",
        "a calm gradient field",
      ],
    },
    compositionSeed: 17,
    audioEvents: { "message.complete": "typewriter" },
  },
};

// =============================================================================
// CYBER FIXER
// =============================================================================

const cyberFixer: AestheticDefinition = {
  id: "cyber-fixer",
  name: "Cyber Fixer",
  description: "Futuristic neon aesthetic with electronic crackle and street slang persona",
  theme: {
    colors: {
      background: "#0a0512",
      surface: "#140c24",
      surfaceAlt: "#251642",
      text: "#f0e6ff",
      textMuted: "#8b72af",
      accent: "#00ffcc",
      accentMuted: "#ff007f",
      border: "#3a1f66",
      error: "#ff3333",
    },
    fonts: {
      body: "var(--font-mono)",
      mono: "var(--font-mono)",
      heading: "var(--font-sans)",
    },
  },
  audio: {
    sfx: {
      typewriter: { src: "/assets/cyber-fixer/typewriter.mp3", volume: 0.7 },
      thunder: { src: "/assets/cyber-fixer/thunder.mp3", volume: 0.8 },
      phone: { src: "/assets/cyber-fixer/phone.mp3", volume: 0.75 },
    },
    music: { src: "/assets/cyber-fixer/music.mp3", volume: 0.25 },
    ambient: {
      rain: {
        src: "/assets/cyber-fixer/rain.mp3",
        intensityVolume: { low: 0.2, medium: 0.3, high: 0.4 },
      },
      crackle: { src: "/assets/cyber-fixer/crackle.mp3", volume: 0.4 },
    },
  },
  terminology: {
    component: "widget",
    generate: "inject grid load",
    error: "connection dropped",
  },
  voiceId: "pNInz6obpgDQGcFmaJgB",
  imageStylePrompt:
    "cyberpunk aesthetic, futuristic cyberpunk command center, neon lights, high-tech overlays, glowing digital HUD, cybernetic implants, wireframe graphics, cyan and magenta accents, rainy futuristic cityscape window, synthwave style, no text or watermark",
  // Dense neon/HUD detail — the higher-fidelity Gemini Pro image model.
  imageModel: "gemini-3-pro-image",
  identity: {
    glowStrength: 1.4,
    voiceDirection: { stability: 0.2, similarityBoost: 0.6, style: 0.8, speed: 1.1 },
    musicStylePrompt:
      "dark synthwave — driving arpeggiated bass, neon pads, gated reverb drums, 110bpm, retro-futuristic and propulsive, Blade Runner street energy",
    musicPresets: [
      {
        icon: "🌃",
        name: "Synthwave",
        prompt:
          "A dark synthwave track with arpeggiated bass, lush neon pads, punchy gated drums, around 110bpm, retro-futuristic and driving.",
      },
      {
        icon: "⚡",
        name: "Neon Pulse",
        prompt:
          "A high-energy cyberpunk pulse with sidechained synth stabs, glitchy percussion, and a relentless bassline.",
      },
      {
        icon: "🛰️",
        name: "Outrun",
        prompt:
          "An 80s outrun chase theme with bright lead synths, rolling toms, and a propulsive analog bass, neon and nocturnal.",
      },
      {
        icon: "🔌",
        name: "Datastream",
        prompt:
          "A cold, hypnotic techno groove with modem-glitch textures, deep sub bass, and shimmering digital arpeggios.",
      },
    ],
    copy: {
      editorTitle: "DATA SHARD // JSON",
      workspaceTitle: "The Grid",
      imagePending: "SIGNAL LOST",
      audioPending: "FEED OFFLINE",
      videoPending: "VIDEO SIGNAL LOST",
      dictaphoneTitle: "Voice Shards",
      dictaphoneItemLabel: "Shard",
      dictaphoneDeleteLabel: "Wipe Shard",
      dictaphoneEmptyHint: "Jack in a recording from the cache",
      loadingImageLabel: "RENDERING...",
      loadingStatus: "Injecting grid load",
    },
    samplePrompts: [
      "Spin up a netrunner HUD with system stats, a target deck, and neon status badges",
      "Build a black-market data feed dashboard with live metrics and a contraband table",
      "Lay out a chrome-shop catalog grid with implant cards and price tags",
    ],
    voicePreviewLine: "Neon's bleeding, choom. Deck's hot — what're we running?",
    layoutDoctrine: `LAYOUT DOCTRINE (Cyber Fixer — HUD panels):
When the request is open-ended, compose like a heads-up display: a stat row across the top (metrics/KPIs), then HUD panels — a DataDashboard of neon charts, tabbed "decks" for grouped content, and a grid of glowing cards. Lean into Stat and DataDashboard. Use a wide HUD banner image. Keep it dense, fast, and futuristic. Alternatives: a netrunner deck (tabs) or a market ticker (table + stats).`,
    styleTokens: { radius: "4px", borderStyle: "beveled", headerCase: "uppercase" },
    effects: { card: "hologram", stamp: "digital", screen: "none", bloom: 1.4 },
    atmosphere: {
      particle: "rain",
      particleColor: "#ff007f",
      lightningColor: "#00ffcc",
      vignetteColor: "#0a0512",
      vignetteIntensity: 0.5,
      lightningFrequency: 1.2,
    },
    motion: {
      entrance: "glitch",
      durationMs: 320,
      staggerMs: 50,
      easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      imageReveal: "scanline",
    },
    imageSpec: {
      medium: "cyberpunk concept art, glowing digital HUD render, synthwave style",
      lighting: "neon rim lighting, glowing high-tech overlays, volumetric haze",
      palette: "cyan and magenta neon accents over deep blue-violet night",
      lens: "wide-angle, anamorphic flare",
      framing: "futuristic command center, rainy neon cityscape window, wireframe overlays",
      negative: ["text", "watermark", "daylight", "natural rural setting", "muted colors", "sepia"],
      motifs: [
        "neon-drenched rainy megacity street",
        "holographic interface floating in mid-air",
        "chrome cybernetic implant close-up",
        "a lone fixer silhouetted against billboards",
      ],
    },
    compositionSeed: 88,
    audioEvents: {
      "message.start": "phone",
      "component.placed": "typewriter",
      "dramatic.beat": "thunder",
    },
  },
};

// =============================================================================
// NOSTROMO CONSOLE
// =============================================================================

const nostromoConsole: AestheticDefinition = {
  id: "nostromo-console",
  name: "Nostromo Console",
  description: "Retro terminal phosphor green theme with Weyland-Yutani computer persona",
  theme: {
    colors: {
      background: "#020804",
      surface: "#05160b",
      surfaceAlt: "#0a2815",
      text: "#33ff66",
      textMuted: "#1d8c3b",
      accent: "#33ff66",
      accentMuted: "#ff9900",
      border: "#0d3b1f",
      error: "#ff3300",
    },
    fonts: {
      body: "var(--font-mono)",
      mono: "var(--font-mono)",
      heading: "var(--font-mono)",
    },
  },
  audio: {
    sfx: {
      typewriter: { src: "/assets/nostromo-console/typewriter.mp3", volume: 0.5 },
      thunder: { src: "/assets/nostromo-console/thunder.mp3", volume: 0.3 },
      phone: { src: "/assets/nostromo-console/phone.mp3", volume: 0.5 },
    },
    music: { src: "/assets/nostromo-console/music.mp3", volume: 0.1 },
    ambient: {
      rain: {
        src: "/assets/nostromo-console/rain.mp3",
        intensityVolume: { low: 0.05, medium: 0.08, high: 0.12 },
      },
      crackle: { src: "/assets/nostromo-console/crackle.mp3", volume: 0.6 },
    },
  },
  terminology: {
    component: "module",
    generate: "compile log",
    error: "system error",
  },
  voiceId: "N2lVS1w4EtoT3dr4eOWO",
  imageStylePrompt:
    "retro sci-fi terminal screen, green phosphor CRT monitor, computer console dashboard, vintage dials and toggle switches, 1980s spaceship command deck, high contrast monochrome green and black, analog video noise, scanlines, no text or watermark",
  // Flat monochrome CRT look — Imagen is fine and fast for this.
  imageModel: "imagen-4.0-generate-001",
  identity: {
    glowStrength: 1.1,
    voiceDirection: { stability: 0.85, similarityBoost: 0.75, style: 0.0, speed: 0.8 },
    musicStylePrompt:
      "low droning sci-fi ambient — a deep reactor hum, sparse sonar pings, no melody, cold and vast, Alien/Vangelis Blade Runner machine-room atmosphere",
    musicPresets: [
      {
        icon: "🛸",
        name: "Reactor Hum",
        prompt:
          "A low, droning sci-fi ambient bed — a deep reactor hum with slow swells, sparse sonar pings, no melody, cold and vast.",
      },
      {
        icon: "📡",
        name: "Deep Space",
        prompt:
          "A vast, dark space ambient with distant metallic groans, slow evolving drones, and occasional beeping telemetry.",
      },
      {
        icon: "⚙️",
        name: "Machine Room",
        prompt:
          "An industrial machine-room hum with rhythmic mechanical pulses, hissing vents, and a steady low-frequency thrum.",
      },
      {
        icon: "🌌",
        name: "Cryo Drift",
        prompt:
          "A weightless cryo-sleep ambient with soft sustained tones, faint heartbeat pulse, and slow tidal swells.",
      },
    ],
    copy: {
      editorTitle: "DATA LOG // JSON",
      workspaceTitle: "MAIN DISPLAY",
      imagePending: "IMAGE STREAM OFFLINE",
      audioPending: "AUDIO STREAM OFFLINE",
      videoPending: "VIDEO FEED OFFLINE",
      dictaphoneTitle: "AUDIO LOG // MU-TH-UR",
      dictaphoneItemLabel: "Log Entry",
      dictaphoneDeleteLabel: "Purge Log",
      dictaphoneEmptyHint: "Mount a log entry to replay",
      loadingImageLabel: "RENDERING IMAGE...",
      loadingStatus: "Compiling log",
    },
    samplePrompts: [
      "COMPILE a ship status readout with hull telemetry stats and a crew manifest table",
      "Display a system diagnostics dashboard with reactor metrics and warning badges",
      "Print a cargo manifest as a monospace table with quantities and hazard flags",
    ],
    voicePreviewLine: "INTERFACE ONLINE. ALL SYSTEMS NOMINAL. AWAITING INPUT.",
    layoutDoctrine: `LAYOUT DOCTRINE (Nostromo — terminal readout):
When the request is open-ended, print top-to-bottom like a terminal: stacked sections, ALL-CAPS headings, monospace tables, a DataDashboard of ship telemetry, and a status line. Prefer Stat and tables over photos — favor schematics/ASCII over imagery. Keep it dry, bracketed, and official. Alternatives: a diagnostics panel (dashboard) or a manifest (table-heavy).`,
    styleTokens: { radius: "0px", borderStyle: "sharp", headerCase: "uppercase" },
    effects: { card: "wireframe", stamp: "none", screen: "scanlines", bloom: 1.1 },
    atmosphere: {
      particle: "grain",
      particleColor: "#33ff66",
      lightningColor: "#33ff66",
      vignetteColor: "#020804",
      vignetteIntensity: 0.6,
      lightningFrequency: 0.5,
    },
    motion: {
      entrance: "terminal",
      durationMs: 220,
      staggerMs: 60,
      easing: "steps(8, end)",
      imageReveal: "raster",
    },
    imageSpec: {
      medium: "retro 1980s sci-fi CRT terminal readout, green phosphor monochrome",
      lighting: "phosphor glow, high contrast monochrome green on black, analog video noise",
      palette: "monochrome phosphor green and black, scanlines",
      lens: "flat CRT screen curvature, slight bloom",
      framing: "spaceship command-deck console, vintage dials and toggle switches",
      negative: ["text", "watermark", "color photography", "modern UI", "clean digital render"],
      motifs: [
        "wireframe ship schematic on a green grid",
        "scrolling telemetry readout",
        "a radar sweep over a dark sector map",
        "blinking warning indicators on a control panel",
      ],
    },
    compositionSeed: 7,
    audioEvents: {
      "message.start": "phone",
      "component.placed": "typewriter",
      error: "thunder",
    },
  },
};

// =============================================================================
// GOTHIC MANOR
// =============================================================================

const gothicManor: AestheticDefinition = {
  id: "gothic-manor",
  name: "Gothic Manor",
  description: "Brooding dark gothic vampire theme with nineteenth-century poetry persona",
  theme: {
    colors: {
      background: "#08080a",
      surface: "#121217",
      surfaceAlt: "#22222b",
      text: "#e1e1e6",
      textMuted: "#82828c",
      accent: "#990011",
      accentMuted: "#4a0008",
      border: "#2a2a35",
      error: "#ff0011",
    },
    fonts: {
      body: "var(--font-typewriter)",
      mono: "var(--font-mono)",
      heading: "var(--font-typewriter)",
    },
  },
  audio: {
    sfx: {
      typewriter: { src: "/assets/gothic-manor/typewriter.mp3", volume: 0.55 },
      thunder: { src: "/assets/gothic-manor/thunder.mp3", volume: 0.95 },
      phone: { src: "/assets/gothic-manor/phone.mp3", volume: 0.6 },
    },
    music: { src: "/assets/gothic-manor/music.mp3", volume: 0.15 },
    ambient: {
      rain: {
        src: "/assets/gothic-manor/rain.mp3",
        intensityVolume: { low: 0.22, medium: 0.32, high: 0.42 },
      },
      crackle: { src: "/assets/gothic-manor/crackle.mp3", volume: 0.3 },
    },
  },
  terminology: {
    component: "artifact",
    generate: "manifest chronicle",
    error: "trail lost to the dark",
  },
  voiceId: "JBFqnCBsd6RMkjVDRZzb",
  imageStylePrompt:
    "dark Victorian gothic manor interior, candelabras glowing, heavy velvet drapes, gothic window showing stormy moonlit night and graveyard, classic oil painting style, moody dark academia, crimson and gold accents, no text or watermark",
  // Painterly oil-painting rendering — the higher-fidelity Gemini Pro image model.
  imageModel: "gemini-3-pro-image",
  identity: {
    glowStrength: 0.8,
    voiceDirection: { stability: 0.3, similarityBoost: 0.65, style: 0.7, speed: 0.8 },
    musicStylePrompt:
      "a solo pipe organ and mournful cello — a minor-key funeral waltz, slow and theatrical, candlelit cathedral reverb, gothic and elegiac",
    musicPresets: [
      {
        icon: "🎹",
        name: "Pipe Organ",
        prompt:
          "A solemn solo pipe organ in a minor key, slow funeral waltz tempo, cathedral reverb, gothic and elegiac.",
      },
      {
        icon: "🎻",
        name: "Mourning Cello",
        prompt:
          "A mournful solo cello melody over sparse piano, deeply melancholic, dark romantic, candlelit chamber atmosphere.",
      },
      {
        icon: "🕯️",
        name: "Requiem",
        prompt:
          "A haunting choral requiem with low strings, distant bells, and a slow, dirge-like procession.",
      },
      {
        icon: "🥀",
        name: "Harpsichord",
        prompt:
          "A baroque harpsichord motif in a minor key, ornate and brooding, with creaking ambience and a ticking clock.",
      },
    ],
    copy: {
      editorTitle: "MANUSCRIPT // JSON",
      workspaceTitle: "The Chronicle",
      imagePending: "PORTRAIT UNDEVELOPED",
      audioPending: "RECORDING UNHEARD",
      videoPending: "VISION UNSEEN",
      dictaphoneTitle: "Recorded Confessions",
      dictaphoneItemLabel: "Confession",
      dictaphoneDeleteLabel: "Banish Recording",
      dictaphoneEmptyHint: "Summon a recording from the archive",
      loadingImageLabel: "Manifesting...",
      loadingStatus: "Manifesting the chronicle",
    },
    samplePrompts: [
      "Inscribe a family chronicle — portrait cards of three heirs, a curse ledger table, and ominous badges",
      "Compose a séance dashboard tracking restless spirits with sightings and a ritual list",
      "Draft a confession form with the penitent's name, the date of sin, and a testimony field",
    ],
    voicePreviewLine: "The candles gutter, and still the shadows whisper their secrets.",
    layoutDoctrine: `LAYOUT DOCTRINE (Gothic Manor — manuscript / ledger):
When the request is open-ended, compose like an illuminated manuscript: an ornate serif heading, a single centered chronicle card or a two-column ledger, a table acting as a registry, and a list as a chronicle of events. Favor a portrait image beside the text. Use ornamental dividers between sections. Keep it literary and dramatic. Alternatives: a portrait gallery (grid of cards) or a curse ledger (table-heavy).`,
    styleTokens: { radius: "3px", borderStyle: "double", headerCase: "titlecase" },
    effects: { card: "parchment", stamp: "blood", screen: "none", bloom: 0.8 },
    atmosphere: {
      particle: "ember",
      particleColor: "#990011",
      lightningColor: "#cc3344",
      vignetteColor: "#000000",
      vignetteIntensity: 0.85,
      lightningFrequency: 0.6,
    },
    motion: {
      entrance: "candle",
      durationMs: 400,
      staggerMs: 110,
      easing: "ease-in-out",
      imageReveal: "candle",
    },
    imageSpec: {
      medium: "classic gothic oil painting, dark academia, ornate detail",
      lighting: "warm candlelight glow, deep chiaroscuro, heavy shadow",
      palette: "crimson and gold accents over brooding near-black",
      lens: "painterly, soft focus edges",
      framing:
        "Victorian gothic manor interior, heavy velvet drapes, gilt frame, stormy moonlit window",
      negative: [
        "text",
        "watermark",
        "bright daylight",
        "modern setting",
        "cheerful",
        "neon",
        "sci-fi",
      ],
      motifs: [
        "candelabra casting long shadows in a manor hall",
        "a rain-streaked gothic window over a graveyard",
        "an oil-painted portrait of a pale aristocrat",
        "wilting roses beside a melting candle",
      ],
    },
    compositionSeed: 31,
    audioEvents: {
      "component.placed": "typewriter",
      "dramatic.beat": "thunder",
      error: "phone",
    },
  },
};

// =============================================================================
// REGISTRY OF DEFINITIONS
// =============================================================================

/**
 * The pure-data definitions for every built-in aesthetic. Single source of
 * truth; consumed identically by client and server.
 */
export const AESTHETIC_DEFINITIONS: Record<BuiltInAestheticId, AestheticDefinition> = {
  noir,
  minimal,
  "cyber-fixer": cyberFixer,
  "nostromo-console": nostromoConsole,
  "gothic-manor": gothicManor,
};

/**
 * Get a definition by id, falling back to noir for unknown/custom ids.
 */
export function getAestheticDefinition(id: string | undefined): AestheticDefinition {
  if (id && id in AESTHETIC_DEFINITIONS) {
    return AESTHETIC_DEFINITIONS[id as BuiltInAestheticId];
  }
  return AESTHETIC_DEFINITIONS.noir;
}
