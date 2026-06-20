import { a2uiInputSchema, normalizeA2UI, type A2UIInput } from "@/lib/protocol/schema";
import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { warnOnCatalogDrift } from "./validateCatalogDev";

/**
 * Legacy → A2UI v0.9 catalog adapter.
 *
 * The legacy `generate_ui` tool (and the JSON editor) produce a *nested* tree
 * keyed by lowercase `type` (e.g. `{ type: "card", children: [...] }`). The
 * A2UI v0.9 `SurfaceRenderer` instead consumes a *flat adjacency list* of
 * catalog components keyed by PascalCase `component`, wired together by `id`
 * references, with exactly one component whose id is `"root"`.
 *
 * This adapter bridges the two so the proven legacy generation path can drive
 * the v0.9 surface renderer. It is intentionally lossy where the catalog has no
 * equivalent (tables, grids, tabs are approximated) — the goal is faithful
 * visual output, not a perfect protocol round-trip.
 */

export interface FlattenResult {
  components: SurfaceComponent[];
  rootId: string;
}

interface Builder {
  components: SurfaceComponent[];
  nextId: () => string;
}

/** Map a legacy heading level to a catalog Text variant. */
function headingVariant(level: number | undefined): string {
  switch (level) {
    case 1:
      return "h1";
    case 3:
      return "h3";
    case 4:
      return "h4";
    case 2:
    default:
      return "h2";
  }
}

/**
 * Infer a badge variant from its label when the model didn't set one (it
 * usually doesn't, even when asked). Threat/alert words → danger, positive
 * status → primary, unknown/inactive → ghost; everything else stays neutral.
 */
function inferBadgeVariant(label: string): string {
  const l = label.toLowerCase();
  const danger =
    /\b(armed|danger|critical|wanted|fleeing|lockdown|high|hostile|threat|fugitive|urgent|alert|breach|unstable|cyborg|cyber|hacker|infiltrator)\b/;
  const positive = /\b(active|online|stable|secure|clear|safe|cleared|verified|resolved)\b/;
  const ghost = /\b(unknown|cold|masked|inactive|offline|missing|n\/?a|pending|unconfirmed)\b/;
  if (danger.test(l)) return "danger";
  if (positive.test(l)) return "primary";
  if (ghost.test(l)) return "ghost";
  return "secondary";
}

/** Push a catalog component and return its id (for parent wiring). */
function emit(builder: Builder, component: SurfaceComponent): string {
  builder.components.push(component);
  return component.id;
}

/** Create a Text component and return its id. */
function emitText(builder: Builder, text: string, variant?: string): string {
  return emit(builder, {
    id: builder.nextId(),
    component: "Text",
    text,
    ...(variant ? { variant } : {}),
  });
}

/**
 * Per-type handler: converts a legacy node of a known `type` into one (or more)
 * catalog components, returning the id of the component representing this node.
 * `id` is the id reserved for this node; nested children mint their own via
 * `builder.nextId()`.
 */
type WalkHandler<T extends A2UIInput = A2UIInput> = (
  builder: Builder,
  node: T,
  id: string
) => string;

/** Narrow A2UIInput to a single discriminated arm by its `type`. */
type NodeOf<K extends A2UIInput["type"]> = Extract<A2UIInput, { type: K }>;

