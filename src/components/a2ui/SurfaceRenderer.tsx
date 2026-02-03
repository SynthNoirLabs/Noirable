"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { SurfaceState, SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { resolvePointer } from "@/lib/a2ui/binding/pointer";
import { cn } from "@/lib/utils";

// ============================================================================
// Context for component resolution
// ============================================================================

interface SurfaceContextValue {
  surface: SurfaceState;
  getComponent: (id: string) => SurfaceComponent | undefined;
  resolveBinding: (path: string) => unknown;
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
// Component Renderers
// ============================================================================

interface ComponentProps {
  component: SurfaceComponent;
}

// Helper to resolve dynamic values
function resolveDynamic(value: unknown, resolve: (path: string) => unknown): unknown {
  if (typeof value === "string" && value.startsWith("/")) {
    return resolve(value);
  }
  if (value && typeof value === "object" && "path" in value) {
    return resolve((value as { path: string }).path);
  }
  return value;
}

// Layout: Row
function RowRenderer({ component }: ComponentProps) {
  const { getComponent, theme } = useSurfaceContext();
  const row = component as SurfaceComponent & { component: "Row"; children?: string[] };

  const childIds = Array.isArray(row.children) ? row.children : [];

  return (
    <div
      className={cn(
        "flex flex-row gap-2",
        row.justify === "center" && "justify-center",
        row.justify === "end" && "justify-end",
        row.justify === "spaceBetween" && "justify-between",
        row.align === "center" && "items-center",
        row.align === "end" && "items-end"
      )}
    >
      {childIds.map((childId) => {
        const child = getComponent(childId);
        if (!child) return <MissingComponent key={childId} id={childId} />;
        return <ComponentRenderer key={childId} component={child} />;
      })}
    </div>
  );
}

// Layout: Column
function ColumnRenderer({ component }: ComponentProps) {
  const { getComponent } = useSurfaceContext();
  const col = component as SurfaceComponent & { component: "Column"; children?: string[] };

  const childIds = Array.isArray(col.children) ? col.children : [];

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        col.justify === "center" && "justify-center",
        col.justify === "end" && "justify-end",
        col.align === "center" && "items-center",
        col.align === "end" && "items-end"
      )}
    >
      {childIds.map((childId) => {
        const child = getComponent(childId);
        if (!child) return <MissingComponent key={childId} id={childId} />;
        return <ComponentRenderer key={childId} component={child} />;
      })}
    </div>
  );
}

// Layout: Card
function CardRenderer({ component }: ComponentProps) {
  const { getComponent } = useSurfaceContext();
  const card = component as SurfaceComponent & { component: "Card"; child?: string };

  const childComponent = card.child ? getComponent(card.child) : null;

  return (
    <div className="bg-[var(--aesthetic-surface)] border border-[var(--aesthetic-border)]/30 rounded-sm p-4 shadow-lg">
      {childComponent ? (
        <ComponentRenderer component={childComponent} />
      ) : (
        <MissingComponent id={card.child || "unknown"} />
      )}
    </div>
  );
}

// Layout: List
function ListRenderer({ component }: ComponentProps) {
  const { getComponent } = useSurfaceContext();
  const list = component as SurfaceComponent & { component: "List"; children?: string[] };

  const childIds = Array.isArray(list.children) ? list.children : [];

  return (
    <div
      className={cn(
        "flex gap-2",
        list.direction === "horizontal" ? "flex-row overflow-x-auto" : "flex-col"
      )}
    >
      {childIds.map((childId) => {
        const child = getComponent(childId);
        if (!child) return <MissingComponent key={childId} id={childId} />;
        return <ComponentRenderer key={childId} component={child} />;
      })}
    </div>
  );
}

// Layout: Divider
function DividerRenderer({ component }: ComponentProps) {
  const divider = component as SurfaceComponent & { component: "Divider"; axis?: string };

  return (
    <hr
      className={cn(
        "border-[var(--aesthetic-border)]/30",
        divider.axis === "vertical" ? "border-l h-full w-0" : "border-t w-full h-0"
      )}
    />
  );
}

