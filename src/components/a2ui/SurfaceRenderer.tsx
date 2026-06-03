"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { SurfaceState, SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { resolvePointer } from "@/lib/a2ui/binding/pointer";
import { dispatchAction } from "@/lib/a2ui/events/dispatch";
import type { ActionMessage } from "@/lib/a2ui/schema/messages";
import { useSurfaceStore } from "@/lib/a2ui/store/useSurfaceStore";
import { PaperFrame } from "@/components/noir/Surface";
import { cn } from "@/lib/utils";

// ============================================================================
// Context for component resolution
// ============================================================================

interface SurfaceContextValue {
  surface: SurfaceState;
  getComponent: (id: string) => SurfaceComponent | undefined;
  /** Resolve a JSON Pointer path against the live (working) data model. */
  resolveBinding: (path: string) => unknown;
  /** Write a value back into the data model (two-way binding). */
  setData: (path: string, value: unknown) => void;
  /** Dispatch a component action (server event or local function call). */
  runAction: (componentId: string, action: unknown) => void;
  theme: "noir" | "standard";
}

const SurfaceContext = createContext<SurfaceContextValue | null>(null);

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

function resolveDynamic(value: unknown, resolve: (path: string) => unknown): unknown {
  const path = getBindingPath(value);
  return path !== null ? resolve(path) : value;
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
// Layout: Row / Column / List
// ============================================================================

function childIdsOf(component: SurfaceComponent): string[] {
  const children = (component as { children?: unknown }).children;
  return Array.isArray(children) ? (children as string[]) : [];
}

function ChildList({ ids }: { ids: string[] }) {
  const { getComponent } = useSurfaceContext();
  return (
    <>
      {ids.map((childId) => {
        const child = getComponent(childId);
        if (!child) return <MissingComponent key={childId} id={childId} />;
        return <ComponentRenderer key={childId} component={child} />;
      })}
    </>
  );
}

function RowRenderer({ component }: ComponentProps) {
  const row = component as SurfaceComponent & { justify?: string; align?: string };
  return (
    <div
      className={cn(
        "flex flex-row gap-2",
        row.justify === "center" && "justify-center",
        row.justify === "end" && "justify-end",
        row.justify === "spaceBetween" && "justify-between",
        row.justify === "spaceAround" && "justify-around",
        row.justify === "spaceEvenly" && "justify-evenly",
        row.align === "center" && "items-center",
        row.align === "end" && "items-end",
        row.align === "stretch" && "items-stretch"
      )}
    >
      <ChildList ids={childIdsOf(component)} />
    </div>
  );
}

function ColumnRenderer({ component }: ComponentProps) {
  const col = component as SurfaceComponent & { justify?: string; align?: string };
  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        col.justify === "center" && "justify-center",
        col.justify === "end" && "justify-end",
        col.align === "center" && "items-center",
        col.align === "end" && "items-end",
        col.align === "stretch" && "items-stretch"
      )}
    >
      <ChildList ids={childIdsOf(component)} />
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
      <ChildList ids={childIdsOf(component)} />
    </div>
  );
}

// ============================================================================
// Layout: Card / Divider / Tabs / Modal
// ============================================================================

