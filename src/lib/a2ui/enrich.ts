import type { A2UIInput } from "@/lib/protocol/schema";

/**
 * Post-generation enrichment: cheap, deterministic tidy-ups applied to a
 * VALIDATED legacy A2UI tree before it's flattened to the catalog. Even with a
 * good prompt, models tend to emit flat stacks — a column of five bare cards, a
 * leading line of text that should be a heading. These transforms raise the
 * floor on EVERY generation for zero extra LLM cost.
 *
 * Principles: pure, idempotent (running twice == running once), and
 * conservative — only reshape when the intent is unambiguous, never drop or
 * rewrite content. Anything uncertain is left exactly as the model emitted it.
 */

/** Min sibling cards before we auto-wrap them in a grid. */
const GRID_THRESHOLD = 3;
/** A leading text/paragraph longer than this is body copy, not a heading. */
const HEADING_MAX_LEN = 60;

type Node = A2UIInput;

function hasChildren(node: Node): node is Node & { children: Node[] } {
  return (
    (node.type === "container" ||
      node.type === "row" ||
      node.type === "column" ||
      node.type === "grid") &&
    Array.isArray((node as { children?: unknown }).children)
  );
}

/**
 * Wrap a run of 3+ consecutive `card` children in a grid so a stack of cards
 * renders as a 2–3 column board instead of a tall single column. Skips children
 * already inside a grid (idempotent) and rows (intentionally horizontal).
 */
function autoGridCards(children: Node[]): Node[] {
  // Only act when the cards dominate the container and aren't already gridded.
  const cardCount = children.filter((c) => c.type === "card").length;
  if (cardCount < GRID_THRESHOLD) return children;
  // Mixed content (cards interleaved with other components) is left alone — the
  // model likely intended a specific vertical order. Only an all-card run wraps.
  if (cardCount !== children.length) return children;

  const columns = children.length >= 4 ? "3" : "2";
  return [{ type: "grid", columns, children } as Node];
}

/**
 * Promote a short leading text/paragraph at the top of the root into a heading,
 * so a generated surface gets a real title instead of a stray sentence. Only the
 * FIRST child, only if short, only if there isn't already a heading there.
 */
function promoteLeadingHeading(children: Node[]): Node[] {
  if (children.length < 2) return children;
  const first = children[0];
  // A `text` node carries `content`; a `paragraph` carries `text`.
  const copy =
    first.type === "text"
      ? (first as { content?: unknown }).content
      : first.type === "paragraph"
        ? (first as { text?: unknown }).text
        : undefined;
  if (typeof copy !== "string" || copy.trim().length === 0 || copy.length > HEADING_MAX_LEN) {
    return children;
  }
  // Don't promote if the next sibling is already a heading (avoid double titles).
  if (children[1]?.type === "heading") return children;

  const heading: Node = { type: "heading", text: copy, level: 2 } as Node;
  return [heading, ...children.slice(1)];
}

/** Recurse depth-first, enriching each container's children bottom-up. */
function enrichNode(node: Node, isRoot: boolean): Node {
  if (!hasChildren(node)) return node;

  // Enrich descendants first so wrapping decisions see final child shapes.
  let children = node.children.map((child) => enrichNode(child, false));

  // Heading promotion is a root-level affordance (the surface title); grid
  // wrapping applies to any container that isn't already a grid.
  if (isRoot) children = promoteLeadingHeading(children);
  if (node.type !== "grid") children = autoGridCards(children);

  return { ...node, children } as Node;
}

/**
 * Enrich a validated legacy A2UI tree. Returns a new tree; the input is not
 * mutated. Safe to skip (returns the input unchanged) for leaf roots.
 */
export function enrichA2UI(tree: A2UIInput): A2UIInput {
  return enrichNode(tree, true);
}
