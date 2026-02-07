/**
 * Shared CSS token-to-class mappings used by both the live renderer and code export.
 * Single source of truth for Tailwind class lookups.
 */

export const spacingClasses: Record<string, string> = {
  none: "",
  xs: "gap-2",
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
};

export const paddingClasses: Record<string, string> = {
  none: "",
  xs: "p-2",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
  xl: "p-8",
};

export const alignClasses: Record<string, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

export const widthClasses: Record<string, string> = {
  auto: "w-auto",
  full: "w-full",
  "1/2": "w-1/2",
  "1/3": "w-1/3",
  "2/3": "w-2/3",
};

export const gridColsClasses: Record<string, string> = {
  "2": "grid-cols-2",
  "3": "grid-cols-3",
  "4": "grid-cols-4",
};

export const variantClasses: Record<string, string> = {
  primary: "bg-amber-500 text-zinc-900 border-amber-500/60",
  secondary: "bg-zinc-900 text-zinc-100 border-zinc-700/50",
  ghost: "bg-transparent text-zinc-100 border-zinc-700/40",
  danger: "bg-red-900 text-zinc-100 border-red-900/60",
};

export const priorityClasses: Record<string, string> = {
  low: "text-zinc-500",
  normal: "text-zinc-300",
  high: "text-amber-400",
  critical: "text-red-400 font-bold",
};

export const statusClasses: Record<string, string> = {
  active: "border-amber-500/40",
  archived: "border-zinc-600/40 opacity-60",
  missing: "border-red-900/40",
  redacted: "border-red-900 bg-red-900/10",
};
