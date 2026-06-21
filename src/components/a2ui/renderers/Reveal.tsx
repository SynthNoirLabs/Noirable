"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { type ComponentProps } from "../internal/context";
import { useResolve } from "../internal/binding";
import { ChildList } from "../internal/registry";

/**
 * Reveal — a conditional wrapper. Its children mount only while `when` resolves
 * truthy against the live data model. `when` is any Dynamic value:
 *   - `{ path: "/unlocked" }`            → shows when that path is truthy
 *   - `{ call: "eq", args: { a: { path: "/code" }, b: "937-ALPHA" } }`
 *
 * This is the generic gate/branch/reveal-on-state primitive: pair it with a
 * button whose action writes the state (`setValue`/`toggle`/`matchSet`) and the
 * surface reacts. Children fade/scale in so the reveal reads as an event, not a
 * layout jump (reduced-motion shows/hides instantly).
 */
export function RevealRenderer({ component }: ComponentProps) {
  const resolve = useResolve();
  const prefersReducedMotion = useReducedMotion();
  const reveal = component as SurfaceComponent & { when?: unknown; children?: unknown };

  const shown = Boolean(resolve(reveal.when));

  if (prefersReducedMotion) {
    return shown ? <ChildList childList={reveal.children} /> : null;
  }

  return (
    <AnimatePresence initial={false}>
      {shown && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          style={{ overflow: "hidden" }}
        >
          <ChildList childList={reveal.children} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