function CardRenderer({ component }: ComponentProps) {
  const { getComponent, theme } = useSurfaceContext();
  const card = component as SurfaceComponent & { child?: string };

  const childComponent = card.child ? getComponent(card.child) : null;
  const body = childComponent ? (
    <ComponentRenderer component={childComponent} />
  ) : (
    <MissingComponent id={card.child || "unknown"} />
  );

  if (theme === "noir") {
    return <PaperFrame>{body}</PaperFrame>;
  }

  return (
    <div className="bg-[var(--aesthetic-surface)] border border-[var(--aesthetic-border)]/30 rounded-sm p-4 shadow-lg">
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

interface TabItem {
  title?: unknown;
  child?: string;
}

function TabsRenderer({ component }: ComponentProps) {
  const { getComponent, resolveBinding } = useSurfaceContext();
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
          const title = String(resolveDynamic(tab.title, resolveBinding) ?? `Tab ${index + 1}`);
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
  const { resolveBinding } = useSurfaceContext();
  const text = component as SurfaceComponent & { text?: unknown; variant?: string };

  const content = String(resolveDynamic(text.text, resolveBinding) ?? "");
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
  const { resolveBinding } = useSurfaceContext();
  const img = component as SurfaceComponent & {
    url?: unknown;
    fit?: string;
    variant?: string;
    accessibility?: { label?: unknown };
  };

  const url = String(resolveDynamic(img.url, resolveBinding) ?? "");
  const alt = img.accessibility?.label
    ? String(resolveDynamic(img.accessibility.label, resolveBinding))
    : "Image";

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
  const { resolveBinding } = useSurfaceContext();
  const icon = component as SurfaceComponent & { name?: unknown };
  const name = String(resolveDynamic(icon.name, resolveBinding) ?? "help");
  return (
    <span className="text-[var(--aesthetic-text)] text-xl" aria-label={name} role="img">
      [{name}]
    </span>
  );
}

function VideoRenderer({ component }: ComponentProps) {
  const { resolveBinding } = useSurfaceContext();
  const video = component as SurfaceComponent & {
    url?: unknown;
    accessibility?: { label?: unknown };
  };
  const url = String(resolveDynamic(video.url, resolveBinding) ?? "");
  const label = video.accessibility?.label
    ? String(resolveDynamic(video.accessibility.label, resolveBinding))
    : undefined;

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
  const { resolveBinding } = useSurfaceContext();
  const audio = component as SurfaceComponent & { url?: unknown; description?: unknown };
  const url = String(resolveDynamic(audio.url, resolveBinding) ?? "");
  const description = audio.description
    ? String(resolveDynamic(audio.description, resolveBinding))
    : undefined;

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

function ButtonRenderer({ component }: ComponentProps) {
  const { getComponent, runAction } = useSurfaceContext();
  const btn = component as SurfaceComponent & {
    child?: string;
    variant?: string;
    action?: unknown;
  };

  const childComponent = btn.child ? getComponent(btn.child) : null;

  return (
    <button
      type="button"
      onClick={() => runAction(btn.id, btn.action)}
      className={cn(
        "px-4 py-2 font-mono text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]",
        btn.variant === "borderless"
          ? "text-[var(--aesthetic-accent)] hover:text-[var(--aesthetic-accent)]/80"
          : "bg-[var(--aesthetic-accent)] text-[var(--aesthetic-background)] hover:bg-[var(--aesthetic-accent)]/90 rounded-sm"
      )}
    >
      {childComponent ? <ComponentRenderer component={childComponent} /> : btn.id}
    </button>
  );
}

function TextFieldRenderer({ component }: ComponentProps) {
  const { resolveBinding, setData } = useSurfaceContext();
  const field = component as SurfaceComponent & {
    label?: unknown;
    value?: unknown;
    variant?: string;
  };

  const label = String(resolveDynamic(field.label, resolveBinding) ?? "");
  const bindingPath = getBindingPath(field.value);
  const value = String(resolveDynamic(field.value, resolveBinding) ?? "");

  const fieldId = `surface-field-${field.id}`;
  const inputType =
    field.variant === "obscured" ? "password" : field.variant === "number" ? "number" : "text";

  const sharedClass =
    "bg-[var(--aesthetic-surface)] border border-[var(--aesthetic-border)]/30 rounded-sm px-3 py-2 text-[var(--aesthetic-text)] font-mono text-sm focus:border-[var(--aesthetic-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]";

  const onChange = (next: string) => {
    if (bindingPath) setData(bindingPath, next);
  };

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={fieldId} className="text-[var(--aesthetic-text)]/70 text-xs font-mono">
          {label}
        </label>
      )}
      {field.variant === "longText" ? (
        <textarea
          id={fieldId}
          rows={4}
          // Controlled when bound, uncontrolled otherwise — a literal value is
          // a one-shot default, while a `{path}` binding is the source of truth.
          {...(bindingPath ? { value } : { defaultValue: value })}
          onChange={(e) => onChange(e.currentTarget.value)}
          className={sharedClass}
        />
      ) : (
        <input
          id={fieldId}
          type={inputType}
          {...(bindingPath ? { value } : { defaultValue: value })}
          onChange={(e) => onChange(e.currentTarget.value)}
          className={sharedClass}
        />
      )}
    </div>
  );
}

