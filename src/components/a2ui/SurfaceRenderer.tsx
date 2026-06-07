"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Book,
  BookOpen,
  Bookmark,
  Calendar,
  Camera,
  Check,
  CheckCircle,
  ChevronRight,
  Clock,
  Cloud,
  Code,
  Cpu,
  Database,
  DollarSign,
  Download,
  Droplet,
  Edit3,
  ExternalLink,
  Eye,
  Feather,
  File,
  FileText,
  Flag,
  Flame,
  Folder,
  Heart,
  HelpCircle,
  Home,
  Image as ImageIcon,
  Info,
  Key,
  Link as LinkIcon,
  Lock,
  Mail,
  MapPin,
  Mic,
  Minus,
  Moon,
  Music,
  Pause,
  Phone,
  Play,
  Plus,
  Search,
  Server,
  Settings,
  Shield,
  Skull,
  Star,
  Sun,
  Tag,
  Terminal,
  Trash2,
  TrendingDown,
  TrendingUp,
  Unlock,
  Upload,
  User,
  Users,
  Video,
  Volume2,
  Wifi,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { SurfaceState, SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { resolvePointer } from "@/lib/a2ui/binding/pointer";
import { isFunctionCall, evaluateFunctionCall } from "@/lib/a2ui/binding/functions";
import { resolveChildList } from "@/lib/a2ui/binding/template-children";
import { runChecks, type CheckRule } from "@/lib/a2ui/validation";
import { dispatchAction } from "@/lib/a2ui/events/dispatch";
import type { ActionMessage, ServerMessage } from "@/lib/a2ui/schema/messages";
import { useSurfaceStore } from "@/lib/a2ui/store/useSurfaceStore";
import { PhotoDeveloper } from "@/components/noir/PhotoDeveloper";
import { cn } from "@/lib/utils";
import { useA2UIStore } from "@/lib/store/useA2UIStore";
import { useCustomProfileStore } from "@/lib/store/useCustomProfileStore";
import { getEffectsProfile, getMotionPersonality, getStyleTokens } from "@/lib/aesthetic/identity";
import type { MotionPersonality, StyleTokens } from "@/lib/aesthetic/types";

// ============================================================================
// Context for component resolution
// ============================================================================

interface SurfaceContextValue {
  surface: SurfaceState;
  getComponent: (id: string) => SurfaceComponent | undefined;
  /** The live (working) data model — root for JSON Pointer resolution. */
  dataModel: Record<string, unknown>;
  /** Write a value back into the data model (two-way binding). */
  setData: (path: string, value: unknown) => void;
  /** Dispatch a component action (server event or local function call). */
  runAction: (componentId: string, action: unknown) => void;
  theme: "noir" | "standard";
}

const SurfaceContext = createContext<SurfaceContextValue | null>(null);

/**
 * Per-subtree data scope, set by template-expanded children so that relative
 * JSON Pointers and function-call args resolve against the current item rather
 * than the surface root. Undefined at the top level.
 */
const ScopeContext = createContext<unknown>(undefined);

export function useSurfaceContext(): SurfaceContextValue {
  const ctx = useContext(SurfaceContext);
  if (!ctx) {
    throw new Error("useSurfaceContext must be used within SurfaceRenderer");
  }
  return ctx;
}

// ============================================================================
// Data-binding helpers
// ============================================================================

interface ComponentProps {
  component: SurfaceComponent;
}

// Per the A2UI v0.9 catalog, a data binding is the explicit object form
// `{ path: "/json/pointer" }`; a bare string is always a literal. This avoids
// the ambiguity where a literal value that happens to start with "/" (e.g. a
// URL path or "/home") would be mistaken for a pointer.
function getBindingPath(value: unknown): string | null {
  if (
    value &&
    typeof value === "object" &&
    "path" in value &&
    typeof (value as { path: unknown }).path === "string"
  ) {
    return (value as { path: string }).path;
  }
  return null;
}

/**
 * Resolve a Dynamic value against the data model + current scope:
 * - functionCall `{ call, args }` → evaluated via the built-in registry.
 * - data binding `{ path }` → JSON Pointer resolution (scope-aware).
 * - anything else → literal passthrough.
 */
function resolveValue(value: unknown, dataModel: Record<string, unknown>, scope: unknown): unknown {
  if (isFunctionCall(value)) {
    return evaluateFunctionCall(value, dataModel, scope);
  }
  const path = getBindingPath(value);
  if (path !== null) {
    return resolvePointer(dataModel, path, scope);
  }
  return value;
}

/** Hook returning a scope-aware resolver for the current subtree. */
function useResolve(): (value: unknown) => unknown {
  const { dataModel } = useSurfaceContext();
  const scope = useContext(ScopeContext);
  return useCallback((value: unknown) => resolveValue(value, dataModel, scope), [dataModel, scope]);
}

/**
 * Resolve the active base aesthetic id (a built-in preset key) the same way the
 * rest of the renderer does: a custom profile reports its `baseAestheticId`,
 * otherwise the store's selected aesthetic. Drives effect/style/motion lookups
 * so decoration is data-driven (per the effects profile) rather than keyed on a
 * hardcoded preset id.
 */
function useBaseAestheticId() {
  const activeProfile = useCustomProfileStore((state) => {
    if (!state.activeCustomProfileId) return null;
    return state.customProfiles.find((p) => p.id === state.activeCustomProfileId) ?? null;
  });
  const fallbackAestheticId = useA2UIStore((state) => state.settings.aestheticId || "noir");
  return activeProfile?.baseAestheticId ?? fallbackAestheticId;
}

/** RFC 6901 token decode (~1 → "/", ~0 → "~"). */
function decodeToken(token: string): string {
  return token.replace(/~1/g, "/").replace(/~0/g, "~");
}

const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Immutable set-at-JSON-Pointer for the renderer's working copy of the data
 * model. Mirrors the store's upsert semantics (root replace, delete on
 * `undefined`, array creation) but returns a fresh object graph so React sees
 * a new reference.
 */
function setAtPathImmutable(
  root: Record<string, unknown>,
  path: string,
  value: unknown
): Record<string, unknown> {
  if (path === "/" || path === "") {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return { ...(value as Record<string, unknown>) };
    }
    return root;
  }

  const parts = path.replace(/^\//, "").split("/").map(decodeToken);

  if (parts.some((part) => UNSAFE_KEYS.has(part))) {
    return root;
  }

  const clone = Array.isArray(root) ? [...root] : { ...root };
  let cursor: Record<string, unknown> = clone as Record<string, unknown>;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const nextIsArray = /^\d+$/.test(parts[i + 1]);
    const existing = cursor[part];
    const copied =
      existing === null || typeof existing !== "object"
        ? nextIsArray
          ? []
          : {}
        : Array.isArray(existing)
          ? [...existing]
          : { ...(existing as Record<string, unknown>) };
    cursor[part] = copied;
    cursor = copied as Record<string, unknown>;
  }

  const last = parts[parts.length - 1];
  if (value === undefined) {
    if (Array.isArray(cursor) && /^\d+$/.test(last)) {
      (cursor as unknown[]).splice(Number(last), 1);
    } else {
      delete cursor[last];
    }
  } else {
    cursor[last] = value;
  }

  return clone as Record<string, unknown>;
}

// ============================================================================
// Validation
// ============================================================================

function checksOf(component: SurfaceComponent): CheckRule[] | undefined {
  const checks = (component as { checks?: unknown }).checks;
  return Array.isArray(checks) ? (checks as CheckRule[]) : undefined;
}

/**
 * Field-level validation. Errors surface only after the field is "touched"
 * (changed or blurred) so a form doesn't shout before the user has typed.
 */
function useFieldValidation(currentValue: unknown, checks: CheckRule[] | undefined) {
  const [touched, setTouched] = useState(false);
  const error = touched ? runChecks(currentValue, checks) : null;
  return { error, markTouched: () => setTouched(true) };
}

function FieldError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <span role="alert" className="text-[10px] font-mono text-[var(--aesthetic-error)]">
      {error}
    </span>
  );
}

// ============================================================================
// Layout: Row / Column / List
// ============================================================================

/**
 * Map a preset's CSS easing string to a framer-motion-compatible easing.
 * Named CSS keywords become framer's camelCase names; a `cubic-bezier(a,b,c,d)`
 * becomes the 4-tuple framer expects; `steps(...)` (nostromo's terminal feel)
 * has no transform-friendly framer equivalent, so it falls back to "linear",
 * which still reads as a flat, mechanical reveal alongside its tiny duration.
 */
