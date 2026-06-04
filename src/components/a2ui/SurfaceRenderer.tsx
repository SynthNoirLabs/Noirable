"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { SurfaceState, SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { resolvePointer } from "@/lib/a2ui/binding/pointer";
import { isFunctionCall, evaluateFunctionCall } from "@/lib/a2ui/binding/functions";
import { resolveChildList } from "@/lib/a2ui/binding/template-children";
import { runChecks, type CheckRule } from "@/lib/a2ui/validation";
import { dispatchAction } from "@/lib/a2ui/events/dispatch";
import type { ActionMessage, ServerMessage } from "@/lib/a2ui/schema/messages";
import { useSurfaceStore } from "@/lib/a2ui/store/useSurfaceStore";
import { cn } from "@/lib/utils";

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
 * Render a component's children. `children` is the raw childList field: either
 * a static `string[]` or a template `{ componentId, path }`. Template-expanded
 * children carry a per-item scope, provided to descendants via ScopeContext.
 *
 * When `applyWeight` is set (Row/Column only, per the A2UI spec: `weight` is
 * "similar to CSS flex-grow ... ONLY when a direct descendant of a Row or
 * Column"), a child with a positive numeric `weight` is wrapped in a flex item
 * that grows proportionally. Unweighted children stay as plain flex items.
 */
function ChildList({
  childList,
  applyWeight = false,
}: {
  childList: unknown;
  applyWeight?: boolean;
}) {
  const { getComponent, dataModel } = useSurfaceContext();
  const resolved = resolveChildList(childList, dataModel);
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

function CardRenderer({ component }: ComponentProps) {
  const { getComponent } = useSurfaceContext();
  const card = component as SurfaceComponent & { child?: string };

  const childComponent = card.child ? getComponent(card.child) : null;
  const body = childComponent ? (
    <ComponentRenderer component={childComponent} />
  ) : (
    <MissingComponent id={card.child || "unknown"} />
  );

  // A dark elevated card with a thin amber top accent — reads as "evidence on
  // the board" without the jarring light paper block on a dark surface. (The
  // aged-paper DossierCard look lives elsewhere; the generic renderer stays in
  // the dark palette so cards never look like unstyled white boxes.)
  return (
    <div
      className={cn(
        "rounded-sm border border-[var(--aesthetic-border)]/30 bg-[var(--aesthetic-surface)]/60 p-5",
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
    <div className="overflow-x-auto rounded-sm border border-[var(--aesthetic-border)]/30">
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

function TextRenderer({ component }: ComponentProps) {
  const resolve = useResolve();
  const text = component as SurfaceComponent & { text?: unknown; variant?: string };

  const content = String(resolve(text.text) ?? "");
  const variant = text.variant || "body";
  const baseClass = "text-[var(--aesthetic-text)] font-mono";

  switch (variant) {
    case "h1":
      return (
        <h1 className={cn(baseClass, "text-3xl font-bold font-typewriter mb-4")}>{content}</h1>
      );
    case "h2":
      return (
        <h2 className={cn(baseClass, "text-2xl font-bold font-typewriter mb-3")}>{content}</h2>
      );
    case "h3":
      return <h3 className={cn(baseClass, "text-xl font-bold font-typewriter mb-2")}>{content}</h3>;
    case "h4":
      return <h4 className={cn(baseClass, "text-lg font-semibold mb-2")}>{content}</h4>;
    case "h5":
      return <h5 className={cn(baseClass, "text-base font-semibold mb-1")}>{content}</h5>;
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

  const sizeClasses = {
    icon: "w-6 h-6",
    avatar: "w-12 h-12 rounded-full",
    smallFeature: "w-24 h-24",
    mediumFeature: "w-48 h-48",
    largeFeature: "w-96 h-64",
    header: "w-full h-48",
  };

  const isInline = img.variant === "icon" || img.variant === "avatar";

  if (!url) {
    return (
      <div className="border border-[var(--aesthetic-border)]/40 bg-[var(--aesthetic-background)]/35 px-4 py-3 rounded-sm text-xs font-mono text-[var(--aesthetic-text)]/70">
        IMAGE PENDING
      </div>
    );
  }

  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className={cn(
        "object-cover",
        img.fit === "contain" && "object-contain",
        img.fit === "fill" && "object-fill",
        img.fit === "none" && "object-none",
        img.fit === "scaleDown" && "object-scale-down",
        isInline
          ? sizeClasses[img.variant as keyof typeof sizeClasses]
          : "block w-full max-w-full sepia-[0.15]"
      )}
    />
  );

  if (isInline) {
    return image;
  }

  return (
    <figure className="inline-block bg-[#0d0d0d] p-2 pb-7 border border-[var(--aesthetic-border)]/50 rounded-sm rotate-[-0.6deg] shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
      {image}
      {Boolean(img.accessibility?.label) && (
        <figcaption className="mt-2 px-1 font-typewriter text-[10px] uppercase tracking-[0.25em] text-[var(--aesthetic-text)]/60">
          Exhibit — {alt}
        </figcaption>
      )}
    </figure>
  );
}

function IconRenderer({ component }: ComponentProps) {
  const resolve = useResolve();
  const icon = component as SurfaceComponent & { name?: unknown };
  const name = String(resolve(icon.name) ?? "help");
  return (
    <span className="text-[var(--aesthetic-text)] text-xl" aria-label={name} role="img">
      [{name}]
    </span>
  );
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
          ? "text-[var(--aesthetic-accent)] hover:text-[var(--aesthetic-accent)]/80 border border-[var(--aesthetic-accent)]/40 rounded-sm hover:border-[var(--aesthetic-accent)]"
          : "bg-[var(--aesthetic-accent)] text-[var(--aesthetic-background)] hover:bg-[var(--aesthetic-accent)]/90 rounded-sm shadow-[0_2px_12px_rgba(255,191,0,0.25)]"
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
    "bg-[var(--aesthetic-background)]/60 border rounded-sm px-3 py-2.5 text-[var(--aesthetic-text)] font-mono text-sm placeholder:text-[var(--aesthetic-text)]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]",
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

function ComponentRenderer({ component }: ComponentProps) {
  const Renderer = COMPONENT_MAP[component.component];
  if (!Renderer) {
    return <UnknownComponent component={component} />;
  }
  return <Renderer component={component} />;
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
