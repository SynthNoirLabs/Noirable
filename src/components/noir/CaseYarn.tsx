"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useResolvedAesthetic } from "@/lib/aesthetic/useResolvedAesthetic";
import { getEffectsProfile } from "@/lib/aesthetic/identity";

interface Pin {
  x: number;
  y: number;
}

/**
 * The conspiracy-board yarn: pushpins on every paper evidence card, connected
 * by sagging red thread — the noir signature that makes the desk read as a
 * real case board. Renders ONLY when the active world's card material is
 * "paper" (noir and noir-based custom profiles) and there are at least two
 * cards to connect.
 *
 * Implementation: wraps the generated surface, measures the `.a2ui-card`
 * descendants (ResizeObserver + MutationObserver keep the pins glued through
 * streaming/expansion), and draws an SVG overlay of pins + quadratic threads
 * with gravity sag. Pointer-events: none — pure decoration.
 */
export function CaseYarn({ children }: { children: React.ReactNode }) {
  const { baseId } = useResolvedAesthetic();
  const enabled = getEffectsProfile(baseId).card === "paper";
  const containerRef = useRef<HTMLDivElement>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const cards = container.querySelectorAll<HTMLElement>('.a2ui-card[data-effect-card="paper"]');
    const nextPins: Pin[] = [];
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      // Pin sits where the corner tape is — top center, a touch inset.
      nextPins.push({
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top + 7,
      });
    });
    setPins(nextPins);
    setSize({ w: containerRect.width, h: container.scrollHeight });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    // Debounced re-measure glued to layout changes: streaming inserts cards,
    // images load, panes resize.
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    schedule();
    const mutationObserver = new MutationObserver(schedule);
    mutationObserver.observe(container, { childList: true, subtree: true, attributes: true });
    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
    resizeObserver?.observe(container);
    window.addEventListener("resize", schedule);

    return () => {
      cancelAnimationFrame(frame);
      mutationObserver.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [enabled, measure]);

  if (!enabled) {
    return <>{children}</>;
  }

  const threads = pins.slice(1).map((pin, i) => {
    const from = pins[i];
    const midX = (from.x + pin.x) / 2;
    // The thread sags under its own weight — more sag for longer spans.
    const span = Math.hypot(pin.x - from.x, pin.y - from.y);
    const sag = Math.min(34, 10 + span * 0.08);
    const midY = Math.max(from.y, pin.y) + sag;
    return { from, to: pin, midX, midY, key: i };
  });

  return (
    <div ref={containerRef} className="relative">
      {children}
      {pins.length >= 2 && (
        <svg
          data-testid="case-yarn"
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 z-10"
          width={size.w}
          height={size.h}
          viewBox={`0 0 ${size.w} ${size.h}`}
        >
          {threads.map(({ from, to, midX, midY, key }) => (
            <path
              key={key}
              d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
              fill="none"
              stroke="var(--aesthetic-error)"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.65"
            />
          ))}
          {pins.map((pin, i) => (
            <g key={i}>
              <circle cx={pin.x} cy={pin.y} r="4.5" fill="var(--aesthetic-error)" opacity="0.9" />
              <circle cx={pin.x - 1.2} cy={pin.y - 1.2} r="1.4" fill="#ffffff" opacity="0.55" />
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