const handlers: { [K in A2UIInput["type"]]: WalkHandler<NodeOf<K>> } = {
  text: (builder, node, id) => emit(builder, { id, component: "Text", text: node.content }),

  heading: (builder, node, id) =>
    emit(builder, {
      id,
      component: "Text",
      text: node.text,
      variant: headingVariant(node.level),
    }),

  paragraph: (builder, node, id) => emit(builder, { id, component: "Text", text: node.text }),

  callout: (builder, node, id) => {
    // No catalog equivalent. Rendering as a noir Card produces a light
    // aged-paper block that clashes with the dark board, so emit a plain
    // Column on the dark surface instead (light text, in-theme).
    const childId = emitText(builder, node.content);
    return emit(builder, { id, component: "Column", children: [childId] });
  },

  badge: (builder, node, id) =>
    // Render as a styled pill. Models rarely set `variant`, so infer a
    // sensible color from the label when it's absent.
    emit(builder, {
      id,
      component: "Badge",
      label: node.label,
      variant: node.variant ?? inferBadgeVariant(node.label),
    }),

  card: (builder, node, id) => {
    const childIds: string[] = [emitText(builder, node.title, "h3")];
    if (node.description) {
      childIds.push(emitText(builder, node.description));
    }
    const columnId = emit(builder, {
      id: builder.nextId(),
      component: "Column",
      children: childIds,
    });
    return emit(builder, { id, component: "Card", child: columnId });
  },

  stat: (builder, node, id) =>
    // Emit a dedicated Stat component (rendered as a compact accented tile)
    // rather than loose label/value text on the dark surface.
    emit(builder, {
      id,
      component: "Stat",
      label: node.label,
      value: node.value,
      ...(node.helper ? { helper: node.helper } : {}),
    }),

  container: (builder, node, id) => {
    const children = node.children.map((child) => walk(builder, child));
    return emit(builder, { id, component: "Column", children });
  },

  column: (builder, node, id) => {
    const children = node.children.map((child) => walk(builder, child));
    return emit(builder, { id, component: "Column", children });
  },

  grid: (builder, node, id) => {
    // Emit a real Grid (CSS grid) so multi-column layouts aren't flattened
    // to a single vertical stack.
    const children = node.children.map((child) => walk(builder, child));
    return emit(builder, {
      id,
      component: "Grid",
      ...(node.columns ? { columns: node.columns } : {}),
      children,
    });
  },

  row: (builder, node, id) => {
    const children = node.children.map((child) => walk(builder, child));
    return emit(builder, { id, component: "Row", children });
  },

  divider: (builder, _node, id) => emit(builder, { id, component: "Divider" }),

  modal: (builder, node, id) => {
    // Wire trigger + content as id references for the Modal renderer.
    const triggerId = walk(builder, node.trigger);
    const contentId = walk(builder, node.content);
    return emit(builder, { id, component: "Modal", trigger: triggerId, content: contentId });
  },

  list: (builder, node, id) => {
    const childIds = node.items.map((item) => emitText(builder, item));
    return emit(builder, { id, component: "List", children: childIds });
  },

  table: (builder, node, id) =>
    // Emit a dedicated Table component (rendered as a real grid) rather than
    // flattening to pipe-separated text lines.
    emit(builder, {
      id,
      component: "Table",
      columns: node.columns,
      rows: node.rows,
    }),

  tabs: (builder, node, id) => {
    // Emit a real Tabs catalog component (clickable tab strip + panels). Each
    // tab references its content component by id (flat adjacency list).
    const tabItems = node.tabs.map((tab) => ({
      title: tab.label,
      child: walk(builder, tab.content),
    }));
    return emit(builder, { id, component: "Tabs", tabs: tabItems });
  },

  image: (builder, node, id) =>
    emit(builder, {
      id,
      component: "Image",
      url: node.src ?? "",
      ...(node.alt ? { accessibility: { label: node.alt } } : {}),
    }),

  video: (builder, node, id) =>
    // `url` carries the src (a real URL) or, for on-demand footage, the prompt
    // text (normalizeA2UI coalesced prompt → src). The renderer shows a real
    // URL as a player and a prompt as the "Generate footage" placeholder.
    // `poster` (preview frame, A2UI v1.0) only applies to a real playable clip.
    emit(builder, {
      id,
      component: "Video",
      url: node.src ?? "",
      ...(typeof node.poster === "string" && node.poster ? { poster: node.poster } : {}),
      ...(node.alt ? { accessibility: { label: node.alt } } : {}),
    }),

  input: (builder, node, id) =>
    emit(builder, {
      id,
      component: "TextField",
      label: node.label,
      ...(node.value ? { value: node.value } : {}),
    }),

  textarea: (builder, node, id) =>
    emit(builder, {
      id,
      component: "TextField",
      label: node.label,
      variant: "longText",
      ...(node.value ? { value: node.value } : {}),
    }),

  select: (builder, node, id) =>
    // Map to ChoicePicker (the catalog's option-list input) so the choices
    // actually render — a TextField would show an empty box and lose them.
    emit(builder, {
      id,
      component: "ChoicePicker",
      label: node.label,
      variant: "mutuallyExclusive",
      options: node.options.map((opt) => ({ label: opt, value: opt })),
      value: node.value ? [node.value] : [],
    }),

  slider: (builder, node, id) => {
    // The v0.9 catalog requires min/max/value; emit the same defaults the
    // renderer falls back to (0..100, value seeded to min) so the flat output
    // satisfies sliderSchema rather than relying on the renderer's guards.
    const min = typeof node.min === "number" ? node.min : 0;
    const max = typeof node.max === "number" ? node.max : 100;
    const value = node.value !== undefined ? node.value : min;
    // `step` (discrete snapping, A2UI v1.0) is passed through only when positive;
    // the catalog Slider + renderer already understand it.
    const step = typeof node.step === "number" && node.step > 0 ? node.step : undefined;
    return emit(builder, {
      id,
      component: "Slider",
      ...(node.label ? { label: node.label } : {}),
      min,
      max,
      ...(step !== undefined ? { step } : {}),
      value,
    });
  },

  checkbox: (builder, node, id) =>
    // The catalog CheckBox reads `value` (the renderer two-way-binds it). A
    // `{ path }`/`functionCall` binding passes through so the box tracks live
    // state; a literal is coerced to a boolean.
    emit(builder, {
      id,
      component: "CheckBox",
      label: node.label,
      value:
        node.checked && typeof node.checked === "object" ? node.checked : Boolean(node.checked),
    }),

  icon: (builder, node, id) =>
    // A single semantic glyph. The renderer maps `name` to a lucide icon (with a
    // graceful "help" fallback) and reads an optional `size`.
    emit(builder, {
      id,
      component: "Icon",
      name: node.name,
      ...(node.size ? { size: node.size } : {}),
    }),

  dateTimeInput: (builder, node, id) =>
    // Date/time picker. `value` is the catalog's required field; the renderer
    // chooses the native input type from enableDate/enableTime.
    emit(builder, {
      id,
      component: "DateTimeInput",
      value: node.value ?? "",
      ...(node.label ? { label: node.label } : {}),
      ...(node.enableDate !== undefined ? { enableDate: node.enableDate } : {}),
      ...(node.enableTime !== undefined ? { enableTime: node.enableTime } : {}),
      ...(node.min ? { min: node.min } : {}),
      ...(node.max ? { max: node.max } : {}),
    }),

  reveal: (builder, node, id) => {
    // A conditional wrapper: children render only when `when` resolves truthy.
    // The condition rides through untouched (the renderer's resolver evaluates
    // `{ path }` bindings and `functionCall` predicates against the data model).
    const children = node.children.map((child) => walk(builder, child));
    return emit(builder, { id, component: "Reveal", when: node.when, children });
  },

  stateImage: (builder, node, id) =>
    // A picture that swaps with a data value. `base` carries the initial scene
    // (a prompt the image pipeline resolves to a real url, or a url already);
    // `states` map each state value to an edit instruction the renderer applies
    // on demand and caches. `value` is the data binding the current state reads.
    emit(builder, {
      id,
      component: "StateImage",
      base: node.base,
      value: node.value,
      states: node.states,
      ...(node.alt ? { alt: node.alt } : {}),
    }),

  button: (builder, node, id) => {
    const childId = emitText(builder, node.label);
    // Preserve a rich action (a `{ functionCall }`/`{ event }` object, or an
    // ARRAY of them) verbatim so the renderer's runAction can dispatch it —
    // this is what makes reactive buttons (setValue/toggle/matchSet) work. A
    // bare legacy verb string ("submit"/"reset"/"log") or a missing action is
    // wrapped as a named server event, the historical behavior.
    const action =
      node.action && typeof node.action === "object"
        ? node.action
        : { event: { name: typeof node.action === "string" ? node.action : "click" } };
    return emit(builder, {
      id,
      component: "Button",
      child: childId,
      action,
    });
  },

  kanbanBoard: (builder, node, id) =>
    // Pass the validated payload through to the catalog KanbanBoardRenderer,
    // minting stable ids for columns/cards the model omitted (the renderer
    // keys on them).
    emit(builder, {
      id,
      component: "KanbanBoard",
      ...(node.title ? { title: node.title } : {}),
      columns: node.columns.map((col, colIndex) => ({
        id: col.id ?? `${id}-col-${colIndex}`,
        title: col.title,
        cards: col.cards.map((card, cardIndex) => ({
          id: card.id ?? `${id}-col-${colIndex}-card-${cardIndex}`,
          title: card.title,
          ...(card.description ? { description: card.description } : {}),
          ...(card.assignee ? { assignee: card.assignee } : {}),
          ...(card.tags && card.tags.length > 0 ? { tags: card.tags } : {}),
        })),
      })),
    }),

  audio: (builder, node, id) =>
    // Witness statement / voice log. A real `src` plays directly; a `script`
    // rides in the url field, which AudioPlayerRenderer reads as an
    // on-demand TTS statement (same pattern as video prompts).
    emit(builder, {
      id,
      component: "AudioPlayer",
      url: node.src ?? node.script ?? "",
      ...(node.description
        ? { description: node.description }
        : node.speaker
          ? { description: `Statement — ${node.speaker}` }
          : {}),
      ...(node.speaker ? { speaker: node.speaker } : {}),
    }),

  custom: (builder, node, id) =>
    // The escape hatch — model-written React rendered in the Sandpack
    // sandbox (CustomCodeRenderer).
    emit(builder, {
      id,
      component: "CustomCode",
      code: node.code,
      ...(node.title ? { title: node.title } : {}),
      ...(typeof node.height === "number" ? { height: node.height } : {}),
    }),

  dataDashboard: (builder, node, id) =>
    // Pass through to DataDashboardRenderer, minting widget ids as needed.
    emit(builder, {
      id,
      component: "DataDashboard",
      ...(node.title ? { title: node.title } : {}),
      widgets: node.widgets.map((widget, widgetIndex) => ({
        ...widget,
        id: widget.id ?? `${id}-w-${widgetIndex}`,
      })),
    }),

  relationshipGraph: (builder, node, id) =>
    // Pass the validated nodes/edges through to the RelationshipGraphRenderer,
    // which lays them out deterministically and draws the red-string edges.
    emit(builder, {
      id,
      component: "RelationshipGraph",
      ...(node.title ? { title: node.title } : {}),
      nodes: node.nodes.map((graphNode) => ({
        id: graphNode.id,
        label: graphNode.label,
        ...(graphNode.kind ? { kind: graphNode.kind } : {}),
        ...(graphNode.detail ? { detail: graphNode.detail } : {}),
      })),
      edges: node.edges.map((edge) => ({
        from: edge.from,
        to: edge.to,
        ...(edge.label ? { label: edge.label } : {}),
        ...(edge.kind ? { kind: edge.kind } : {}),
      })),
    }),
};

