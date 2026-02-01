import { cn } from "@/lib/utils";

export const spacingMap: Record<string, string> = {
  none: "",
  xs: "gap-2",
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
};

export const paddingMap: Record<string, string> = {
  none: "",
  xs: "p-2",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
  xl: "p-8",
};

export const alignMap: Record<string, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

export const justifyMap: Record<string, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
};

export const widthMap: Record<string, string> = {
  auto: "w-auto",
  full: "w-full",
  "1/2": "w-1/2",
  "1/3": "w-1/3",
  "2/3": "w-2/3",
};

export function getCommonStyles(node: { style?: Record<string, unknown> }) {
  const { style } = node;
  if (!style) return "";

  return cn(
    style.padding ? paddingMap[style.padding as string] : null,
    style.gap ? spacingMap[style.gap as string] : null,
    style.align ? alignMap[style.align as string] : null,
    style.width ? widthMap[style.width as string] : null,
    typeof style.className === "string" ? style.className : null
  );
}
