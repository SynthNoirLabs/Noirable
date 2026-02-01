import type { A2UIInput } from "@/lib/protocol/schema";
import type { TrainingCategory, TrainingComplexity } from "./types";

/**
 * Extract all component types used in an A2UI tree
 */
export function extractComponentTypes(node: A2UIInput): string[] {
  const types = new Set<string>();

  function traverse(n: A2UIInput): void {
    types.add(n.type);

    // Handle children for container types
    if ("children" in n && Array.isArray(n.children)) {
      for (const child of n.children) {
        traverse(child);
      }
    }

    // Handle tabs content
    if (n.type === "tabs" && Array.isArray(n.tabs)) {
      for (const tab of n.tabs) {
        traverse(tab.content);
      }
    }
  }

  traverse(node);
  return Array.from(types).sort();
}

/**
 * Count total components in an A2UI tree
 */
export function countComponents(node: A2UIInput): number {
  let count = 1;

  if ("children" in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      count += countComponents(child);
    }
  }

  if (node.type === "tabs" && Array.isArray(node.tabs)) {
    for (const tab of node.tabs) {
      count += countComponents(tab.content);
    }
  }

  return count;
}

/**
 * Calculate nesting depth of an A2UI tree
 */
export function calculateDepth(node: A2UIInput): number {
  let maxChildDepth = 0;

  if ("children" in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      maxChildDepth = Math.max(maxChildDepth, calculateDepth(child));
    }
  }

  if (node.type === "tabs" && Array.isArray(node.tabs)) {
    for (const tab of node.tabs) {
      maxChildDepth = Math.max(maxChildDepth, calculateDepth(tab.content));
    }
  }

  return 1 + maxChildDepth;
}

// Component type to category mapping
const FORM_COMPONENTS = new Set(["input", "textarea", "select", "checkbox", "button"]);
const DATA_COMPONENTS = new Set(["table", "list", "stat"]);
const CARD_COMPONENTS = new Set(["card"]);
const LAYOUT_COMPONENTS = new Set(["container", "row", "column", "grid", "tabs"]);
const DASHBOARD_INDICATORS = new Set(["stat", "grid", "tabs"]);

/**
 * Infer category from A2UI component structure
 */
export function inferCategory(node: A2UIInput): TrainingCategory {
  const types = extractComponentTypes(node);
  const typeSet = new Set(types);

  // Count component categories present
  const hasFormComponents = types.some((t) => FORM_COMPONENTS.has(t));
  const hasDataComponents = types.some((t) => DATA_COMPONENTS.has(t));
  const hasCardComponents = types.some((t) => CARD_COMPONENTS.has(t));
  const hasDashboardIndicators = types.some((t) => DASHBOARD_INDICATORS.has(t));
  const pureLayout = types.every(
    (t) => LAYOUT_COMPONENTS.has(t) || t === "text" || t === "heading"
  );

  // Calculate category scores
  let categories: { category: TrainingCategory; score: number }[] = [];

  // Form: has form elements
  if (hasFormComponents) {
    const formCount = types.filter((t) => FORM_COMPONENTS.has(t)).length;
    categories.push({ category: "form", score: formCount * 2 });
  }

  // Dashboard: has stats/grids/tabs with data
  if (hasDashboardIndicators && (hasDataComponents || typeSet.has("stat"))) {
    categories.push({ category: "dashboard", score: 3 });
  }

  // Card: primarily card-based
  if (hasCardComponents) {
    categories.push({
      category: "card",
      score: types.filter((t) => t === "card").length * 2,
    });
  }

  // Data: has tables/lists/stats without form
  if (hasDataComponents && !hasFormComponents) {
    categories.push({ category: "data", score: 2 });
  }

  // Layout: pure structural
  if (pureLayout) {
    categories.push({ category: "layout", score: 1 });
  }

  // Sort by score and return highest
  categories = categories.sort((a, b) => b.score - a.score);

  if (categories.length === 0) {
    return "mixed";
  }

  // If multiple categories have similar scores, return "mixed"
  if (categories.length > 1 && categories[0].score === categories[1].score) {
    return "mixed";
  }

  return categories[0].category;
}

/**
 * Infer complexity from A2UI component structure
 */
export function inferComplexity(node: A2UIInput): TrainingComplexity {
  const componentCount = countComponents(node);
  const depth = calculateDepth(node);
  const types = extractComponentTypes(node);
  const uniqueTypes = types.length;

  // Complexity scoring
  let score = 0;

  // Component count contribution (0-4 points)
  if (componentCount <= 3) score += 0;
  else if (componentCount <= 8) score += 1;
  else if (componentCount <= 15) score += 2;
  else if (componentCount <= 25) score += 3;
  else score += 4;

  // Depth contribution (0-3 points)
  if (depth <= 2) score += 0;
  else if (depth <= 4) score += 1;
  else if (depth <= 6) score += 2;
  else score += 3;

  // Type diversity contribution (0-3 points)
  if (uniqueTypes <= 2) score += 0;
  else if (uniqueTypes <= 5) score += 1;
  else if (uniqueTypes <= 8) score += 2;
  else score += 3;

  // Map score to complexity
  if (score <= 2) return "simple";
  if (score <= 6) return "moderate";
  return "complex";
}
