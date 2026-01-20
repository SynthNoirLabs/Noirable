type A2UIStyle = {
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  align?: "start" | "center" | "end" | "stretch";
  width?: "auto" | "full" | "1/2" | "1/3" | "2/3";
  className?: string;
};

type A2UIComponent =
  | {
      type: "container";
      style?: A2UIStyle;
      children: A2UIComponent[];
    }
  | {
      type: "row";
      style?: A2UIStyle;
      children: A2UIComponent[];
    }
  | { type: "heading"; level?: number; text: string }
  | { type: "input"; label: string; placeholder: string }
  | { type: "button"; label: string; variant?: string };

const spacing: Record<string, string> = {
  none: "",
  xs: "gap-2",
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
};

const padding: Record<string, string> = {
  none: "",
  xs: "p-2",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
  xl: "p-8",
};

function classFromStyle(style?: A2UIStyle) {
  if (!style) return "";
  return [
    style.padding ? padding[style.padding] : "",
    style.gap ? spacing[style.gap] : "",
    style.className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

function renderNode(node: A2UIComponent): string {
  switch (node.type) {
    case "container": {
      const className = classFromStyle(node.style);
      return `<div class=\"${className}\">${node.children
        .map(renderNode)
        .join("")}</div>`;
    }
    case "row": {
      const className = classFromStyle(node.style);
      return `<div class=\"flex flex-row ${className}\">${node.children
        .map(renderNode)
        .join("")}</div>`;
    }
    case "heading": {
      const level = node.level ?? 2;
      return `<h${level}>${node.text}</h${level}>`;
    }
    case "input": {
      return `<label>${node.label}<input placeholder=\"${node.placeholder}\" /></label>`;
    }
    case "button": {
      return `<button>${node.label}</button>`;
    }
    default:
      return "";
  }
}

export function exportA2UI(component: A2UIComponent) {
  return `export default function CaseIntake() {\n  return (\n    ${renderNode(
      component,
    )}\n  );\n}`;
}