function mapEasing(
  easing: string
): "easeOut" | "easeInOut" | "linear" | [number, number, number, number] {
  if (easing === "ease-out") return "easeOut";
  if (easing === "ease-in-out") return "easeInOut";
  const cubic = easing.match(
    /cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/
  );
  if (cubic) {
    return [Number(cubic[1]), Number(cubic[2]), Number(cubic[3]), Number(cubic[4])];
  }
  return "linear";
}

/**
 * The "hidden" (pre-reveal) offset for a surface child, keyed off the preset's
 * motion-personality entrance. All start invisible (opacity 0) and animate to a
 * shared settled target (y/x 0, scale 1) — only the starting offset differs, so
 * each preset's content arrives with its own physics:
 *   • cinematic (noir)   — drifts up and in from the lower-left like a slow pan.
 *   • glitch (cyber)     — snaps up from a slightly shrunk "boot-up" scale.
 *   • terminal (nostromo)— prints downward from above, like a new console line.
 *   • candle (gothic)    — swells up from a small, flickering candlelit scale.
 *   • crisp (minimal)    — a short, clean hop with no scale flourish.
 * Translate distances stay small (≤12px) so the stagger reads as poise, not
 * jank. Reduced-motion callers skip the motion wrapper entirely, so this is
 * never used under `prefers-reduced-motion`.
 */
function entranceHiddenVariant(entrance: MotionPersonality["entrance"]): {
  opacity: number;
  y?: number;
  x?: number;
  scale?: number;
} {
  switch (entrance) {
    case "cinematic":
      return { opacity: 0, y: 12, x: -4 };
    case "glitch":
      return { opacity: 0, y: 6, scale: 0.94 };
    case "terminal":
      return { opacity: 0, y: -6 };
    case "candle":
      return { opacity: 0, y: 4, scale: 0.96 };
    case "crisp":
    default:
      return { opacity: 0, y: 5 };
  }
}

/**
 * Render a component's children. `children` is the raw childList field: either
 * a static `string[]` or a template `{ componentId, path }`. Template-expanded
 * children carry a per-item scope, provided to descendants via ScopeContext.
 *
 * When `applyWeight` is set (Row/Column only, per the A2UI spec: `weight` is
 * "similar to CSS flex-grow ... ONLY when a direct descendant of a Row or
 * Column"), a child with a positive numeric `weight` is wrapped in a flex item
 * that grows proportionally. Unweighted children stay as plain flex items.
 *
 * Each child also gets a staggered framer-motion entrance keyed off the active
 * world's motion personality (duration / stagger / easing). Critically, the
 * motion element IS the weight wrapper when a child is weighted (never an extra
 * box around a weighted flex item), so Row/Column flex-grow math is preserved.
 * Honors prefers-reduced-motion by rendering plain, un-animated children.
 */
function ChildList({
  childList,
  applyWeight = false,
}: {
  childList: unknown;
  applyWeight?: boolean;
}) {
  const { getComponent, dataModel } = useSurfaceContext();
  const baseAestheticId = useBaseAestheticId();
  const prefersReducedMotion = useReducedMotion();
  const resolved = resolveChildList(childList, dataModel);

  const motionPersonality = getMotionPersonality(baseAestheticId);
  const childTransition = {
    duration: motionPersonality.durationMs / 1000,
    ease: mapEasing(motionPersonality.easing),
  };
  const staggerStep = motionPersonality.staggerMs / 1000;
  // Each child reveals itself with its own initial→animate + a per-index delay,
  // NOT via a parent `staggerChildren` orchestrator. A parent conductor can be
  // interrupted mid-cascade when a child subtree re-renders (e.g. a generated
  // <img> finishes loading the instant a take is shown), which strands the
  // not-yet-cued siblings permanently at their hidden opacity:0. Self-contained
  // per-child animation is interruption-proof: `animate` is a fixed target
  // framer-motion settles on and never reverts from, across re-renders/remounts.
  //
  // `hiddenTarget` carries each preset's arrival physics, so a child doesn't
  // just fade up uniformly — it materializes in character: noir drifts in from
  // the lower-left, cyber snaps from a shrunk "boot" scale, nostromo prints down
  // like a terminal line, gothic swells from a candlelit scale, minimal makes a
  // short crisp hop. `showTarget` is the shared settled state (full opacity/size)
  // so every preset lands in the same place. Reduced-motion never reaches here.
  const hiddenTarget = entranceHiddenVariant(motionPersonality.entrance);
  const showTarget = { opacity: 1, y: 0, x: 0, scale: 1 };

  // Reduced-motion: render plain children with no motion wrapper at all, so the
  // weighted flex items keep their exact layout and nothing animates.
  if (prefersReducedMotion) {
    return (
      <>
        {resolved.map(({ componentId, scope, key }) => {
          const child = getComponent(componentId);
          if (!child) return <MissingComponent key={key} id={componentId} />;
          let node = <ComponentRenderer component={child} />;
          const weight = (child as { weight?: unknown }).weight;
          if (applyWeight && typeof weight === "number" && weight > 0) {
            node = (
              <div style={{ flexGrow: weight }} className="min-w-0">
                {node}
              </div>
            );
          }
          return scope !== undefined ? (
            <ScopeContext.Provider key={key} value={scope}>
              {node}
            </ScopeContext.Provider>
          ) : (
            <React.Fragment key={key}>{node}</React.Fragment>
          );
        })}
      </>
    );
  }

  // No parent wrapper: each child animates independently (so there is no
  // orchestrator box to insert, and nothing to interrupt). The motion children
  // remain the parent Row/Column/Grid/List's own direct flex/grid items, same
  // as before when the wrapper used `display: contents`.
  return (
    <>
      {resolved.map(({ componentId, scope, key }, index) => {
        const child = getComponent(componentId);
        if (!child) return <MissingComponent key={key} id={componentId} />;
        const weight = (child as { weight?: unknown }).weight;
        const weighted = applyWeight && typeof weight === "number" && weight > 0;
        // Per-child reveal: initial=hidden → animate=show with a per-index delay
        // that reproduces the stagger, but self-contained so a mid-flight
        // re-render can never strand a later sibling at opacity:0. The motion
        // element IS the weight wrapper when weighted (flexGrow on the animated
        // box), so Row/Column flex-grow math is preserved; unweighted children
        // get a minimal animated wrapper that sizes to its content.
        const childTransitionWithDelay = { ...childTransition, delay: index * staggerStep };
        const node = weighted ? (
          <motion.div
            initial={hiddenTarget}
            animate={showTarget}
            transition={childTransitionWithDelay}
            style={{ flexGrow: weight }}
            className="min-w-0"
          >
            <ComponentRenderer component={child} />
          </motion.div>
        ) : (
          <motion.div
            initial={hiddenTarget}
            animate={showTarget}
            transition={childTransitionWithDelay}
          >
            <ComponentRenderer component={child} />
          </motion.div>
        );
        return scope !== undefined ? (
          <ScopeContext.Provider key={key} value={scope}>
            {node}
          </ScopeContext.Provider>
        ) : (
          <React.Fragment key={key}>{node}</React.Fragment>
        );
      })}
    </>
  );
}

function RowRenderer({ component }: ComponentProps) {
  const row = component as SurfaceComponent & { justify?: string; align?: string };
  return (
    <div
      className={cn(
        // flex-wrap so a tight row (e.g. a strip of badges) wraps instead of
        // overflowing/compressing its children.
        "flex flex-row flex-wrap gap-2",
        row.justify === "center" && "justify-center",
        row.justify === "end" && "justify-end",
        row.justify === "spaceBetween" && "justify-between",
        row.justify === "spaceAround" && "justify-around",
        row.justify === "spaceEvenly" && "justify-evenly",
        row.align === "center" ? "items-center" : "items-start",
        row.align === "end" && "items-end",
        row.align === "stretch" && "items-stretch"
      )}
    >
      <ChildList childList={(component as { children?: unknown }).children} applyWeight />
    </div>
  );
}

function ColumnRenderer({ component }: ComponentProps) {
  const col = component as SurfaceComponent & { justify?: string; align?: string };
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        col.justify === "center" && "justify-center",
        col.justify === "end" && "justify-end",
        col.align === "center" && "items-center",
        col.align === "end" && "items-end",
        col.align === "stretch" && "items-stretch"
      )}
    >
      <ChildList childList={(component as { children?: unknown }).children} applyWeight />
    </div>
  );
}

function ListRenderer({ component }: ComponentProps) {
  const list = component as SurfaceComponent & { direction?: string };
  return (
    <div
      className={cn(
        "flex gap-2",
        list.direction === "horizontal" ? "flex-row overflow-x-auto" : "flex-col"
      )}
    >
      <ChildList childList={(component as { children?: unknown }).children} />
    </div>
  );
}

