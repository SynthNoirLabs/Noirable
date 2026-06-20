"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { PhotoDeveloper } from "@/components/noir/PhotoDeveloper";
import { type ComponentProps } from "../internal/context";
import { useResolve } from "../internal/binding";

interface StateDef {
  state: string;
  instruction: string;
}

/**
 * StateImage — a picture that changes with a data-model value.
 *
 * `base` is the initial scene's stored url (the image pipeline already resolved
 * a prompt to `/api/images/<uuid>`). `value` is a binding (`{ path }`) whose
 * current value selects a state; each non-base state carries an EDIT
 * `instruction` applied to the base via `/fork` (a non-destructive Gemini edit
 * that keeps the scene/subject and returns a NEW url). Each generated state url
 * is cached, so flipping back to a seen state is instant — no regeneration.
 *
 * Example: a closed blast door whose `/unlocked` flag, once true, edits to
 * "the heavy blast door is now open, revealing the corridor beyond."
 */
export function StateImageRenderer({ component }: ComponentProps) {
  const resolve = useResolve();
  const img = component as SurfaceComponent & {
    base?: unknown;
    value?: unknown;
    states?: StateDef[];
    alt?: unknown;
  };

  // `base` is a plain prompt/url string per the schema (the image pipeline
  // already resolved any prompt to a stored `/api/images/...` url), so it is NOT
  // a data binding — only `value` is resolved against the data model.
  const base = typeof img.base === "string" ? img.base : "";
  const alt = img.alt ? String(resolve(img.alt)) : "Image";
  const states = Array.isArray(img.states) ? img.states : [];
  const currentState = String(resolve(img.value) ?? "");

  // Cache of cache-key → resolved image url, held in STATE (not a ref) so reads
  // are render-safe. The base url keys under "__base"; each generated state url
  // keys under "state:<name>". A flip back to a seen state reuses its url with
  // no network round-trip. Re-seeded when the resolved base url changes.
  const [cache, setCache] = useState<Record<string, string>>(base ? { __base: base } : {});

  // Adjust state during render (React's recommended pattern) when the base url
  // changes: reset the cache to just the new base, dropping stale state edits.
  const [seenBase, setSeenBase] = useState(base);
  if (base && seenBase !== base) {
    setSeenBase(base);
    setCache({ __base: base });
  }

  // The key of the most recent state whose fork FAILED, so the spinner clears
  // (we fall back to the base) instead of spinning forever on an error or a
  // rate-limited /fork. Cleared below whenever the selected state changes, so
  // re-selecting a failed state retries once more.
  const [failedKey, setFailedKey] = useState<string | null>(null);

  const def = states.find((s) => s.state === currentState);
  // The base state (or an unknown state with no edit instruction) shows base.
  const cacheKey = def ? `state:${def.state}` : "__base";
  const cachedUrl = cache[cacheKey];

  // Reset a stale failure when the user moves to a DIFFERENT state, so flipping
  // back later attempts the fork again (adjust-state-during-render pattern).
  if (failedKey !== null && failedKey !== cacheKey) {
    setFailedKey(null);
  }

  // A state edit is in flight whenever the selected state isn't cached yet,
  // hasn't just failed, and there's a real base to fork from. Derived (not a
  // separate flag) so we never call setState inside the generating effect.
  const needsEdit =
    !cachedUrl && failedKey !== cacheKey && Boolean(def) && base.startsWith("/api/images/");

  useEffect(() => {
    if (!needsEdit || !def) return;

    let alive = true;
    const fileName = base.replace("/api/images/", "").split("?")[0];
    fetch(`/api/images/${fileName}/fork`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instruction: def.instruction }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { url?: string } | null) => {
        if (!alive) return;
        if (data?.url) {
          setCache((prev) => ({ ...prev, [cacheKey]: data.url as string }));
        } else {
          // Fork failed (network/model/rate-limit) — stop the spinner and keep
          // showing the base rather than hanging.
          setFailedKey(cacheKey);
        }
      })
      .catch(() => {
        if (alive) setFailedKey(cacheKey);
      });
    return () => {
      alive = false;
    };
  }, [needsEdit, def, base, cacheKey]);

  // Show the cached url for this state, falling back to the base while a state
  // edit is still generating (so the picture never blanks mid-transition).
  const shownUrl = cachedUrl ?? cache.__base ?? base;

  if (!shownUrl) return null;

  return (
    <div className="relative inline-block">
      <PhotoDeveloper src={shownUrl} alt={alt} caption={alt} />
      {needsEdit && (
        <div className="pointer-events-none absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-[var(--aesthetic-radius,2px)] border border-[var(--aesthetic-accent)]/50 bg-[var(--aesthetic-background)]/85 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--aesthetic-accent)]">
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          Reacting
        </div>
      )}
    </div>
  );
}