function CheckBoxRenderer({ component }: ComponentProps) {
  const { resolveBinding, setData } = useSurfaceContext();
  const cb = component as SurfaceComponent & { label?: unknown; value?: unknown };

  const label = String(resolveDynamic(cb.label, resolveBinding) ?? "");
  const bindingPath = getBindingPath(cb.value);
  const checked = Boolean(resolveDynamic(cb.value, resolveBinding));

  return (
    <label className="flex items-center gap-2 text-[var(--aesthetic-text)] font-mono text-sm cursor-pointer">
      <input
        type="checkbox"
        {...(bindingPath ? { checked } : { defaultChecked: checked })}
        onChange={(e) => {
          if (bindingPath) setData(bindingPath, e.currentTarget.checked);
        }}
        className="w-4 h-4 accent-[var(--aesthetic-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]"
      />
      {label}
    </label>
  );
}

function SliderRenderer({ component }: ComponentProps) {
  const { resolveBinding, setData } = useSurfaceContext();
  const slider = component as SurfaceComponent & {
    label?: unknown;
    min?: number;
    max?: number;
    value?: unknown;
  };

  const label = slider.label ? String(resolveDynamic(slider.label, resolveBinding)) : "Range";
  const min = typeof slider.min === "number" ? slider.min : 0;
  const max = typeof slider.max === "number" ? slider.max : 100;
  const bindingPath = getBindingPath(slider.value);
  const resolved = resolveDynamic(slider.value, resolveBinding);
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
        {...(bindingPath ? { value } : { defaultValue: value })}
        onChange={(e) => {
          if (bindingPath) setData(bindingPath, Number(e.currentTarget.value));
        }}
        className="w-full h-1 rounded-lg appearance-none cursor-pointer accent-[var(--aesthetic-accent)] bg-[var(--aesthetic-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]"
      />
    </label>
  );
}

interface ChoiceOption {
  label?: unknown;
  value: string;
}

function ChoicePickerRenderer({ component }: ComponentProps) {
  const { resolveBinding, setData } = useSurfaceContext();
  const picker = component as SurfaceComponent & {
    label?: unknown;
    variant?: string;
    options?: ChoiceOption[];
    value?: unknown;
  };

  const label = picker.label ? String(resolveDynamic(picker.label, resolveBinding)) : "";
  const options = Array.isArray(picker.options) ? picker.options : [];
  const bindingPath = getBindingPath(picker.value);
  const resolved = resolveDynamic(picker.value, resolveBinding);
  const selected: string[] = Array.isArray(resolved)
    ? (resolved as string[])
    : typeof resolved === "string" && resolved
      ? [resolved]
      : [];

  const multiple = picker.variant === "multipleSelection";

  const toggle = (optValue: string) => {
    if (!bindingPath) return;
    if (multiple) {
      const next = selected.includes(optValue)
        ? selected.filter((v) => v !== optValue)
        : [...selected, optValue];
      setData(bindingPath, next);
    } else {
      setData(bindingPath, [optValue]);
    }
  };

  return (
    <fieldset className="flex flex-col gap-2 text-sm">
      {label && (
        <legend className="font-typewriter text-[var(--aesthetic-text)]/70 text-xs mb-1">
          {label}
        </legend>
      )}
      {options.map((option) => {
        const optLabel = String(resolveDynamic(option.label, resolveBinding) ?? option.value);
        const isSelected = selected.includes(option.value);
        return (
          <label
            key={option.value}
            className="flex items-center gap-2 font-mono text-[var(--aesthetic-text)] cursor-pointer"
          >
            <input
              type={multiple ? "checkbox" : "radio"}
              name={`choice-${component.id}`}
              checked={isSelected}
              onChange={() => toggle(option.value)}
              className="accent-[var(--aesthetic-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]"
            />
            {optLabel}
          </label>
        );
      })}
    </fieldset>
  );
}