// ============================================================================
// Layout: Card / Divider / Tabs / Modal
// ============================================================================

/**
 * Deterministic small tilt (in degrees, as a CSS string) hashed from a stable
 * id string — the same djb2-style hash PhotoDeveloper uses for its photo
 * rotation. Keeps the result in a tasteful, symmetric range so paper dossier
 * cards read as evidence casually laid on a desk without ever using
 * Math.random / Date.now (which would re-roll every render and break SSR).
 */
function deterministicTilt(seed: string, rangeDeg: number): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  // `hash` is a signed int32 and often negative; JS `%` keeps the sign, so use
  // the unsigned value to keep the tilt in a symmetric -range..+range spread.
  const steps = rangeDeg * 20; // 0.1deg granularity
  const val = ((hash >>> 0) % (steps + 1)) / 10 - rangeDeg;
  return `${val}deg`;
}

function CardRenderer({ component }: ComponentProps) {
  const { getComponent } = useSurfaceContext();
  const baseAestheticId = useBaseAestheticId();
  const card = component as SurfaceComponent & { child?: string };

  const childComponent = card.child ? getComponent(card.child) : null;
  const body = childComponent ? (
    <ComponentRenderer component={childComponent} />
  ) : (
    <MissingComponent id={card.child || "unknown"} />
  );

  // Data-driven card material: the effects profile (paper/parchment/hologram/
  // wireframe/flat) is emitted as `data-effect-card` so the per-material rules
  // in globals.css (scoped to `[data-effect-card="…"] .a2ui-card`) apply the
  // right treatment — aged paper for noir, neon hologram for cyber, green
  // wireframe for nostromo, parchment for gothic, clean flat surface for
  // minimal. Each material rule also re-asserts a contrast-correct body text
  // color so dark ink reads on light paper/parchment. The Tailwind classes here
  // are the dark base fallback for renders without a resolved material (e.g.
  // unit tests, which assert the thin amber `border-t-2` top accent stays).
  const effects = getEffectsProfile(baseAestheticId);

  // Signature touch — paper (noir) only: a slight deterministic tilt so the
  // aged-paper dossier reads as evidence casually laid on a desk. The hash is
  // seeded on the component id (stable across renders/SSR), and the coffee-stain
  // + corner-tape decoration is layered on in globals.css. Other materials keep
  // their crisp, un-tilted alignment.
  const tiltStyle =
    effects.card === "paper"
      ? ({ transform: `rotate(${deterministicTilt(component.id, 1.2)})` } as React.CSSProperties)
      : undefined;

  return (
    <div
      data-effect-card={effects.card}
      style={tiltStyle}
      className={cn(
        // `relative` anchors the per-material ::before/::after decorations
        // (coffee-stain, corner-tape, HUD brackets, wax seal) defined in
        // globals.css to the card box.
        "a2ui-card relative rounded-sm border border-[var(--aesthetic-border)]/30 bg-[var(--aesthetic-surface)]/60 p-5",
        "border-t-2 border-t-[var(--aesthetic-accent)]/60 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
      )}
    >
      {body}
    </div>
  );
}

function DividerRenderer({ component }: ComponentProps) {
  const divider = component as SurfaceComponent & { axis?: string };
  return (
    <hr
      className={cn(
        "border-[var(--aesthetic-border)]/30",
        divider.axis === "vertical" ? "border-l h-full w-0" : "border-t w-full h-0"
      )}
    />
  );
}

