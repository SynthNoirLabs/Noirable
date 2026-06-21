"use client";

import { motion } from "framer-motion";
import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "../internal/context";
import { useInternalEntrance } from "../internal/motion";
import { MissingComponent } from "../internal/registry";

// Table — a real grid with a header band and zebra/hover rows. Not part of the
// upstream v0.9 catalog, but emitted by the legacy→catalog adapter so legacy
// `table` components render properly instead of as flattened text.
export function TableRenderer({ component }: ComponentProps) {
  const table = component as SurfaceComponent & { columns?: unknown; rows?: unknown };
  const entrance = useInternalEntrance();
  const columns = Array.isArray(table.columns) ? (table.columns as unknown[]).map(String) : [];
  const rows = Array.isArray(table.rows)
    ? (table.rows as unknown[]).map((r) => (Array.isArray(r) ? r.map(String) : [String(r)]))
    : [];

  if (columns.length === 0 && rows.length === 0) {
    return <MissingComponent id={`${component.id} (empty table)`} />;
  }

  const rowClass = (r: number) =>
    cn(
      "border-b border-[var(--aesthetic-border)]/15 last:border-0 transition-colors hover:bg-[var(--aesthetic-text)]/5",
      r % 2 === 1 && "bg-[var(--aesthetic-text)]/[0.03]"
    );

  return (
    <div className="overflow-x-auto rounded-[var(--aesthetic-radius,2px)] border border-[var(--aesthetic-border)]/30">
      <table className="w-full border-collapse font-mono text-sm">
        {columns.length > 0 && (
          <thead>
            <tr className="bg-[var(--aesthetic-accent)]/10 border-b border-[var(--aesthetic-accent)]/30">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="text-left px-3 py-2 font-typewriter text-xs uppercase tracking-widest text-[var(--aesthetic-accent)]/90 whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, r) => {
            const cells = row.map((cell, c) => (
              <td key={c} className="px-3 py-2 text-[var(--aesthetic-text)]/85 align-top">
                {cell}
              </td>
            ));
            // Rows print in with the world's entrance physics (a nostromo
            // table rasters line-by-line); opacity-only so the row never
            // shifts the column layout mid-reveal.
            return entrance ? (
              <motion.tr
                key={r}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={entrance.transition(r)}
                className={rowClass(r)}
              >
                {cells}
              </motion.tr>
            ) : (
              <tr key={r} className={rowClass(r)}>
                {cells}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
