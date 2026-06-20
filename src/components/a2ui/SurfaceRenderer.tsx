"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { SurfaceState, SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { resolvePointer, setAtPath } from "@/lib/a2ui/binding/pointer";
import { evaluateFunctionCall } from "@/lib/a2ui/binding/functions";
import { dispatchAction } from "@/lib/a2ui/events/dispatch";
import type { ActionMessage, ServerMessage } from "@/lib/a2ui/schema/messages";
import { useSurfaceStore } from "@/lib/a2ui/store/useSurfaceStore";
import { cn } from "@/lib/utils";
import {
  SurfaceContext,
  useSurfaceContext,
  type SurfaceContextValue,
  type ComponentProps,
} from "./internal/context";
import { ComponentRenderer, registerComponents } from "./internal/registry";
import { EVENTS_WITH_VISIBLE_EFFECT, humanizeActionName, postAction } from "./internal/actions";
import { RowRenderer } from "./renderers/Row";
import { ColumnRenderer } from "./renderers/Column";
import { ListRenderer } from "./renderers/List";
import { CardRenderer } from "./renderers/Card";
import { TabsRenderer } from "./renderers/Tabs";
import { DividerRenderer } from "./renderers/Divider";
import { TableRenderer } from "./renderers/Table";
import { StatRenderer } from "./renderers/Stat";
import { BadgeRenderer } from "./renderers/Badge";
import { GridRenderer } from "./renderers/Grid";
import { ModalRenderer } from "./renderers/Modal";
import { KanbanBoardRenderer } from "./renderers/KanbanBoard";
import { DataDashboardRenderer } from "./renderers/DataDashboard";
import { RelationshipGraphRenderer } from "./renderers/RelationshipGraph";
import { CustomCodeRenderer } from "./renderers/CustomCode";
import { TextRenderer } from "./renderers/Text";
import { ImageRenderer } from "./renderers/Image";
import { IconRenderer } from "./renderers/Icon";
import { VideoRenderer } from "./renderers/Video";
import { AudioPlayerRenderer } from "./renderers/AudioPlayer";
import { ButtonRenderer } from "./renderers/Button";
import { CheckBoxRenderer } from "./renderers/CheckBox";
import { TextFieldRenderer } from "./renderers/TextField";
import { DateTimeInputRenderer } from "./renderers/DateTimeInput";
import { ChoicePickerRenderer } from "./renderers/ChoicePicker";
import { SliderRenderer } from "./renderers/Slider";
import { RevealRenderer } from "./renderers/Reveal";
import { StateImageRenderer } from "./renderers/StateImage";

// ============================================================================
// Component Router
//
// The catalog map is assembled here and handed to the registry, which owns the
// dynamic ComponentRenderer dispatch. Renderers reference the registry's
// ChildList/ComponentRenderer directly, so registration only needs to wire the
// type → renderer mapping once at module load.
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
  // Templates (3)
  KanbanBoard: KanbanBoardRenderer,
  DataDashboard: DataDashboardRenderer,
  RelationshipGraph: RelationshipGraphRenderer,
  // Escape hatch
  CustomCode: CustomCodeRenderer,
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

  Reveal: RevealRenderer,
  StateImage: StateImageRenderer,
};