// Table — a real grid with a header band and zebra/hover rows. Not part of the
// upstream v0.9 catalog, but emitted by the legacy→catalog adapter so legacy
// `table` components render properly instead of as flattened text.
function TableRenderer({ component }: ComponentProps) {
  const table = component as SurfaceComponent & { columns?: unknown; rows?: unknown };
  const columns = Array.isArray(table.columns) ? (table.columns as unknown[]).map(String) : [];
  const rows = Array.isArray(table.rows)
    ? (table.rows as unknown[]).map((r) => (Array.isArray(r) ? r.map(String) : [String(r)]))
    : [];

  if (columns.length === 0 && rows.length === 0) {
    return <MissingComponent id={`${component.id} (empty table)`} />;
  }

  return (
    <div className="overflow-x-auto rounded-[var(--aesthetic-radius,2px)] border border-[var(--aesthetic-border)]/30">
      <table className="w-full border-collapse font-mono text-sm">
        {columns.length > 0 && (
          <thead>
            <tr className="bg-[var(--aesthetic-accent)]/10 border-b border-[var(--aesthetic-accent)]/30">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="text-left px-3 py-2 font-typewriter text-xs uppercase tracking-widest text-[var(--aesthetic-accent)]/90 whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, r) => (
            <tr
              key={r}
              className={cn(
                "border-b border-[var(--aesthetic-border)]/15 last:border-0 transition-colors hover:bg-[var(--aesthetic-text)]/5",
                r % 2 === 1 && "bg-[var(--aesthetic-text)]/[0.03]"
              )}
            >
              {row.map((cell, c) => (
                <td key={c} className="px-3 py-2 text-[var(--aesthetic-text)]/85 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Stat — a compact metric tile with an accent rule, label, and big value.
// Adapter-emitted (not in the upstream catalog) so legacy `stat` reads as a
// Badge — a small status pill. Adapter-emitted (not in the upstream catalog).
// The legacy variant tokens (primary/secondary/ghost/danger) map to pill colors.
function BadgeRenderer({ component }: ComponentProps) {
  const resolve = useResolve();
  const badge = component as SurfaceComponent & { label?: unknown; variant?: string };
  const label = String(resolve(badge.label) ?? "");
  const variant = badge.variant ?? "secondary";

  const variantClass =
    variant === "danger"
      ? "border-[var(--aesthetic-error)]/50 bg-[var(--aesthetic-error)]/15 text-[var(--aesthetic-error)]"
      : variant === "primary"
        ? "border-[var(--aesthetic-accent)]/50 bg-[var(--aesthetic-accent)]/15 text-[var(--aesthetic-accent)]"
        : variant === "ghost"
          ? "border-[var(--aesthetic-border)]/40 bg-transparent text-[var(--aesthetic-text)]/70"
          : "border-[var(--aesthetic-border)]/50 bg-[var(--aesthetic-text)]/10 text-[var(--aesthetic-text)]/85";

  return (
    <span
      className={cn(
        // shrink-0 + whitespace-nowrap keep the pill intact in a tight Row
        // (otherwise flex compresses it and the text clips against the border).
        "inline-flex shrink-0 items-center w-fit whitespace-nowrap rounded-full border px-3 py-1 font-typewriter text-[10px] uppercase tracking-wider leading-none",
        variantClass
      )}
    >
      {label}
    </span>
  );
}

// Grid — a real CSS grid so multi-column layouts aren't flattened to a stack.
function GridRenderer({ component }: ComponentProps) {
  const grid = component as SurfaceComponent & { columns?: unknown };
  const cols = Number(grid.columns);
  const colsClass =
    cols === 4
      ? "grid-cols-2 sm:grid-cols-4"
      : cols === 3
        ? "grid-cols-2 sm:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2";
  return (
    <div className={cn("grid gap-3", colsClass)}>
      <ChildList childList={(component as { children?: unknown }).children} />
    </div>
  );
}

// proper KPI rather than loose stacked text.
function StatRenderer({ component }: ComponentProps) {
  const resolve = useResolve();
  const stat = component as SurfaceComponent & {
    label?: unknown;
    value?: unknown;
    helper?: unknown;
  };
  const label = String(resolve(stat.label) ?? "");
  const value = String(resolve(stat.value) ?? "");
  const helper = stat.helper ? String(resolve(stat.helper)) : "";

  return (
    <div className="flex flex-col gap-1 border-l-2 border-[var(--aesthetic-accent)]/60 bg-[var(--aesthetic-text)]/[0.03] px-3 py-2 rounded-sm">
      <span className="font-typewriter text-[10px] uppercase tracking-widest text-[var(--aesthetic-text)]/55">
        {label}
      </span>
      <span className="font-typewriter text-2xl font-bold text-[var(--aesthetic-accent)] tabular-nums leading-none">
        {value}
      </span>
      {helper && (
        <span className="font-mono text-[10px] text-[var(--aesthetic-text)]/50">{helper}</span>
      )}
    </div>
  );
}

interface TabItem {
  title?: unknown;
  child?: string;
}

function TabsRenderer({ component }: ComponentProps) {
  const { getComponent } = useSurfaceContext();
  const resolve = useResolve();
  const tabs = component as SurfaceComponent & { tabs?: TabItem[] };
  const items = Array.isArray(tabs.tabs) ? tabs.tabs : [];
  const [active, setActive] = useState(0);

  if (items.length === 0) {
    return <MissingComponent id={`${component.id} (no tabs)`} />;
  }

  const safeActive = Math.min(active, items.length - 1);
  const activeChild = items[safeActive]?.child ? getComponent(items[safeActive].child!) : null;

  return (
    <div className="flex flex-col gap-3">
      <div
        role="tablist"
        className="flex flex-row gap-1 border-b border-[var(--aesthetic-border)]/30"
      >
        {items.map((tab, index) => {
          const title = String(resolve(tab.title) ?? `Tab ${index + 1}`);
          const selected = index === safeActive;
          return (
            <button
              key={`${component.id}-tab-${index}`}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => setActive(index)}
              className={cn(
                "px-3 py-1.5 font-typewriter text-xs uppercase tracking-widest transition-colors -mb-px border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]",
                selected
                  ? "border-[var(--aesthetic-accent)] text-[var(--aesthetic-accent)]"
                  : "border-transparent text-[var(--aesthetic-text)]/60 hover:text-[var(--aesthetic-accent)]"
              )}
            >
              {title}
            </button>
          );
        })}
      </div>
      <div role="tabpanel">
        {activeChild ? (
          <ComponentRenderer component={activeChild} />
        ) : (
          <MissingComponent id={items[safeActive]?.child || "unknown"} />
        )}
      </div>
    </div>
  );
}

function ModalRenderer({ component }: ComponentProps) {
  const { getComponent } = useSurfaceContext();
  const modal = component as SurfaceComponent & { trigger?: string; content?: string };
  const [open, setOpen] = useState(false);

  const trigger = modal.trigger ? getComponent(modal.trigger) : null;
  const content = modal.content ? getComponent(modal.content) : null;

  return (
    <>
      <div
        onClickCapture={() => setOpen(true)}
        className="inline-block cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {trigger ? <ComponentRenderer component={trigger} /> : <MissingComponent id="trigger" />}
      </div>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-h-[85vh] max-w-lg overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close dialog"
              className="absolute right-2 top-2 z-10 px-2 py-1 font-mono text-xs text-[var(--aesthetic-text)]/70 hover:text-[var(--aesthetic-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]"
            >
              ✕
            </button>
            {content ? (
              <ComponentRenderer component={content} />
            ) : (
              <MissingComponent id="content" />
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================================
// Content: Text / Image / Icon / Video / AudioPlayer
// ============================================================================

/**
 * Map the preset's `headerCase` style token to a Tailwind case-transform class
 * applied to surface heading levels (h1–h5) only — body/caption text keeps its
 * authored casing. uppercase → noir/cyber/nostromo, titlecase → gothic,
 * normal → minimal.
 */
function headerCaseClass(headerCase: StyleTokens["headerCase"]): string {
  switch (headerCase) {
    case "uppercase":
      return "uppercase";
    case "titlecase":
      return "capitalize";
    default:
      return "normal-case";
  }
}

function TextRenderer({ component }: ComponentProps) {
  const resolve = useResolve();
  const baseAestheticId = useBaseAestheticId();
  const text = component as SurfaceComponent & { text?: unknown; variant?: string };

  const content = String(resolve(text.text) ?? "");
  const variant = text.variant || "body";
  const baseClass = "text-[var(--aesthetic-text)] font-mono";
  // Heading case is data-driven from the active world's style tokens so each
  // preset's headings read in character (UPPERCASE noir, Title Gothic, normal
  // minimal) without per-aesthetic branches at the call site.
  const headingCase = headerCaseClass(getStyleTokens(baseAestheticId).headerCase);
  // `a2ui-heading` is the hook for the per-preset editorial heading treatment in
  // globals.css (letter-spacing + weight tuned to each aesthetic), so noir reads
  // as a wide stamped slug, cyber as a tight neon label, nostromo as a spaced
  // terminal banner, gothic as an airy engraved title, and minimal as a calm
  // sans — without swapping the loaded face (which would erase noir's signature
  // typewriter headers). It reaches custom profiles through their base preset.
  const headingClass = "a2ui-heading";

  switch (variant) {
    case "h1":
      return (
        <h1
          className={cn(
            baseClass,
            headingClass,
            headingCase,
            "text-3xl font-bold font-typewriter mb-4"
          )}
        >
          {content}
        </h1>
      );
    case "h2":
      return (
        <h2
          className={cn(
            baseClass,
            headingClass,
            headingCase,
            "text-2xl font-bold font-typewriter mb-3"
          )}
        >
          {content}
        </h2>
      );
    case "h3":
      return (
        <h3
          className={cn(
            baseClass,
            headingClass,
            headingCase,
            "text-xl font-bold font-typewriter mb-2"
          )}
        >
          {content}
        </h3>
      );
    case "h4":
      return (
        <h4 className={cn(baseClass, headingClass, headingCase, "text-lg font-semibold mb-2")}>
          {content}
        </h4>
      );
    case "h5":
      return (
        <h5 className={cn(baseClass, headingClass, headingCase, "text-base font-semibold mb-1")}>
          {content}
        </h5>
      );
    case "caption":
      return <span className={cn(baseClass, "text-xs opacity-70")}>{content}</span>;
    default:
      return <p className={cn(baseClass, "text-sm leading-relaxed")}>{content}</p>;
  }
}

function ImageRenderer({ component }: ComponentProps) {
  const resolve = useResolve();
  const img = component as SurfaceComponent & {
    url?: unknown;
    fit?: string;
    variant?: string;
    accessibility?: { label?: unknown };
  };

  const url = String(resolve(img.url) ?? "");
  const alt = img.accessibility?.label ? String(resolve(img.accessibility.label)) : "Image";

  if (!url) {
    return (
      <div className="border border-[var(--aesthetic-border)]/40 bg-[var(--aesthetic-background)]/35 px-4 py-3 rounded-sm text-xs font-mono text-[var(--aesthetic-text)]/70">
        IMAGE PENDING
      </div>
    );
  }

  const caption = img.accessibility?.label ? String(resolve(img.accessibility.label)) : undefined;

  return (
    <PhotoDeveloper src={url} alt={alt} fit={img.fit} variant={img.variant} caption={caption} />
  );
}

// Curated semantic-name → lucide glyph map. Keys are normalized (lowercase,
// non-alphanumerics stripped) so both `file-text` and `fileText`/`filetext`
// resolve to the same icon. Unmapped names fall back to HelpCircle.
const ICON_MAP: Record<string, LucideIcon> = {
  help: HelpCircle,
  search: Search,
  user: User,
  users: Users,
  file: File,
  filetext: FileText,
  folder: Folder,
  lock: Lock,
  unlock: Unlock,
  alert: AlertTriangle,
  alerttriangle: AlertTriangle,
  alertcircle: AlertCircle,
  check: Check,
  checkcircle: CheckCircle,
  x: X,
  info: Info,
  star: Star,
  heart: Heart,
  mail: Mail,
  phone: Phone,
  calendar: Calendar,
  clock: Clock,
  settings: Settings,
  home: Home,
  mappin: MapPin,
  camera: Camera,
  image: ImageIcon,
  eye: Eye,
  shield: Shield,
  key: Key,
  database: Database,
  server: Server,
  cpu: Cpu,
  wifi: Wifi,
  zap: Zap,
  activity: Activity,
  trendingup: TrendingUp,
  trendingdown: TrendingDown,
  dollarsign: DollarSign,
  tag: Tag,
  bookmark: Bookmark,
  flag: Flag,
  bell: Bell,
  download: Download,
  upload: Upload,
  trash: Trash2,
  edit: Edit3,
  plus: Plus,
  minus: Minus,
  arrowright: ArrowRight,
  arrowleft: ArrowLeft,
  chevronright: ChevronRight,
  externallink: ExternalLink,
  link: LinkIcon,
  play: Play,
  pause: Pause,
  music: Music,
  volume: Volume2,
  mic: Mic,
  video: Video,
  terminal: Terminal,
  code: Code,
  book: Book,
  bookopen: BookOpen,
  feather: Feather,
  skull: Skull,
  moon: Moon,
  sun: Sun,
  cloud: Cloud,
  droplet: Droplet,
  flame: Flame,
};

/** Normalize an incoming icon name: lowercase + strip non-alphanumerics. */
function normalizeIconName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function IconRenderer({ component }: ComponentProps) {
  const resolve = useResolve();
  const icon = component as SurfaceComponent & { name?: unknown };
  const name = String(resolve(icon.name) ?? "help");
  const Glyph = ICON_MAP[normalizeIconName(name)] ?? HelpCircle;
  return <Glyph className="w-5 h-5 text-[var(--aesthetic-accent)]" aria-label={name} role="img" />;
}

function VideoRenderer({ component }: ComponentProps) {
  const resolve = useResolve();
  const video = component as SurfaceComponent & {
    url?: unknown;
    accessibility?: { label?: unknown };
  };
  const url = String(resolve(video.url) ?? "");
  const label = video.accessibility?.label ? String(resolve(video.accessibility.label)) : undefined;

  if (!url) {
    return (
      <div className="border border-[var(--aesthetic-border)]/40 bg-[var(--aesthetic-background)]/35 px-4 py-3 rounded-sm text-xs font-mono text-[var(--aesthetic-text)]/70">
        FOOTAGE PENDING
      </div>
    );
  }

  return (
    <video
      src={url}
      controls
      aria-label={label}
      className="block w-full max-w-full rounded-sm border border-[var(--aesthetic-border)]/40 sepia-[0.15]"
    />
  );
}

function AudioPlayerRenderer({ component }: ComponentProps) {
  const resolve = useResolve();
  const audio = component as SurfaceComponent & { url?: unknown; description?: unknown };
  const url = String(resolve(audio.url) ?? "");
  const description = audio.description ? String(resolve(audio.description)) : undefined;

  if (!url) {
    return (
      <div className="border border-[var(--aesthetic-border)]/40 bg-[var(--aesthetic-background)]/35 px-4 py-3 rounded-sm text-xs font-mono text-[var(--aesthetic-text)]/70">
        WIRE TAP PENDING
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {description && (
        <span className="font-typewriter text-[10px] uppercase tracking-[0.2em] text-[var(--aesthetic-text)]/60">
          {description}
        </span>
      )}
      <audio src={url} controls aria-label={description} className="w-full" />
    </div>
  );
}

// ============================================================================
// Input: Button / TextField / CheckBox / Slider / ChoicePicker / DateTimeInput
// ============================================================================

/** Extract a plain-text label from a button's child component (or `label`). */
function buttonLabel(
  btn: SurfaceComponent & { child?: string; label?: unknown },
  getComponent: (id: string) => SurfaceComponent | undefined,
  resolve: (value: unknown) => unknown
): string {
  if (btn.child) {
    const child = getComponent(btn.child) as (SurfaceComponent & { text?: unknown }) | undefined;
    if (child && typeof child.text !== "undefined") {
      return String(resolve(child.text) ?? "");
    }
  }
  if (typeof btn.label !== "undefined") return String(resolve(btn.label) ?? "");
  return "Submit";
}

function ButtonRenderer({ component }: ComponentProps) {
  const { getComponent, runAction } = useSurfaceContext();
  const resolve = useResolve();
  const btn = component as SurfaceComponent & {
    child?: string;
    label?: unknown;
    variant?: string;
    action?: unknown;
  };

  // Render the label as plain text with a contrast-correct color rather than
  // recursing into a Text component (which would re-assert the light surface
  // color and wash out against the filled amber background).
  const label = buttonLabel(btn, getComponent, resolve);
  const borderless = btn.variant === "borderless";

  return (
    <button
      type="button"
      onClick={() => runAction(btn.id, btn.action)}
      className={cn(
        "px-4 py-2.5 font-mono text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--aesthetic-background)] focus-visible:ring-[var(--aesthetic-accent)]",
        borderless
          ? "text-[var(--aesthetic-accent)] hover:text-[var(--aesthetic-accent)]/80 border border-[var(--aesthetic-accent)]/40 rounded-[var(--aesthetic-radius,2px)] hover:border-[var(--aesthetic-accent)]"
          : "bg-[var(--aesthetic-accent)] text-[var(--aesthetic-background)] hover:bg-[var(--aesthetic-accent)]/90 rounded-[var(--aesthetic-radius,2px)] shadow-[0_2px_12px_rgba(255,191,0,0.25)]"
      )}
    >
      {label}
    </button>
  );
}

function TextFieldRenderer({ component }: ComponentProps) {
  const { setData } = useSurfaceContext();
  const resolve = useResolve();
  const field = component as SurfaceComponent & {
    label?: unknown;
    value?: unknown;
    variant?: string;
  };

  const label = String(resolve(field.label) ?? "");
  const bindingPath = getBindingPath(field.value);
  const value = String(resolve(field.value) ?? "");
  const { error, markTouched } = useFieldValidation(value, checksOf(component));

  const fieldId = `surface-field-${field.id}`;
  const inputType =
    field.variant === "obscured" ? "password" : field.variant === "number" ? "number" : "text";

  const sharedClass = cn(
    "bg-[var(--aesthetic-background)]/60 border rounded-[var(--aesthetic-radius,2px)] px-3 py-2.5 text-[var(--aesthetic-text)] font-mono text-sm placeholder:text-[var(--aesthetic-text)]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]",
    error
      ? "border-[var(--aesthetic-error)]/70 focus:border-[var(--aesthetic-error)]"
      : "border-[var(--aesthetic-border)]/40 focus:border-[var(--aesthetic-accent)]"
  );

  const onChange = (next: string) => {
    markTouched();
    if (bindingPath) setData(bindingPath, next);
  };

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={fieldId}
          className="font-typewriter text-[10px] uppercase tracking-widest text-[var(--aesthetic-text)]/55"
        >
          {label}
        </label>
      )}
      {field.variant === "longText" ? (
        <textarea
          id={fieldId}
          rows={4}
          aria-invalid={Boolean(error)}
          // Controlled when bound, uncontrolled otherwise — a literal value is
          // a one-shot default, while a `{path}` binding is the source of truth.
          {...(bindingPath ? { value } : { defaultValue: value })}
          onChange={(e) => onChange(e.currentTarget.value)}
          onBlur={markTouched}
          className={sharedClass}
        />
      ) : (
        <input
          id={fieldId}
          type={inputType}
          aria-invalid={Boolean(error)}
          {...(bindingPath ? { value } : { defaultValue: value })}
          onChange={(e) => onChange(e.currentTarget.value)}
          onBlur={markTouched}
          className={sharedClass}
        />
      )}
      <FieldError error={error} />
    </div>
  );
}

function CheckBoxRenderer({ component }: ComponentProps) {
  const { setData } = useSurfaceContext();
  const resolve = useResolve();
  const cb = component as SurfaceComponent & { label?: unknown; value?: unknown };

  const label = String(resolve(cb.label) ?? "");
  const bindingPath = getBindingPath(cb.value);
  const checked = Boolean(resolve(cb.value));
  const { error, markTouched } = useFieldValidation(checked, checksOf(component));

  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-2 text-[var(--aesthetic-text)] font-mono text-sm cursor-pointer">
        <input
          type="checkbox"
          aria-invalid={Boolean(error)}
          {...(bindingPath ? { checked } : { defaultChecked: checked })}
          onChange={(e) => {
            markTouched();
            if (bindingPath) setData(bindingPath, e.currentTarget.checked);
          }}
          className="w-4 h-4 accent-[var(--aesthetic-accent)] [color-scheme:dark] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]"
        />
        {label}
      </label>
      <FieldError error={error} />
    </div>
  );
}

function SliderRenderer({ component }: ComponentProps) {
  const { setData } = useSurfaceContext();
  const resolve = useResolve();
  const slider = component as SurfaceComponent & {
    label?: unknown;
    min?: number;
    max?: number;
    step?: number;
    value?: unknown;
  };

  const label = slider.label ? String(resolve(slider.label)) : "Range";
  const min = typeof slider.min === "number" ? slider.min : 0;
  const max = typeof slider.max === "number" ? slider.max : 100;
  const step = typeof slider.step === "number" && slider.step > 0 ? slider.step : undefined;
  const bindingPath = getBindingPath(slider.value);
  const resolved = resolve(slider.value);
  const value = typeof resolved === "number" ? resolved : Number(resolved) || min;

  return (
    <label className="flex flex-col gap-2 text-xs w-full">
      <div className="flex justify-between items-end">
        <span className="font-typewriter text-[var(--aesthetic-text)]/70">{label}</span>
        <span className="font-mono text-[var(--aesthetic-text)] tabular-nums">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        {...(step !== undefined ? { step } : {})}
        {...(bindingPath ? { value } : { defaultValue: value })}
        onChange={(e) => {
          if (bindingPath) setData(bindingPath, Number(e.currentTarget.value));
        }}
        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[var(--aesthetic-accent)] bg-[var(--aesthetic-text)]/15 border border-[var(--aesthetic-border)]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]"
      />
    </label>
  );
}

interface ChoiceOption {
  label?: unknown;
  value: string;
}

function ChoicePickerRenderer({ component }: ComponentProps) {
  const { setData } = useSurfaceContext();
  const resolve = useResolve();
  const picker = component as SurfaceComponent & {
    label?: unknown;
    variant?: string;
    options?: ChoiceOption[];
    value?: unknown;
  };

  const label = picker.label ? String(resolve(picker.label)) : "";
  const options = Array.isArray(picker.options) ? picker.options : [];
  const bindingPath = getBindingPath(picker.value);
  const resolved = resolve(picker.value);
  const boundSelected: string[] = Array.isArray(resolved)
    ? (resolved as string[])
    : typeof resolved === "string" && resolved
      ? [resolved]
      : [];

  // When there's no `{path}` binding (e.g. a literal default), the picker is
  // uncontrolled — track the selection locally so clicks still register.
  const [localSelected, setLocalSelected] = useState<string[]>(boundSelected);
  const selected = bindingPath ? boundSelected : localSelected;
  const { error, markTouched } = useFieldValidation(selected, checksOf(component));

  const multiple = picker.variant === "multipleSelection";

  const toggle = (optValue: string) => {
    markTouched();
    const next = multiple
      ? selected.includes(optValue)
        ? selected.filter((v) => v !== optValue)
        : [...selected, optValue]
      : [optValue];
    if (bindingPath) {
      setData(bindingPath, next);
    } else {
      setLocalSelected(next);
    }
  };

  return (
    <fieldset className="flex flex-col gap-1.5 text-sm">
      {label && (
        <legend className="font-typewriter text-[10px] uppercase tracking-widest text-[var(--aesthetic-text)]/55 mb-1">
          {label}
        </legend>
      )}
      {options.map((option) => {
        const optLabel = String(resolve(option.label) ?? option.value);
        const isSelected = selected.includes(option.value);
        return (
          <label
            key={option.value}
            className={cn(
              "flex items-center gap-2.5 font-mono cursor-pointer rounded-sm px-2 py-1.5 border transition-colors",
              isSelected
                ? "border-[var(--aesthetic-accent)]/50 bg-[var(--aesthetic-accent)]/10 text-[var(--aesthetic-text)]"
                : "border-[var(--aesthetic-border)]/20 text-[var(--aesthetic-text)]/80 hover:border-[var(--aesthetic-border)]/40"
            )}
          >
            <input
              type={multiple ? "checkbox" : "radio"}
              name={`choice-${component.id}`}
              checked={isSelected}
              onChange={() => toggle(option.value)}
              className="w-4 h-4 accent-[var(--aesthetic-accent)] [color-scheme:dark] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]"
            />
            {optLabel}
          </label>
        );
      })}
      <FieldError error={error} />
    </fieldset>
  );
}

function DateTimeInputRenderer({ component }: ComponentProps) {
  const { setData } = useSurfaceContext();
  const resolve = useResolve();
  const dti = component as SurfaceComponent & {
    label?: unknown;
    value?: unknown;
    enableDate?: boolean;
    enableTime?: boolean;
    min?: unknown;
    max?: unknown;
    accessibility?: { label?: unknown };
  };

  const bindingPath = getBindingPath(dti.value);
  const value = String(resolve(dti.value) ?? "");
  // Prefer the top-level `label`; fall back to the accessibility label.
  const labelSource = dti.label ?? dti.accessibility?.label;
  const label = labelSource ? String(resolve(labelSource)) : undefined;
  const min = dti.min != null ? String(resolve(dti.min) ?? "") : undefined;
  const max = dti.max != null ? String(resolve(dti.max) ?? "") : undefined;
  const { error, markTouched } = useFieldValidation(value, checksOf(component));

  // Default to date when neither flag is set; pick the closest native type.
  const enableDate = dti.enableDate ?? true;
  const enableTime = dti.enableTime ?? false;
  const inputType =
    enableDate && enableTime ? "datetime-local" : enableTime && !enableDate ? "time" : "date";

  const fieldId = `surface-datetime-${dti.id}`;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={fieldId}
          className="font-typewriter text-[10px] uppercase tracking-widest text-[var(--aesthetic-text)]/55"
        >
          {label}
        </label>
      )}
      <input
        id={fieldId}
        type={inputType}
        aria-invalid={Boolean(error)}
        {...(min ? { min } : {})}
        {...(max ? { max } : {})}
        {...(bindingPath ? { value } : { defaultValue: value })}
        onChange={(e) => {
          markTouched();
          if (bindingPath) setData(bindingPath, e.currentTarget.value);
        }}
        onBlur={markTouched}
        className="bg-[var(--aesthetic-surface)] border border-[var(--aesthetic-border)]/30 rounded-sm px-3 py-2 text-[var(--aesthetic-text)] font-mono text-sm focus:border-[var(--aesthetic-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)] [color-scheme:dark]"
      />
      <FieldError error={error} />
    </div>
  );
}

function KanbanBoardRenderer({ component }: ComponentProps) {
  const board = component as SurfaceComponent & {
    title?: unknown;
    columns?: Array<{
      id: string;
      title: string;
      cards: Array<{
        id: string;
        title: string;
        description?: string;
        assignee?: string;
        tags?: string[];
      }>;
    }>;
  };

  const resolve = useResolve();
  const baseAestheticId = useBaseAestheticId();
  const boardTitle = board.title ? String(resolve(board.title)) : "";
  const columns = board.columns || [];

  // Shared, var-driven base styling. Color comes entirely from the aesthetic
  // CSS vars, so noir/minimal/gothic and every custom profile adapt for free
  // without their own switch arm. Decoration is now driven by the effects
  // profile rather than a hardcoded preset id, so a custom profile whose base
  // is nostromo/cyber (or whose effects use scanlines/phosphor/hologram) gets
  // the matching treatment too.
  const effects = getEffectsProfile(baseAestheticId);
  const scanlines = effects.screen === "scanlines";
  const phosphor = effects.screen === "phosphor";
  const hologram = effects.card === "hologram";
  const wireframe = effects.card === "wireframe";

  const containerClass = cn(
    "font-mono text-[var(--aesthetic-text)] p-4 bg-[var(--aesthetic-background)] border border-[var(--aesthetic-border)]/40 rounded-sm",
    scanlines && "crt-scanlines",
    phosphor && "crt-glow",
    hologram && "shadow-[0_0_10px_#06b6d4,inset_0_0_5px_#06b6d4]"
  );
  const columnClass = cn(
    "bg-[var(--aesthetic-surface)]/40 border border-[var(--aesthetic-border)]/20 rounded-sm p-3 min-w-[280px] max-w-[320px]",
    hologram && "shadow-[0_0_5px_rgba(6,182,212,0.1)]"
  );
  const cardClass = cn(
    "bg-[var(--aesthetic-surface)]/80 border border-[var(--aesthetic-border)]/30 p-3 rounded-sm text-[var(--aesthetic-text)] break-words whitespace-normal shadow-sm hover:border-[var(--aesthetic-accent)]/55 transition-colors",
    wireframe && "shadow-[0_0_4px_rgba(34,197,94,0.2)]",
    hologram &&
      "border-[var(--aesthetic-accent-muted)]/60 shadow-[0_0_8px_#06b6d4] hover:shadow-[0_0_12px_#06b6d4] transition-shadow duration-200"
  );
  const textClass = "text-xs text-[var(--aesthetic-text)]/75 leading-relaxed font-typewriter";
  const titleClass = "font-bold text-sm text-[var(--aesthetic-accent)] mb-1 font-typewriter";
  const headerClass =
    "font-typewriter font-bold text-lg mb-4 text-[var(--aesthetic-text)] uppercase tracking-widest border-b border-[var(--aesthetic-border)]/30 pb-2";

  // Handle zero columns or zero cards gracefully
  if (columns.length === 0) {
    return (
      <div className={containerClass}>
        {boardTitle && <div className={headerClass}>{boardTitle}</div>}
        <div className="text-center py-8 opacity-65 text-xs">Empty board state</div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {boardTitle && <div className={headerClass}>{boardTitle}</div>}
      <div className="flex flex-row gap-4 overflow-x-auto pb-4 items-start scrollbar-thin scrollbar-thumb-neutral-800">
        {columns.map((column) => (
          <div key={column.id} className={columnClass}>
            <div className={cn(titleClass, "font-bold border-b pb-1 mb-3 border-current/25")}>
              {column.title} ({column.cards?.length || 0})
            </div>
            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {!column.cards || column.cards.length === 0 ? (
                <div className="text-center py-6 opacity-50 text-xs italic">No cards</div>
              ) : (
                column.cards.map((card) => (
                  <div key={card.id} className={cardClass}>
                    <div className="font-bold text-sm leading-snug mb-1.5 break-words whitespace-normal">
                      {card.title}
                    </div>
                    {card.description && (
                      <p className={cn(textClass, "mb-2 break-words whitespace-normal")}>
                        {card.description}
                      </p>
                    )}
                    {card.assignee && (
                      <div className="text-[10px] opacity-75 mt-1 font-mono break-words whitespace-normal">
                        👤 {card.assignee}
                      </div>
                    )}
                    {card.tags && card.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {card.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wide bg-current/10 text-current break-words whitespace-normal"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DataDashboardRenderer({ component }: ComponentProps) {
  const dash = component as SurfaceComponent & {
    title?: unknown;
    widgets?: Array<{
      id: string;
      title: string;
      type: "metric" | "progress" | "chart";
      value?: string | number;
      unit?: string;
      progress?: number;
      chartType?: "line" | "bar" | "pie";
      data?: Array<{ label: string; value: number }>;
      trend?: {
        value: number;
        direction: "up" | "down" | "neutral";
      };
    }>;
  };

  const resolve = useResolve();
  const baseAestheticId = useBaseAestheticId();
  const dashTitle = dash.title ? String(resolve(dash.title)) : "";
  const widgets = dash.widgets || [];

  // Shared, var-driven base styling (see KanbanBoardRenderer): noir/minimal/
  // gothic and custom profiles ride the CSS vars; the phosphor / neon
  // decoration is driven by the effects profile (screen + card material) rather
  // than a hardcoded preset id.
  const effects = getEffectsProfile(baseAestheticId);
  const scanlines = effects.screen === "scanlines";
  const phosphor = effects.screen === "phosphor";
  const hologram = effects.card === "hologram";
  const wireframe = effects.card === "wireframe";

  const containerClass = cn(
    "font-mono text-[var(--aesthetic-text)] p-4 bg-[var(--aesthetic-background)] border border-[var(--aesthetic-border)]/40 rounded-sm",
    scanlines && "crt-scanlines",
    phosphor && "crt-glow",
    hologram && "shadow-[0_0_10px_#06b6d4,inset_0_0_5px_#06b6d4]"
  );
  const widgetClass = cn(
    "bg-[var(--aesthetic-surface)]/60 border border-[var(--aesthetic-border)]/30 p-4 rounded-sm shadow-sm",
    hologram && "border-[var(--aesthetic-accent-muted)]/50 shadow-[0_0_5px_rgba(6,182,212,0.2)]"
  );
  const textClass = "text-xs text-[var(--aesthetic-text)]/65 font-typewriter";
  const valueClass = cn(
    "text-2xl font-bold text-[var(--aesthetic-accent)] font-typewriter",
    wireframe && "tracking-wider shadow-[0_0_2px_#22c55e]",
    hologram && "shadow-[0_0_4px_#06b6d4]"
  );
  const headerClass =
    "font-typewriter font-bold text-lg mb-4 text-[var(--aesthetic-text)] uppercase tracking-widest border-b border-[var(--aesthetic-border)]/30 pb-2";
  const progressBg =
    "bg-[var(--aesthetic-background)]/60 border border-[var(--aesthetic-border)]/20";
  const progressFill = cn(
    "bg-[var(--aesthetic-accent)] shadow-[0_2px_8px_color-mix(in_srgb,var(--aesthetic-accent)_15%,transparent)]",
    wireframe && "shadow-[0_0_6px_#22c55e]",
    hologram && "shadow-[0_0_8px_#06b6d4]"
  );

  // Handle missing metrics or invalid dataset structures gracefully
  if (widgets.length === 0) {
    return (
      <div className={containerClass}>
        {dashTitle && <div className={headerClass}>{dashTitle}</div>}
        <div className="text-center py-8 opacity-65 text-xs">No widgets configured</div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {dashTitle && <div className={headerClass}>{dashTitle}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {widgets.map((widget) => {
          const trendIcon = widget.trend
            ? widget.trend.direction === "up"
              ? "▲"
              : widget.trend.direction === "down"
                ? "▼"
                : "◀▶"
            : "";
          const trendColor = widget.trend
            ? widget.trend.direction === "up"
              ? "text-emerald-500"
              : widget.trend.direction === "down"
                ? "text-rose-500"
                : "text-neutral-500"
            : "";

          return (
            <div key={widget.id} className={widgetClass}>
              <div className="font-bold text-xs uppercase tracking-wider mb-2 opacity-85">
                {widget.title}
              </div>

              {/* Metric Widget */}
              {widget.type === "metric" && (
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1">
                    <span className={valueClass}>{widget.value ?? "—"}</span>
                    {widget.unit && (
                      <span className="text-xs opacity-60 ml-0.5">{widget.unit}</span>
                    )}
                  </div>
                  {widget.trend && (
                    <div
                      className={cn(
                        "text-[10px] mt-1 flex items-center gap-1 font-sans",
                        trendColor
                      )}
                    >
                      <span className="font-bold">
                        {trendIcon} {widget.trend.value}%
                      </span>
                      <span className="opacity-70">since last check</span>
                    </div>
                  )}
                </div>
              )}

              {/* Progress Widget */}
              {widget.type === "progress" && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-baseline">
                    <span className={valueClass}>{widget.progress ?? 0}%</span>
                    <span className={textClass}>Progress</span>
                  </div>
                  <div className={cn("w-full h-2 rounded-full overflow-hidden", progressBg)}>
                    <div
                      className={cn("h-full transition-all duration-300", progressFill)}
                      style={{ width: `${Math.min(Math.max(widget.progress ?? 0, 0), 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Chart Widget */}
              {widget.type === "chart" && (
                <div className="flex flex-col gap-2 h-24 justify-end">
                  {!widget.data || widget.data.length === 0 ? (
                    <div className="text-center py-4 text-xs opacity-50 italic">No chart data</div>
                  ) : (
                    <>
                      <div className="flex items-end gap-2 h-16 px-1">
                        {widget.data.map((item, idx) => {
                          const maxVal = Math.max(...(widget.data?.map((d) => d.value) || [1]));
                          const percentage = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
                          return (
                            <div
                              key={idx}
                              className="flex-1 flex flex-col items-center h-full justify-end group relative"
                            >
                              <div
                                className="w-full bg-current/25 hover:bg-current/45 transition-all rounded-t-sm"
                                style={{ height: `${Math.max(percentage, 5)}%` }}
                                title={`${item.label}: ${item.value}`}
                              />
                              {/* Small tooltip on hover */}
                              <span className="absolute bottom-full mb-1 scale-0 group-hover:scale-100 transition-transform bg-neutral-900 text-white text-[9px] px-1 py-0.5 rounded shadow-md z-10 whitespace-nowrap">
                                {item.value}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-[9px] opacity-65 font-sans border-t border-current/15 pt-1 px-1">
                        <span>{widget.data[0]?.label}</span>
                        <span>{widget.data[widget.data.length - 1]?.label}</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Fallbacks
// ============================================================================

function MissingComponent({ id }: { id: string }) {
  return (
    <div className="border border-dashed border-[var(--aesthetic-error)]/50 p-2 text-[var(--aesthetic-error)]/70 text-xs font-mono">
      [Missing: {id}]
    </div>
  );
}

function UnknownComponent({ component }: ComponentProps) {
  return (
    <div className="bg-[var(--aesthetic-error)]/10 border border-[var(--aesthetic-error)]/50 p-2 text-[var(--aesthetic-error)] text-xs font-mono">
      [Unknown: {component.component ?? "undefined"}]
    </div>
  );
}

// ============================================================================
// Component Router
// ============================================================================

const COMPONENT_MAP: Record<string, React.FC<ComponentProps>> = {
  // Layout (7)
  Row: RowRenderer,
  Column: ColumnRenderer,
  List: ListRenderer,
  Card: CardRenderer,
  Tabs: TabsRenderer,
  Divider: DividerRenderer,
  Table: TableRenderer,
  Stat: StatRenderer,
  Badge: BadgeRenderer,
  Grid: GridRenderer,
  Modal: ModalRenderer,
  // Templates (2)
  KanbanBoard: KanbanBoardRenderer,
  DataDashboard: DataDashboardRenderer,
  // Content (5)
  Text: TextRenderer,
  Image: ImageRenderer,
  Icon: IconRenderer,
  Video: VideoRenderer,
  AudioPlayer: AudioPlayerRenderer,
  // Input (6)
  Button: ButtonRenderer,
  CheckBox: CheckBoxRenderer,
  TextField: TextFieldRenderer,
  DateTimeInput: DateTimeInputRenderer,
  ChoicePicker: ChoicePickerRenderer,
  Slider: SliderRenderer,
};

// Case-insensitive lookup so a stray legacy lowercase type (e.g. "column" that
// slipped past the legacy→catalog adapter) still renders instead of showing an
// "[Unknown: column]" error box. The catalog adapter remains the canonical
// normalizer; this is only a render-time safety net.
const COMPONENT_MAP_LC: Record<string, React.FC<ComponentProps>> = Object.fromEntries(
  Object.entries(COMPONENT_MAP).map(([name, renderer]) => [name.toLowerCase(), renderer])
);

function resolveRenderer(type: unknown): React.FC<ComponentProps> | undefined {
  if (typeof type !== "string") return undefined;
  return COMPONENT_MAP[type] ?? COMPONENT_MAP_LC[type.toLowerCase()];
}

function ComponentRenderer({ component }: ComponentProps) {
  const renderer = resolveRenderer(component.component);
  if (!renderer) {
    return <UnknownComponent component={component} />;
  }
  // createElement (not JSX) because the renderer is resolved dynamically from
  // the catalog map; a capitalized JSX binding would trip the static-component
  // lint rule even though every entry is a module-level component.
  return React.createElement(renderer, { component });
}

// ============================================================================
// Server action round-trip
// ============================================================================

/**
 * POST an action to the server endpoint and apply the returned follow-up
 * messages. Best-effort: a missing/erroring back-channel (e.g. in unit tests
 * without a server) is swallowed so the UI never breaks.
 */
async function postAction(
  endpoint: string,
  message: ActionMessage,
  apply: (messages: ServerMessage[]) => void
): Promise<void> {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { messages?: unknown };
    if (Array.isArray(data.messages)) {
      apply(data.messages as ServerMessage[]);
    }
  } catch {
    // Back-channel unavailable — leave the UI as-is.
  }
}

// ============================================================================
// Surface Renderer
// ============================================================================

interface SurfaceRendererProps {
  surface: SurfaceState;
  theme?: "noir" | "standard";
  className?: string;
  /**
   * Observer for client→server `event` actions. Called with the ActionMessage
   * whenever a server-event button fires (in addition to the HTTP round-trip).
   */
  onAction?: (message: ActionMessage) => void;
  /**
   * Endpoint that processes server-event actions and returns follow-up A2UI
   * messages (applied to the surface). Defaults to `/api/a2ui/action`; pass
   * `null` to disable the round-trip (e.g. in unit tests).
   */
  actionEndpoint?: string | null;
}

export function SurfaceRenderer({
  surface,
  theme = "noir",
  className,
  onAction,
  actionEndpoint = "/api/a2ui/action",
}: SurfaceRendererProps) {
  const storeSetDataModel = useSurfaceStore((s) => s.setDataModel);
  const storeUpdateComponents = useSurfaceStore((s) => s.updateComponents);
  const storeHasSurface = useSurfaceStore((s) => s.hasSurface);

  // Working copy of the data model. Seeded from the surface and re-synced
  // whenever the server pushes a new data model (reference change) or the
  // surface identity changes. Local edits (two-way binding) update this copy
  // immediately and also write through to the store when the surface is
  // registered there (the live app), so other consumers stay in sync.
  //
  // Re-syncing is done with React's "adjust state during render" pattern
  // (storing the last-seen source and resetting when it changes) rather than
  // an effect, which avoids a cascading re-render on every server push.
  const [dataModel, setDataModelLocal] = useState<Record<string, unknown>>(surface.dataModel);
  const [syncKey, setSyncKey] = useState<{ id: string; model: Record<string, unknown> }>({
    id: surface.config.surfaceId,
    model: surface.dataModel,
  });
  if (syncKey.id !== surface.config.surfaceId || syncKey.model !== surface.dataModel) {
    setSyncKey({ id: surface.config.surfaceId, model: surface.dataModel });
    setDataModelLocal(surface.dataModel);
  }

  const setData = useCallback(
    (path: string, value: unknown) => {
      setDataModelLocal((prev) => setAtPathImmutable(prev, path, value));
      if (storeHasSurface(surface.config.surfaceId)) {
        storeSetDataModel(surface.config.surfaceId, path, value);
      }
    },
    [storeHasSurface, storeSetDataModel, surface.config.surfaceId]
  );

  // Apply server-returned follow-up messages to the surface.
  const applyServerMessages = useCallback(
    (messages: ServerMessage[]) => {
      for (const msg of messages) {
        if (msg.type === "updateDataModel") {
          setData(msg.path, msg.value);
        } else if (msg.type === "updateComponents") {
          if (storeHasSurface(surface.config.surfaceId)) {
            storeUpdateComponents(
              surface.config.surfaceId,
              msg.components as unknown as SurfaceComponent[]
            );
          }
        }
      }
    },
    [setData, storeHasSurface, storeUpdateComponents, surface.config.surfaceId]
  );

  const runAction = useCallback(
    (componentId: string, action: unknown) => {
      if (!action || typeof action !== "object") return;

      // Server event → emit a client→server ActionMessage + HTTP round-trip.
      if ("event" in action) {
        const event = (action as { event: { name: string; context?: Record<string, unknown> } })
          .event;
        const message = dispatchAction(
          {
            surfaceId: surface.config.surfaceId,
            componentId,
            actionName: event.name,
            dataBindings: event.context,
          },
          (m) => onAction?.(m)
        );
        if (actionEndpoint) {
          void postAction(actionEndpoint, message, applyServerMessages);
        }
        return;
      }

      // Local function call → handle the built-in catalog of client functions.
      if ("functionCall" in action) {
        const fc = (action as { functionCall: { call: string; args?: Record<string, unknown> } })
          .functionCall;
        const args = fc.args ?? {};
        switch (fc.call) {
          case "setValue":
          case "set": {
            if (typeof args.path === "string") setData(args.path, args.value);
            break;
          }
          case "toggle": {
            if (typeof args.path === "string") {
              setData(args.path, !resolvePointer(dataModel, args.path));
            }
            break;
          }
          case "openUrl": {
            // Side-effecting navigation belongs to an explicit user action, not
            // value resolution. Opt into side effects here; evaluateFunctionCall
            // applies the http(s)/same-origin protocol guard.
            evaluateFunctionCall({ call: "openUrl", args }, dataModel, undefined, {
              allowSideEffects: true,
            });
            break;
          }
          default:
            // Unknown client function — no-op (kept out of the way in the demo).
            break;
        }
      }
    },
    [actionEndpoint, applyServerMessages, dataModel, onAction, setData, surface.config.surfaceId]
  );

  // Map a v0.9 object theme onto the aesthetic CSS variables. Only a small,
  // safe subset is honored; unknown keys are ignored. A string theme is a
  // named profile handled elsewhere, so it contributes no inline overrides.
  const themeStyle = useMemo<React.CSSProperties>(() => {
    const t = surface.config.theme;
    if (!t || typeof t !== "object") return {};
    const style: Record<string, string> = {};
    const primary = t.primaryColor;
    if (typeof primary === "string") {
      style["--aesthetic-accent"] = primary;
    }
    const background = t.backgroundColor;
    if (typeof background === "string") {
      style["--aesthetic-background"] = background;
    }
    const text = t.textColor;
    if (typeof text === "string") {
      style["--aesthetic-text"] = text;
    }
    return style as React.CSSProperties;
  }, [surface.config.theme]);

  const contextValue = useMemo<SurfaceContextValue>(
    () => ({
      surface,
      getComponent: (id) => surface.components.get(id),
      dataModel,
      setData,
      runAction,
      theme,
    }),
    [surface, dataModel, setData, runAction, theme]
  );

  // Find root component: check for "root" ID, surfaceId, or first component.
  const rootComponent =
    surface.components.get("root") ||
    surface.components.get(surface.config.surfaceId) ||
    (surface.components.size > 0 ? surface.components.values().next().value : null);

  if (!rootComponent) {
    return (
      <div className={cn("text-[var(--aesthetic-text)]/50 font-mono text-sm p-4", className)}>
        No components to render
      </div>
    );
  }

  return (
    <SurfaceContext.Provider value={contextValue}>
      <div className={cn("p-4", className)} style={themeStyle}>
        <ComponentRenderer component={rootComponent} />
      </div>
    </SurfaceContext.Provider>
  );
}

// ============================================================================
// Convenience exports
// ============================================================================

export { SurfaceContext };
