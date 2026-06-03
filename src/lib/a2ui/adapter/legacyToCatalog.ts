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
      // No catalog equivalent — wrap the text in a Card for visual emphasis.
      const childId = emitText(builder, node.content);
      return emit(builder, { id, component: "Card", child: childId });
    }

    case "badge":
      return emit(builder, { id, component: "Text", text: node.label, variant: "caption" });

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
      const childIds: string[] = [
        emitText(builder, node.label, "caption"),
        emitText(builder, node.value, "h3"),
      ];
      if (node.helper) {
        childIds.push(emitText(builder, node.helper, "caption"));
      }
      const columnId = emit(builder, {
        id: builder.nextId(),
        component: "Column",
        children: childIds,
      });
      return emit(builder, { id, component: "Card", child: columnId });
    }

    case "container":
    case "column":
    case "grid": {
      // grid has no catalog equivalent — approximate vertically.
      const children = node.children.map((child) => walk(builder, child));
      return emit(builder, { id, component: "Column", children });
    }

    case "row": {
      const children = node.children.map((child) => walk(builder, child));
      return emit(builder, { id, component: "Row", children });
    }

    case "divider":
      return emit(builder, { id, component: "Divider" });

    case "list": {
      const childIds = node.items.map((item) => emitText(builder, item));
      return emit(builder, { id, component: "List", children: childIds });
    }

    case "table": {
      // No catalog table — render header + rows as Text lines inside a Column.
      const childIds: string[] = [emitText(builder, node.columns.join("  |  "), "h5")];
      for (const row of node.rows) {
        childIds.push(emitText(builder, row.join("  |  ")));
      }
      return emit(builder, { id, component: "List", children: childIds });
    }

    case "tabs": {
      // No catalog tabs in the surface renderer — stack each panel under its
      // label heading.
      const childIds: string[] = [];
      for (const tab of node.tabs) {
        childIds.push(emitText(builder, tab.label, "h4"));
        childIds.push(walk(builder, tab.content));
      }
      return emit(builder, { id, component: "Column", children: childIds });
    }

    case "image":
      return emit(builder, {
        id,
        component: "Image",
        url: node.src ?? "",
        ...(node.alt ? { accessibility: { label: node.alt } } : {}),
      });

    case "input":
    case "textarea":
    case "select":
      // TextField is the closest catalog input. Loses select options/rows.
      return emit(builder, {
        id,
        component: "TextField",
        label: node.label,
        ...(node.value ? { value: node.value } : {}),
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
  const parsed = a2uiInputSchema.safeParse(normalizeA2UI(node));
  if (!parsed.success) {
    builder.components.push({
      id: rootId,
      component: "Text",
      text: "Unrenderable component",
      variant: "caption",
    });
    return { components: builder.components, rootId };
  }

  walk(builder, parsed.data, rootId);
  return { components: builder.components, rootId };
}
