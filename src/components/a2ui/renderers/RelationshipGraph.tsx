"use client";

import { motion } from "framer-motion";
import { Eye, FileSearch, MapPin, Skull, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { getEffectsProfile } from "@/lib/aesthetic/identity";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "../internal/context";
import { useResolve, useBaseAestheticId } from "../internal/binding";
import { useInternalEntrance } from "../internal/motion";

type NodeKind = "suspect" | "victim" | "location" | "clue" | "witness";
type EdgeKind = "alibi" | "motive" | "connection" | "witnessed";

interface GraphNode {
  id: string;
  label: string;
  kind?: NodeKind;
  detail?: string;
}

interface GraphEdge {
  from: string;
  to: string;
  label?: string;
  kind?: EdgeKind;
}

interface PositionedNode extends GraphNode {
  x: number;
  y: number;
}

// Fixed viewBox the graph is drawn into; the SVG scales to its container width.
const VIEW_W = 640;
const VIEW_H = 420;
const CENTER_X = VIEW_W / 2;
const CENTER_Y = VIEW_H / 2;
const NODE_R = 7;

const KIND_ICON: Record<NodeKind, LucideIcon> = {
  suspect: User,
  victim: Skull,
  location: MapPin,
  clue: FileSearch,
  witness: Eye,
};

/**
 * Lay nodes out on an evenly-spaced circle, computed purely from index so the
 * layout is deterministic (no Math.random — required for SSR determinism). A
 * single node sits at the center; the circle radius shrinks slightly with the
 * count so dense webs still fit the frame. The starting angle is offset to
 * -90deg so the first node sits at the top of the board.
 */
function layoutNodes(nodes: GraphNode[]): PositionedNode[] {
  if (nodes.length === 1) {
    return [{ ...nodes[0], x: CENTER_X, y: CENTER_Y }];
  }
  const radius = Math.min(CENTER_X, CENTER_Y) - 70;
  return nodes.map((node, index) => {
    const angle = (index / nodes.length) * Math.PI * 2 - Math.PI / 2;
    return {
      ...node,
      x: CENTER_X + Math.cos(angle) * radius,
      y: CENTER_Y + Math.sin(angle) * radius,
    };
  });
}

export function RelationshipGraphRenderer({ component }: ComponentProps) {
  const graph = component as SurfaceComponent & {
    title?: unknown;
    nodes?: GraphNode[];
    edges?: GraphEdge[];
  };

  const resolve = useResolve();
  const baseAestheticId = useBaseAestheticId();
  const entrance = useInternalEntrance();
  const graphTitle = graph.title ? String(resolve(graph.title)) : "";
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];

  // Var-driven base styling (see KanbanBoardRenderer): color rides the aesthetic
  // CSS vars so every world and custom profile adapt for free; the phosphor /
  // hologram decoration is driven by the effects profile, never a preset id.
  const effects = getEffectsProfile(baseAestheticId);
  const scanlines = effects.screen === "scanlines";
  const phosphor = effects.screen === "phosphor";
  const hologram = effects.card === "hologram";

  const containerClass = cn(
    "font-mono text-[var(--aesthetic-text)] p-4 bg-[var(--aesthetic-background)] border border-[var(--aesthetic-border)]/40 rounded-sm",
    scanlines && "crt-scanlines",
    phosphor && "crt-glow",
    hologram &&
      "shadow-[0_0_10px_color-mix(in_srgb,var(--aesthetic-accent)_60%,transparent),inset_0_0_5px_color-mix(in_srgb,var(--aesthetic-accent)_45%,transparent)]"
  );
  const headerClass =
    "font-typewriter font-bold text-lg mb-4 text-[var(--aesthetic-text)] uppercase tracking-widest border-b border-[var(--aesthetic-border)]/30 pb-2";

  if (nodes.length === 0) {
    return (
      <div className={containerClass}>
        {graphTitle && <div className={headerClass}>{graphTitle}</div>}
        <div className="text-center py-8 opacity-65 text-xs">No connections to map</div>
      </div>
    );
  }

  const positioned = layoutNodes(nodes);
  const byId = new Map(positioned.map((node) => [node.id, node]));

  // Only draw edges whose endpoints both resolve to a placed node.
  const drawnEdges = edges
    .map((edge) => {
      const from = byId.get(edge.from);
      const to = byId.get(edge.to);
      if (!from || !to) return null;
      // The thread sags under its own weight, just like the CaseYarn overlay:
      // more sag for longer spans. The control point bows toward board-bottom.
      const span = Math.hypot(to.x - from.x, to.y - from.y);
      const sag = Math.min(38, 14 + span * 0.08);
      const midX = (from.x + to.x) / 2;
      const midY = Math.max(from.y, to.y) + sag;
      // Place the label at the curve's TRUE midpoint (the quadratic Bézier at
      // t=0.5), not at the control point (midX, midY). The control point sits far
      // below the visible string, so labelling there pushed every label toward
      // board-bottom where radial edges all converge — they stacked. The real
      // midpoint rides along each string, spreading labels apart.
      const labelX = 0.25 * from.x + 0.5 * midX + 0.25 * to.x;
      const labelY = 0.25 * from.y + 0.5 * midY + 0.25 * to.y;
      // Crime/motive strings are the accusing red thread; everything else is a
      // muted neutral string so the dangerous links pop on the board.
      const isCrime = edge.kind === "motive" || edge.kind === "alibi";
      const stroke = isCrime
        ? "var(--aesthetic-error)"
        : "color-mix(in srgb, var(--aesthetic-text) 55%, transparent)";
      return { from, to, midX, midY, labelX, labelY, stroke, label: edge.label };
    })
    .filter((edge): edge is NonNullable<typeof edge> => edge !== null);

  return (
    <div className={containerClass}>
      {graphTitle && <div className={headerClass}>{graphTitle}</div>}
      <div className="relative w-full">
        <svg
          data-testid="relationship-graph"
          role="img"
          aria-label={graphTitle || "Relationship graph"}
          className="w-full h-auto"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Red-string edges, drawn under the pushpins. */}
          {drawnEdges.map((edge, index) => (
            <g key={`edge-${index}`}>
              <path
                data-testid="graph-edge"
                d={`M ${edge.from.x} ${edge.from.y} Q ${edge.midX} ${edge.midY} ${edge.to.x} ${edge.to.y}`}
                fill="none"
                stroke={edge.stroke}
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.7"
              />
              {edge.label && (
                <text
                  x={edge.labelX}
                  y={edge.labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-typewriter"
                  fontSize="9"
                  fill="var(--aesthetic-text)"
                  opacity="0.75"
                  // Knockout halo: paint a background-colored outline UNDER the
                  // glyphs so a label stays legible where it crosses a string or
                  // another label (paint-order draws the stroke first).
                  stroke="var(--aesthetic-background)"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  style={{ paintOrder: "stroke" }}
                >
                  {edge.label}
                </text>
              )}
            </g>
          ))}

          {/* Pushpin nodes with a kind icon + label. */}
          {positioned.map((node, index) => {
            const Icon = node.kind ? KIND_ICON[node.kind] : User;
            // The label sits on whichever side keeps it inside the frame: lower
            // nodes label ABOVE the pin, upper nodes BELOW. The kind icon goes on
            // the OPPOSITE side from the label so the two never overlap (the
            // previous code always drew the icon above, colliding with an
            // above-flipped label).
            const labelAbove = node.y > CENTER_Y;
            const labelY = labelAbove ? node.y - 16 : node.y + 24;
            const iconY = labelAbove ? node.y + 8 : node.y - 26;
            const pin = (
              <g>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={NODE_R}
                  fill="var(--aesthetic-error)"
                  opacity="0.9"
                />
                <circle cx={node.x - 1.6} cy={node.y - 1.6} r="1.8" fill="#ffffff" opacity="0.55" />
                <foreignObject x={node.x - 9} y={iconY} width="18" height="18">
                  <div className="flex items-center justify-center text-[var(--aesthetic-accent)]">
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </div>
                </foreignObject>
                <text
                  x={node.x}
                  y={labelY}
                  textAnchor="middle"
                  className="font-typewriter uppercase tracking-wide"
                  fontSize="11"
                  fill="var(--aesthetic-text)"
                  // Same knockout halo as edge labels, so a node label stays
                  // legible if a string passes behind it.
                  stroke="var(--aesthetic-background)"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  style={{ paintOrder: "stroke" }}
                >
                  {node.label}
                </text>
              </g>
            );
            return entrance ? (
              <motion.g
                key={node.id}
                initial={entrance.hidden}
                animate={entrance.show}
                transition={entrance.transition(index)}
              >
                {pin}
              </motion.g>
            ) : (
              <g key={node.id}>{pin}</g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