/**
 * Recursively convert a legacy node into catalog components, returning the id
 * of the component representing this node. Dispatches to the per-type handler
 * in `handlers`; an unknown type degrades to an "Unsupported component" Text.
 */
function walk(builder: Builder, node: A2UIInput, forcedId?: string): string {
  const id = forcedId ?? builder.nextId();
  const handler = handlers[node.type] as WalkHandler | undefined;
  if (!handler) {
    return emit(builder, {
      id,
      component: "Text",
      text: "Unsupported component",
      variant: "caption",
    });
  }
  return handler(builder, node, id);
}

/**
 * Flatten a legacy A2UI tree into catalog components for the v0.9 surface
 * renderer.
 *
 * @param node - The legacy component tree (validated internally).
 * @param options.idPrefix - Prefix for generated ids (keep unique per surface
 *   update to avoid collisions across multiple tool calls).
 * @param options.rootId - Id assigned to the top-level component (default "root").
 * @returns The flat component list and the root id.
 */
export function flattenLegacyToCatalog(
  node: unknown,
  options: { idPrefix?: string; rootId?: string } = {}
): FlattenResult {
  const rootId = options.rootId ?? "root";
  const prefix = options.idPrefix ?? "c";
  let counter = 0;

  const builder: Builder = {
    components: [],
    nextId: () => `${prefix}-${counter++}`,
  };

  // Normalize common LLM output variations (badge text→label, card-as-container,
  // text/content, image alt) before strict validation so reasonable model
  // output isn't rejected outright.
  const normalized = normalizeA2UI(node);
  const parsed = a2uiInputSchema.safeParse(normalized);
  if (parsed.success) {
    walk(builder, parsed.data, rootId);
    warnOnCatalogDrift(builder.components);
    return { components: builder.components, rootId };
  }

  // Strict parse failed. Rather than blanking the ENTIRE surface to one
  // "Unrenderable component" node (which is what made a single bad child wipe a
  // whole form), salvage the valid children: keep every child that parses on
  // its own and wrap them in a Column. Only if nothing can be salvaged do we
  // fall back to the placeholder.
  const salvagedChildren = salvageChildren(builder, normalized);
  if (salvagedChildren.length > 0) {
    builder.components.push({ id: rootId, component: "Column", children: salvagedChildren });
    warnOnCatalogDrift(builder.components);
    return { components: builder.components, rootId };
  }

  builder.components.push({
    id: rootId,
    component: "Text",
    text: "Unrenderable component",
    variant: "caption",
  });
  warnOnCatalogDrift(builder.components);
  return { components: builder.components, rootId };
}