function DateTimeInputRenderer({ component }: ComponentProps) {
  const { resolveBinding, setData } = useSurfaceContext();
  const dti = component as SurfaceComponent & {
    value?: unknown;
    enableDate?: boolean;
    enableTime?: boolean;
    accessibility?: { label?: unknown };
  };

  const bindingPath = getBindingPath(dti.value);
  const value = String(resolveDynamic(dti.value, resolveBinding) ?? "");
  const label = dti.accessibility?.label
    ? String(resolveDynamic(dti.accessibility.label, resolveBinding))
    : undefined;

  // Default to date when neither flag is set; pick the closest native type.
  const enableDate = dti.enableDate ?? true;
  const enableTime = dti.enableTime ?? false;
  const inputType =
    enableDate && enableTime ? "datetime-local" : enableTime && !enableDate ? "time" : "date";

  const fieldId = `surface-datetime-${dti.id}`;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={fieldId} className="text-[var(--aesthetic-text)]/70 text-xs font-mono">
          {label}
        </label>
      )}
      <input
        id={fieldId}
        type={inputType}
        {...(bindingPath ? { value } : { defaultValue: value })}
        onChange={(e) => {
          if (bindingPath) setData(bindingPath, e.currentTarget.value);
        }}
        className="bg-[var(--aesthetic-surface)] border border-[var(--aesthetic-border)]/30 rounded-sm px-3 py-2 text-[var(--aesthetic-text)] font-mono text-sm focus:border-[var(--aesthetic-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)] [color-scheme:dark]"
      />
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
// Surface Renderer
// ============================================================================

interface SurfaceRendererProps {
  surface: SurfaceState;
  theme?: "noir" | "standard";
  className?: string;
  /**
   * Called when a server `event` action fires. The A2UI stream is a one-shot
   * POST (no open back-channel), so this surfaces the client→server
   * ActionMessage for the host app to handle (log, POST back, etc.).
   */
  onAction?: (message: ActionMessage) => void;
}

export function SurfaceRenderer({
  surface,
  theme = "noir",
  className,
  onAction,
}: SurfaceRendererProps) {
  const storeSetDataModel = useSurfaceStore((s) => s.setDataModel);
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

  const runAction = useCallback(
    (componentId: string, action: unknown) => {
      if (!action || typeof action !== "object") return;

      // Server event → emit a client→server ActionMessage.
      if ("event" in action) {
        const event = (action as { event: { name: string; context?: Record<string, unknown> } })
          .event;
        dispatchAction(
          {
            surfaceId: surface.config.surfaceId,
            componentId,
            actionName: event.name,
            dataBindings: event.context,
          },
          (message) => onAction?.(message)
        );
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
    [dataModel, onAction, setData, surface.config.surfaceId]
  );

  // Map a v0.9 object theme onto the aesthetic CSS variables. Only a small,
  // safe subset is honored; unknown keys are ignored. A string theme is a
  // named profile handled elsewhere, so it contributes no inline overrides.
  const themeStyle = useMemo<React.CSSProperties>(() => {
    const theme = surface.config.theme;
    if (!theme || typeof theme !== "object") return {};
    const style: Record<string, string> = {};
    const primary = theme.primaryColor;
    if (typeof primary === "string") {
      style["--aesthetic-accent"] = primary;
    }
    const background = theme.backgroundColor;
    if (typeof background === "string") {
      style["--aesthetic-background"] = background;
    }
    const text = theme.textColor;
    if (typeof text === "string") {
      style["--aesthetic-text"] = text;
    }
    return style as React.CSSProperties;
  }, [surface.config.theme]);

  const contextValue = useMemo<SurfaceContextValue>(
    () => ({
      surface,
      getComponent: (id) => surface.components.get(id),
      resolveBinding: (path) => resolvePointer(dataModel, path),
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