registerComponents(COMPONENT_MAP);

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
      setDataModelLocal((prev) => setAtPath(prev, path, value, { immutable: true }));
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

  // Transient acknowledgement shown when a control fires an action whose effect
  // isn't otherwise visible. A generated button often carries a server `event`
  // (e.g. "Track Cyber-Signal") that, in this showcase, has no live back-channel
  // to mutate the surface — so without this it reads as a dead button. The toast
  // confirms the click landed. `seq` forces a fresh toast even when the same
  // text repeats, so the dismiss timer restarts on every click.
  const [toast, setToast] = useState<{ text: string; seq: number } | null>(null);
  const notify = useCallback((text: string) => {
    setToast((prev) => ({ text, seq: (prev?.seq ?? 0) + 1 }));
  }, []);

  // Execute ONE action against a given data model with a given write function.
  // Split out so the array path can run several in sequence over a working copy
  // (so a later step sees an earlier step's write within the same click). For a
  // lone action, `model`/`write` are just the live `dataModel`/`setData`.
  const runOneAction = useCallback(
    (
      componentId: string,
      action: unknown,
      label: string | undefined,
      model: Record<string, unknown>,
      write: (path: string, value: unknown) => void
    ) => {
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
        // Acknowledge the click ONLY when the action has no otherwise-visible
        // effect. submit/increment are the events the deterministic handler
        // actually acts on (they mutate the data model → a bound component
        // updates), so they confirm themselves and don't need a toast. Every
        // other event name hits the handler's no-op default (set /lastAction),
        // or has no back-channel at all, so confirm optimistically using the
        // button label (falling back to a humanized action name).
        if (!EVENTS_WITH_VISIBLE_EFFECT.has(event.name)) {
          notify(label?.trim() || humanizeActionName(event.name));
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
            if (typeof args.path === "string") write(args.path, args.value);
            break;
          }
          case "toggle": {
            if (typeof args.path === "string") {
              write(args.path, !resolvePointer(model, args.path));
            }
            break;
          }
          // Conditional write: if the value at `path` matches `equals`, write
          // `then` to `target`; otherwise write `else` (when provided). This is
          // what lets a generated surface VALIDATE input — a bypass code, a
          // quiz answer, a combination — and branch the UI on the result.
          // Comparison is string-based so "937-ALPHA" vs a typed field matches.
          case "matchSet": {
            const target = typeof args.target === "string" ? args.target : undefined;
            const source = typeof args.path === "string" ? args.path : undefined;
            if (target && source !== undefined) {
              const current = resolvePointer(model, source);
              const matches = String(current ?? "") === String(args.equals ?? "");
              if (matches) {
                write(target, args.then);
              } else if ("else" in args) {
                write(target, args.else);
              }
            }
            break;
          }
          case "openUrl": {
            // Side-effecting navigation belongs to an explicit user action, not
            // value resolution. Opt into side effects here; evaluateFunctionCall
            // applies the http(s)/same-origin protocol guard.
            evaluateFunctionCall({ call: "openUrl", args }, model, undefined, {
              allowSideEffects: true,
            });
            break;
          }
          default:
            // Unknown client function: no model change to make, so at least
            // acknowledge the click instead of silently doing nothing.
            notify(label?.trim() || humanizeActionName(fc.call));
            break;
        }
      }
    },
    [actionEndpoint, applyServerMessages, notify, onAction, surface.config.surfaceId]
  );

  const runAction = useCallback(
    (componentId: string, action: unknown, label?: string) => {
      if (!action) return;

      // An action may be a LIST — run each in sequence so one click can both
      // mutate state and react to it (validate a code, THEN reveal a panel). A
      // local working copy carries each step's write forward so a later step
      // sees it (React's `dataModel` snapshot won't update until re-render).
      if (Array.isArray(action)) {
        let working: Record<string, unknown> = { ...dataModel };
        const writeThrough = (path: string, value: unknown) => {
          setData(path, value);
          working = setAtPath(working, path, value, { immutable: true });
        };
        for (const single of action) {
          runOneAction(componentId, single, label, working, writeThrough);
        }
        return;
      }

      runOneAction(componentId, action, label, dataModel, setData);
    },
    [dataModel, setData, runOneAction]
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
      <div className={cn("relative p-4", className)} style={themeStyle}>
        <ComponentRenderer component={rootComponent} />
        <ActionToast toast={toast} onDismiss={setToast} />
      </div>
    </SurfaceContext.Provider>
  );
}

/**
 * A small, transient, aesthetic-themed acknowledgement that a control's action
 * fired. It auto-dismisses after a few seconds (timer restarts on each new
 * `seq`), and is announced politely to screen readers. Purely a confirmation
 * surface — it makes no claim about a server result.
 *
 * `onDismiss` is the stable React `setToast` setter (not an inline arrow), and
 * the dismiss effect depends ONLY on `toast?.seq` — so the auto-dismiss timer
 * re-arms exactly when a NEW toast arrives, never on unrelated parent
 * re-renders (e.g. typing in a field while a toast is up would otherwise keep
 * resetting the timer and the toast would never clear).
 */
function ActionToast({
  toast,
  onDismiss,
}: {
  toast: { text: string; seq: number } | null;
  onDismiss: (next: null) => void;
}) {
  const seq = toast?.seq;
  useEffect(() => {
    if (seq === undefined) return;
    const id = setTimeout(() => onDismiss(null), 2600);
    return () => clearTimeout(id);
    // Intentionally keyed only on `seq`: a fresh toast (new seq) re-arms the
    // timer; `onDismiss` is the stable setState setter so it needs no dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seq]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute bottom-3 right-3 z-30 flex items-center gap-2 rounded-[var(--aesthetic-radius,2px)] border border-[var(--aesthetic-accent)]/40 bg-[var(--aesthetic-surface)] px-3 py-2 font-typewriter text-xs text-[var(--aesthetic-text)] shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--aesthetic-accent)]"
        aria-hidden
      />
      <span className="uppercase tracking-wider">{toast.text}</span>
    </div>
  );
}

// ============================================================================
// Convenience exports
// ============================================================================

export { SurfaceContext, useSurfaceContext };