// Content: Text
function TextRenderer({ component }: ComponentProps) {
  const { resolveBinding } = useSurfaceContext();
  const text = component as SurfaceComponent & {
    component: "Text";
    text?: unknown;
    variant?: string;
  };

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

// Content: Image
function ImageRenderer({ component }: ComponentProps) {
  const { resolveBinding } = useSurfaceContext();
  const img = component as SurfaceComponent & {
    component: "Image";
    url?: unknown;
    fit?: string;
    variant?: string;
  };

  const url = String(resolveDynamic(img.url, resolveBinding) ?? "");
  const imgWithAccess = img as SurfaceComponent & { accessibility?: { label?: unknown } };
  const alt = imgWithAccess.accessibility?.label
    ? String(resolveDynamic(imgWithAccess.accessibility.label, resolveBinding))
    : "Image";

  const sizeClasses = {
    icon: "w-6 h-6",
    avatar: "w-12 h-12 rounded-full",
    smallFeature: "w-24 h-24",
    mediumFeature: "w-48 h-48",
    largeFeature: "w-96 h-64",
    header: "w-full h-48",
  };

  return (
    <img
      src={url}
      alt={alt}
      className={cn(
        "object-cover",
        img.fit === "contain" && "object-contain",
        img.fit === "fill" && "object-fill",
        sizeClasses[img.variant as keyof typeof sizeClasses] || "max-w-full"
      )}
    />
  );
}

// Content: Icon
function IconRenderer({ component }: ComponentProps) {
  const icon = component as SurfaceComponent & { component: "Icon"; name?: string };

  // Basic icon rendering - in production would use an icon library
  return (
    <span className="text-[var(--aesthetic-text)] text-xl" aria-label={icon.name}>
      [{icon.name}]
    </span>
  );
}

// Input: Button
function ButtonRenderer({ component }: ComponentProps) {
  const { getComponent, resolveBinding } = useSurfaceContext();
  const btn = component as SurfaceComponent & {
    component: "Button";
    child?: string;
    variant?: string;
    action?: unknown;
  };

  const childComponent = btn.child ? getComponent(btn.child) : null;

  const handleClick = () => {
    // In production, this would dispatch the action
    console.log("[A2UI] Button clicked:", btn.id, btn.action);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "px-4 py-2 font-mono text-sm transition-colors",
        btn.variant === "borderless"
          ? "text-[var(--aesthetic-accent)] hover:text-[var(--aesthetic-accent)]/80"
          : "bg-[var(--aesthetic-accent)] text-[var(--aesthetic-background)] hover:bg-[var(--aesthetic-accent)]/90 rounded-sm"
      )}
    >
      {childComponent ? <ComponentRenderer component={childComponent} /> : btn.id}
    </button>
  );
}

// Input: TextField
function TextFieldRenderer({ component }: ComponentProps) {
  const { resolveBinding } = useSurfaceContext();
  const field = component as SurfaceComponent & {
    component: "TextField";
    label?: unknown;
    value?: unknown;
    variant?: string;
  };

  const label = String(resolveDynamic(field.label, resolveBinding) ?? "");
  const value = String(resolveDynamic(field.value, resolveBinding) ?? "");

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-[var(--aesthetic-text)]/70 text-xs font-mono">{label}</label>
      )}
      <input
        type={field.variant === "obscured" ? "password" : "text"}
        defaultValue={value}
        className="bg-[var(--aesthetic-surface)] border border-[var(--aesthetic-border)]/30 rounded-sm px-3 py-2 text-[var(--aesthetic-text)] font-mono text-sm focus:border-[var(--aesthetic-accent)] focus:outline-none"
      />
    </div>
  );
}

// Input: CheckBox
function CheckBoxRenderer({ component }: ComponentProps) {
  const { resolveBinding } = useSurfaceContext();
  const cb = component as SurfaceComponent & {
    component: "CheckBox";
    label?: unknown;
    value?: unknown;
  };

  const label = String(resolveDynamic(cb.label, resolveBinding) ?? "");
  const checked = Boolean(resolveDynamic(cb.value, resolveBinding));

  return (
    <label className="flex items-center gap-2 text-[var(--aesthetic-text)] font-mono text-sm cursor-pointer">
      <input
        type="checkbox"
        defaultChecked={checked}
        className="w-4 h-4 accent-[var(--aesthetic-accent)]"
      />
      {label}
    </label>
  );
}

// Fallback for missing components
function MissingComponent({ id }: { id: string }) {
  return (
    <div className="border border-dashed border-[var(--aesthetic-error)]/50 p-2 text-[var(--aesthetic-error)]/70 text-xs font-mono">
      [Missing: {id}]
    </div>
  );
}

// Fallback for unknown component types
function UnknownComponent({ component }: ComponentProps) {
  return (
    <div className="bg-[var(--aesthetic-error)]/10 border border-[var(--aesthetic-error)]/50 p-2 text-[var(--aesthetic-error)] text-xs font-mono">
      [Unknown: {component.type}]
    </div>
  );
}

// ============================================================================
// Component Router
// ============================================================================

const COMPONENT_MAP: Record<string, React.FC<ComponentProps>> = {
  Row: RowRenderer,
  Column: ColumnRenderer,
  Card: CardRenderer,
  List: ListRenderer,
  Divider: DividerRenderer,
  Text: TextRenderer,
  Image: ImageRenderer,
  Icon: IconRenderer,
  Button: ButtonRenderer,
  TextField: TextFieldRenderer,
  CheckBox: CheckBoxRenderer,
};

function ComponentRenderer({ component }: ComponentProps) {
  const Renderer = COMPONENT_MAP[component.type];
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
}

export function SurfaceRenderer({ surface, theme = "noir", className }: SurfaceRendererProps) {
  const contextValue = useMemo<SurfaceContextValue>(
    () => ({
      surface,
      getComponent: (id) => surface.components.get(id),
      resolveBinding: (path) => resolvePointer(surface.dataModel, path),
      theme,
    }),
    [surface, theme]
  );

  // Find root component: check for "root" ID, surfaceId, or first component
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
      <div className={cn("p-4", className)}>
        <ComponentRenderer component={rootComponent} />
      </div>
    </SurfaceContext.Provider>
  );
}

// ============================================================================
// Convenience exports
// ============================================================================

export { SurfaceContext };
