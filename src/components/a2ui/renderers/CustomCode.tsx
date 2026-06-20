"use client";

import dynamic from "next/dynamic";
import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { getAestheticDefinition } from "@/lib/aesthetic/definitions";
import type { ComponentProps } from "../internal/context";
import { useBaseAestheticId } from "../internal/binding";
import { MissingComponent } from "../internal/registry";

// Sandpack is heavy — load the escape-hatch sandbox only when a `custom`
// component actually lands on a board.
const CustomCodeSandbox = dynamic(
  () => import("@/components/a2ui/CustomCodeSandbox").then((m) => m.CustomCodeSandbox),
  {
    ssr: false,
    loading: () => (
      <div className="border border-[var(--aesthetic-border)]/40 bg-[var(--aesthetic-background)]/35 px-4 py-3 rounded-sm text-xs font-mono text-[var(--aesthetic-text)]/70 uppercase">
        Loading sandbox…
      </div>
    ),
  }
);

/**
 * The catalog ESCAPE HATCH — model-written React rendered inside the eject
 * pipeline's Sandpack sandbox (a real iframe boundary). The frame is themed so
 * the foreign component still reads as evidence on the desk.
 */
export function CustomCodeRenderer({ component }: ComponentProps) {
  const baseAestheticId = useBaseAestheticId();
  const custom = component as SurfaceComponent & {
    code?: unknown;
    title?: unknown;
    height?: unknown;
  };
  const code = typeof custom.code === "string" ? custom.code : "";
  const title = typeof custom.title === "string" ? custom.title : "Custom build";
  // Default tall enough that the common form/calculator widget fits without an
  // inner scrollbar; the model can still request a specific height.
  const height = typeof custom.height === "number" ? custom.height : 520;

  // Resolve the active world's palette so the sandbox paints itself in-theme
  // (the iframe is a separate document and can't read the host's CSS vars).
  const def = getAestheticDefinition(baseAestheticId);
  const sandboxTheme = {
    background: def.theme.colors.background,
    surface: def.theme.colors.surface,
    surfaceAlt: def.theme.colors.surfaceAlt,
    text: def.theme.colors.text,
    textMuted: def.theme.colors.textMuted,
    accent: def.theme.colors.accent,
    accentMuted: def.theme.colors.accentMuted,
    border: def.theme.colors.border,
    radius: def.identity.styleTokens.radius,
  };

  if (!code) {
    return <MissingComponent id={`${component.id} (no code)`} />;
  }

  return (
    <div className="overflow-hidden rounded-[var(--aesthetic-radius,2px)] border border-[var(--aesthetic-border)]/40 border-t-2 border-t-[var(--aesthetic-accent)]/60">
      <div className="flex items-center justify-between bg-[var(--aesthetic-surface)]/80 px-3 py-1.5">
        <span className="font-typewriter text-[10px] uppercase tracking-[0.2em] text-[var(--aesthetic-text)]/70">
          {title}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--aesthetic-accent)]/60">
          sandboxed
        </span>
      </div>
      <CustomCodeSandbox code={code} height={height} theme={sandboxTheme} />
    </div>
  );
}
