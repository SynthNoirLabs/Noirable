import type { A2UIComponent } from "@/lib/protocol/schema";

function firstNonEmpty(...values: Array<string | undefined>): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function findLabel(node: A2UIComponent): string | null {
  switch (node.type) {
    case "card":
      return firstNonEmpty(node.title, node.description);
    case "heading":
      return firstNonEmpty(node.text);
    case "text":
      return firstNonEmpty(node.content);
    case "paragraph":
      return firstNonEmpty(node.text);
    case "badge":
      return firstNonEmpty(node.label);
    case "stat":
      return firstNonEmpty(node.label, node.value);
    case "list":
      return firstNonEmpty(node.items[0]);
    case "table":
      return firstNonEmpty(node.columns[0]);
    case "image":
      return firstNonEmpty(node.alt);
    case "input":
    case "textarea":
    case "select":
    case "checkbox":
    case "button":
      return firstNonEmpty(node.label);
    case "tabs": {
      const firstTab = node.tabs[0];
      if (!firstTab) return null;
      return firstNonEmpty(firstTab.label, findLabel(firstTab.content));
    }
    case "container":
    case "row":
    case "column":
    case "grid": {
      for (const child of node.children) {
        const label = findLabel(child);
        if (label) return label;
      }
      return null;
    }
    default:
      return null;
  }
}

export function deriveEvidenceLabel(node: A2UIComponent): string {
  return findLabel(node) ?? "Evidence Item";
}

export function deriveEvidenceStatus(node: A2UIComponent): string | undefined {
  if (node.type === "card") return node.status;
  if (
    (node.type === "container" ||
      node.type === "row" ||
      node.type === "column" ||
      node.type === "grid") &&
    node.children
  ) {
    for (const child of node.children) {
      const status = deriveEvidenceStatus(child);
      if (status) return status;
    }
  }
  return undefined;
}
