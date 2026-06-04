import { a2uiInputSchema, normalizeA2UI, type A2UIInput } from "@/lib/protocol/schema";
import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";

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
 * Recursively convert a legacy node into catalog components, returning the id
 * of the component representing this node.
 */
function walk(builder: Builder, node: A2UIInput, forcedId?: string): string {
  const id = forcedId ?? builder.nextId();

  switch (node.type) {
    case "text":
      return emit(builder, { id, component: "Text", text: node.content });

    case "heading":
      return emit(builder, {
        id,
        component: "Text",
        text: node.text,
        variant: headingVariant(node.level),
      });

    case "paragraph":
      return emit(builder, { id, component: "Text", text: node.text });

    case "callout": {
      // No catalog equivalent. Rendering as a noir Card produces a light
      // aged-paper block that clashes with the dark board, so emit a plain
      // Column on the dark surface instead (light text, in-theme).
      const childId = emitText(builder, node.content);
      return emit(builder, { id, component: "Column", children: [childId] });
    }

    case "badge":
      // Render as a styled pill. Models rarely set `variant`, so infer a
      // sensible color from the label when it's absent.
      return emit(builder, {
        id,
        component: "Badge",
        label: node.label,
        variant: node.variant ?? inferBadgeVariant(node.label),
      });

    case "card": {
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
    }

    case "stat": {
      // Emit a dedicated Stat component (rendered as a compact accented tile)
      // rather than loose label/value text on the dark surface.
      return emit(builder, {
        id,
        component: "Stat",
        label: node.label,
        value: node.value,
        ...(node.helper ? { helper: node.helper } : {}),
      });
    }

    case "container":
    case "column": {
      const children = node.children.map((child) => walk(builder, child));
      return emit(builder, { id, component: "Column", children });
    }

    case "grid": {
      // Emit a real Grid (CSS grid) so multi-column layouts aren't flattened
      // to a single vertical stack.
      const children = node.children.map((child) => walk(builder, child));
      return emit(builder, {
        id,
        component: "Grid",
        ...(node.columns ? { columns: node.columns } : {}),
        children,
      });
    }

    case "row": {
      const children = node.children.map((child) => walk(builder, child));
      return emit(builder, { id, component: "Row", children });
    }

    case "divider":
      return emit(builder, { id, component: "Divider" });

    case "modal": {
      // Wire trigger + content as id references for the Modal renderer.
      const triggerId = walk(builder, node.trigger);
      const contentId = walk(builder, node.content);
      return emit(builder, { id, component: "Modal", trigger: triggerId, content: contentId });
    }

    case "list": {
      const childIds = node.items.map((item) => emitText(builder, item));
      return emit(builder, { id, component: "List", children: childIds });
    }

    case "table": {
      // Emit a dedicated Table component (rendered as a real grid) rather than
      // flattening to pipe-separated text lines.
      return emit(builder, {
        id,
        component: "Table",
        columns: node.columns,
        rows: node.rows,
      });
    }

    case "tabs": {
      // Emit a real Tabs catalog component (clickable tab strip + panels). Each
      // tab references its content component by id (flat adjacency list).
      const tabItems = node.tabs.map((tab) => ({
        title: tab.label,
        child: walk(builder, tab.content),
      }));
      return emit(builder, { id, component: "Tabs", tabs: tabItems });
    }

    case "image":
      return emit(builder, {
        id,
        component: "Image",
        url: node.src ?? "",
        ...(node.alt ? { accessibility: { label: node.alt } } : {}),
      });

    case "input":
      return emit(builder, {
        id,
        component: "TextField",
        label: node.label,
        ...(node.value ? { value: node.value } : {}),
      });

    case "textarea":
      return emit(builder, {
        id,
        component: "TextField",
        label: node.label,
        variant: "longText",
        ...(node.value ? { value: node.value } : {}),
      });

    case "select":
      // Map to ChoicePicker (the catalog's option-list input) so the choices
      // actually render — a TextField would show an empty box and lose them.
      return emit(builder, {
        id,
        component: "ChoicePicker",
        label: node.label,
        variant: "mutuallyExclusive",
        options: node.options.map((opt) => ({ label: opt, value: opt })),
        value: node.value ? [node.value] : [],
      });

    case "slider":
      return emit(builder, {
        id,
        component: "Slider",
        ...(node.label ? { label: node.label } : {}),
        ...(typeof node.min === "number" ? { min: node.min } : {}),
        ...(typeof node.max === "number" ? { max: node.max } : {}),
        ...(node.value !== undefined ? { value: node.value } : {}),
      });

    case "checkbox":
      return emit(builder, {
        id,
        component: "CheckBox",
        label: node.label,
        value: Boolean(node.checked),
      });

    case "button": {
      const childId = emitText(builder, node.label);
      return emit(builder, {
        id,
        component: "Button",
        child: childId,
        action: { event: { name: node.action ?? "click" } },
      });
    }

    default:
      return emit(builder, {
        id,
        component: "Text",
        text: "Unsupported component",
        variant: "caption",
      });
  }
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
    return { components: builder.components, rootId };
  }

  builder.components.push({
    id: rootId,
    component: "Text",
    text: "Unrenderable component",
    variant: "caption",
  });
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
      ids.push(...salvageChildren(builder, normalizeA2UI(candidate)));
    }
  }
  return ids;
}
