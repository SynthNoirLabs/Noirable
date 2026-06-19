"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ArrowLeftRight } from "lucide-react";
import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { getEffectsProfile } from "@/lib/aesthetic/identity";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "../internal/context";
import { useResolve, useBaseAestheticId } from "../internal/binding";
import { useInternalEntrance } from "../internal/motion";

export function DataDashboardRenderer({ component }: ComponentProps) {
  const dash = component as SurfaceComponent & {
    title?: unknown;
    widgets?: Array<{
      id: string;
      title: string;
      type: "metric" | "progress" | "chart";
      value?: string | number;
      unit?: string;
      progress?: number;
      chartType?: "line" | "bar" | "pie";
      data?: Array<{ label: string; value: number }>;
      trend?: {
        value: number;
        direction: "up" | "down" | "neutral";
      };
    }>;
  };

  const resolve = useResolve();
  const baseAestheticId = useBaseAestheticId();
  const entrance = useInternalEntrance();
  const dashTitle = dash.title ? String(resolve(dash.title)) : "";
  const widgets = dash.widgets || [];

  // Shared, var-driven base styling (see KanbanBoardRenderer): noir/minimal/
  // gothic and custom profiles ride the CSS vars; the phosphor / neon
  // decoration is driven by the effects profile (screen + card material) rather
  // than a hardcoded preset id. Glows are accent color-mixes, never literal hex.
  const effects = getEffectsProfile(baseAestheticId);
  const scanlines = effects.screen === "scanlines";
  const phosphor = effects.screen === "phosphor";
  const hologram = effects.card === "hologram";
  const wireframe = effects.card === "wireframe";

  const containerClass = cn(
    "font-mono text-[var(--aesthetic-text)] p-4 bg-[var(--aesthetic-background)] border border-[var(--aesthetic-border)]/40 rounded-sm",
    scanlines && "crt-scanlines",
    phosphor && "crt-glow",
    hologram &&
      "shadow-[0_0_10px_color-mix(in_srgb,var(--aesthetic-accent)_60%,transparent),inset_0_0_5px_color-mix(in_srgb,var(--aesthetic-accent)_45%,transparent)]"
  );
  const widgetClass = cn(
    "bg-[var(--aesthetic-surface)]/60 border border-[var(--aesthetic-border)]/30 p-4 rounded-sm shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-[var(--aesthetic-accent)]/40",
    hologram &&
      "border-[var(--aesthetic-accent-muted)]/50 shadow-[0_0_5px_color-mix(in_srgb,var(--aesthetic-accent)_20%,transparent)]"
  );
  const textClass = "text-xs text-[var(--aesthetic-text)]/65 font-typewriter";
  // Glowing metric values use text-shadow (a box-shadow on the span drew a
  // rectangle around the text box, not a glow on the glyphs).
  const valueClass = cn(
    "text-2xl font-bold text-[var(--aesthetic-accent)] font-typewriter tabular-nums",
    wireframe &&
      "tracking-wider [text-shadow:0_0_4px_color-mix(in_srgb,var(--aesthetic-accent)_55%,transparent)]",
    hologram && "[text-shadow:0_0_6px_color-mix(in_srgb,var(--aesthetic-accent)_55%,transparent)]"
  );
  const headerClass =
    "font-typewriter font-bold text-lg mb-4 text-[var(--aesthetic-text)] uppercase tracking-widest border-b border-[var(--aesthetic-border)]/30 pb-2";
  const progressBg =
    "bg-[var(--aesthetic-background)]/60 border border-[var(--aesthetic-border)]/20";
  const progressFill = cn(
    "bg-[var(--aesthetic-accent)] shadow-[0_2px_8px_color-mix(in_srgb,var(--aesthetic-accent)_15%,transparent)]",
    wireframe && "shadow-[0_0_6px_color-mix(in_srgb,var(--aesthetic-accent)_50%,transparent)]",
    hologram && "shadow-[0_0_8px_color-mix(in_srgb,var(--aesthetic-accent)_50%,transparent)]"
  );

  // Handle missing metrics or invalid dataset structures gracefully
  if (widgets.length === 0) {
    return (
      <div className={containerClass}>
        {dashTitle && <div className={headerClass}>{dashTitle}</div>}
        <div className="text-center py-8 opacity-65 text-xs">No widgets configured</div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {dashTitle && <div className={headerClass}>{dashTitle}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {widgets.map((widget, widgetIndex) => {
          const TrendIcon = widget.trend
            ? widget.trend.direction === "up"
              ? TrendingUp
              : widget.trend.direction === "down"
                ? TrendingDown
                : ArrowLeftRight
            : null;
          // Trend colors ride the theme tokens (accent = good, error = bad)
          // instead of Tailwind emerald/rose, which matched no world.
          const trendColor = widget.trend
            ? widget.trend.direction === "up"
              ? "text-[var(--aesthetic-accent)]"
              : widget.trend.direction === "down"
                ? "text-[var(--aesthetic-error)]"
                : "text-[var(--aesthetic-text)]/50"
            : "";

          const WidgetBox = entrance ? motion.div : "div";
          const widgetMotionProps = entrance
            ? {
                initial: entrance.hidden,
                animate: entrance.show,
                transition: entrance.transition(widgetIndex),
              }
            : {};

          return (
            <WidgetBox key={widget.id} className={widgetClass} {...widgetMotionProps}>
              <div className="font-bold text-xs uppercase tracking-wider mb-2 opacity-85">
                {widget.title}
              </div>

              {/* Metric Widget */}
              {widget.type === "metric" && (
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1">
                    <span className={valueClass}>{widget.value ?? "—"}</span>
                    {widget.unit && (
                      <span className="text-xs opacity-60 ml-0.5">{widget.unit}</span>
                    )}
                  </div>
                  {widget.trend && TrendIcon && (
                    <div
                      className={cn(
                        "text-[10px] mt-1 flex items-center gap-1 font-sans",
                        trendColor
                      )}
                    >
                      <TrendIcon className="w-3 h-3" />
                      <span className="font-bold">{widget.trend.value}%</span>
                      <span className="opacity-70">since last check</span>
                    </div>
                  )}
                </div>
              )}

              {/* Progress Widget */}
              {widget.type === "progress" && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-baseline">
                    <span className={valueClass}>{widget.progress ?? 0}%</span>
                    <span className={textClass}>Progress</span>
                  </div>
                  <div className={cn("w-full h-2 rounded-full overflow-hidden", progressBg)}>
                    <div
                      className={cn("h-full transition-all duration-300", progressFill)}
                      style={{ width: `${Math.min(Math.max(widget.progress ?? 0, 0), 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Chart Widget */}
              {widget.type === "chart" && (
                <div className="flex flex-col gap-2 h-24 justify-end">
                  {!widget.data || widget.data.length === 0 ? (
                    <div className="text-center py-4 text-xs opacity-50 italic">No chart data</div>
                  ) : (
                    <>
                      <div className="flex items-end gap-2 h-16 px-1">
                        {widget.data.map((item, idx) => {
                          const maxVal = Math.max(...(widget.data?.map((d) => d.value) || [1]));
                          const percentage = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
                          return (
                            <div
                              key={idx}
                              className="flex-1 flex flex-col items-center h-full justify-end group relative"
                            >
                              <div
                                className="w-full bg-current/25 hover:bg-current/45 transition-all rounded-t-sm"
                                style={{ height: `${Math.max(percentage, 5)}%` }}
                                title={`${item.label}: ${item.value}`}
                              />
                              {/* Small tooltip on hover — themed surface, not a hardcoded neutral */}
                              <span className="absolute bottom-full mb-1 scale-0 group-hover:scale-100 transition-transform bg-[var(--aesthetic-surface-alt,var(--aesthetic-surface))] text-[var(--aesthetic-text)] border border-[var(--aesthetic-border)]/50 text-[9px] px-1 py-0.5 rounded shadow-md z-10 whitespace-nowrap">
                                {item.value}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-[9px] opacity-65 font-sans border-t border-current/15 pt-1 px-1">
                        <span>{widget.data[0]?.label}</span>
                        <span>{widget.data[widget.data.length - 1]?.label}</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </WidgetBox>
          );
        })}
      </div>
    </div>
  );
}