/**
 * Best-effort recovery when a tree fails strict validation as a whole. Walks the
 * normalized node's `children` (or modal trigger/content), parsing each subtree
 * independently: valid subtrees are emitted, invalid ones are recursively
 * salvaged, and anything irrecoverable is dropped. Returns the ids of the
 * salvaged top-level children (in order).
 */
function salvageChildren(builder: Builder, normalized: unknown): string[] {
  if (!normalized || typeof normalized !== "object") return [];
  const node = normalized as Record<string, unknown>;

  // Collect candidate subtrees from the shapes that carry nested components.
  const candidates: unknown[] = [];
  if (Array.isArray(node.children)) candidates.push(...node.children);
  if (Array.isArray(node.tabs)) {
    for (const tab of node.tabs as unknown[]) {
      if (tab && typeof tab === "object") {
        const t = tab as Record<string, unknown>;
        if (t.content) candidates.push(t.content);
      }
    }
  }
  if (node.trigger) candidates.push(node.trigger);
  if (node.content) candidates.push(node.content);

  const ids: string[] = [];
  for (const candidate of candidates) {
    const parsed = a2uiInputSchema.safeParse(normalizeA2UI(candidate));
    if (parsed.success) {
      ids.push(walk(builder, parsed.data));
    } else {
      // Recurse: the child itself may be a container with some valid grandchildren.
      const salvaged = salvageChildren(builder, normalizeA2UI(candidate));
      if (salvaged.length === 0) {
        // This subtree is being DROPPED. Surface it loudly in dev so silent
        // content loss is visible (and so we can judge whether a model-repair
        // round-trip would ever be worth its latency).
        const type =
          candidate && typeof candidate === "object"
            ? ((candidate as { type?: unknown }).type ?? "(no type)")
            : typeof candidate;
        console.warn(
          `[a2ui] salvage dropped an unrenderable subtree (type: ${String(type)})`,
          parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".")}: ${i.message}`)
        );
      }
      ids.push(...salvaged);
    }
  }
  return ids;
}
