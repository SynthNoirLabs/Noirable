import type { A2UIInput } from "@/lib/protocol/schema";

// Token mappings matching the renderer
const spacingClasses: Record<string, string> = {
  none: "",
  xs: "gap-2",
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
};

const paddingClasses: Record<string, string> = {
  none: "",
  xs: "p-2",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
  xl: "p-8",
};

const alignClasses: Record<string, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

const widthClasses: Record<string, string> = {
  auto: "w-auto",
  full: "w-full",
  "1/2": "w-1/2",
  "1/3": "w-1/3",
  "2/3": "w-2/3",
};

const gridColsClasses: Record<string, string> = {
  "2": "grid-cols-2",
  "3": "grid-cols-3",
  "4": "grid-cols-4",
};

const variantClasses: Record<string, string> = {
  primary: "bg-amber-500 text-zinc-900 border-amber-500/60",
  secondary: "bg-zinc-900 text-zinc-100 border-zinc-700/50",
  ghost: "bg-transparent text-zinc-100 border-zinc-700/40",
  danger: "bg-red-900 text-zinc-100 border-red-900/60",
};

const priorityClasses: Record<string, string> = {
  low: "text-zinc-500",
  normal: "text-zinc-300",
  high: "text-amber-400",
  critical: "text-red-400 font-bold",
};

const statusClasses: Record<string, string> = {
  active: "border-amber-500/40",
  archived: "border-zinc-600/40 opacity-60",
  missing: "border-red-900/40",
  redacted: "border-red-900 bg-red-900/10",
};

type StyleProps = {
  padding?: string;
  gap?: string;
  align?: string;
  width?: string;
  className?: string;
};

function buildClassList(classes: (string | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

function styleToClasses(style?: StyleProps): string {
  if (!style) return "";
  return buildClassList([
    style.padding ? paddingClasses[style.padding] : null,
    style.gap ? spacingClasses[style.gap] : null,
    style.align ? alignClasses[style.align] : null,
    style.width ? widthClasses[style.width] : null,
    style.className,
  ]);
}

function jsxString(value: string): string {
  return JSON.stringify(value);
}

function renderNode(node: A2UIInput, depth: number = 0): string {
  const ind = "  ".repeat(depth);
  const indChild = "  ".repeat(depth + 1);

  switch (node.type) {
    case "text": {
      const priorityClass = priorityClasses[node.priority] || "";
      const baseClass = "px-4 py-2 bg-zinc-900/35 border border-zinc-700/40 rounded-sm shadow-lg";
      return `${ind}<p className={${jsxString(
        buildClassList([baseClass, priorityClass])
      )}}>{${jsxString(node.content)}}</p>`;
    }

    case "card": {
      const statusClass = statusClasses[node.status] || "";
      const baseClass = "border bg-zinc-900/50 p-4 rounded-sm shadow-lg max-w-md";
      return `${ind}<div className={${jsxString(buildClassList([baseClass, statusClass]))}}>
${indChild}<h3 className="font-bold text-lg text-zinc-100 mb-2">{${jsxString(node.title)}}</h3>
${node.description ? `${indChild}<p className="text-zinc-400 text-sm">{${jsxString(node.description)}}</p>\n` : ""}${ind}</div>`;
    }

    case "container": {
      const classes = buildClassList(["flex flex-col", styleToClasses(node.style)]);
      const children = node.children.map((child) => renderNode(child, depth + 1)).join("\n");
      return `${ind}<div className={${jsxString(classes)}}>
${children}
${ind}</div>`;
    }

    case "row": {
      const classes = buildClassList(["flex flex-row flex-wrap", styleToClasses(node.style)]);
      const children = node.children.map((child) => renderNode(child, depth + 1)).join("\n");
      return `${ind}<div className={${jsxString(classes)}}>
${children}
${ind}</div>`;
    }

    case "column": {
      const classes = buildClassList(["flex flex-col", styleToClasses(node.style)]);
      const children = node.children.map((child) => renderNode(child, depth + 1)).join("\n");
      return `${ind}<div className={${jsxString(classes)}}>
${children}
${ind}</div>`;
    }

    case "grid": {
      const colClass = node.columns ? gridColsClasses[node.columns] : "grid-cols-2";
      const classes = buildClassList(["grid", colClass, styleToClasses(node.style)]);
      const children = node.children.map((child) => renderNode(child, depth + 1)).join("\n");
      return `${ind}<div className={${jsxString(classes)}}>
${children}
${ind}</div>`;
    }

    case "heading": {
      const level = node.level ?? 2;
      const sizeClass =
        level === 1 ? "text-3xl" : level === 2 ? "text-2xl" : level === 3 ? "text-xl" : "text-lg";
      const classes = buildClassList(["font-bold text-zinc-100", sizeClass, node.style?.className]);
      return `${ind}<h${level} className={${jsxString(classes)}}>{${jsxString(
        node.text
      )}}</h${level}>`;
    }

    case "paragraph": {
      const classes = buildClassList([
        "text-sm leading-relaxed text-zinc-400",
        node.style?.className,
      ]);
      return `${ind}<p className={${jsxString(classes)}}>{${jsxString(node.text)}}</p>`;
    }

    case "callout": {
      const priorityClass = priorityClasses[node.priority] || "";
      const baseClass =
        "border-l-2 border-amber-500/60 bg-zinc-900/45 px-4 py-3 rounded-sm shadow-lg";
      const classes = buildClassList([
        baseClass,
        priorityClass,
        node.style?.width ? widthClasses[node.style.width] : null,
        node.style?.className,
      ]);
      return `${ind}<div className={${jsxString(classes)}}>
${indChild}<p className="text-sm">{${jsxString(node.content)}}</p>
${ind}</div>`;
    }

    case "badge": {
      const variantClass = node.variant ? variantClasses[node.variant] : "border-zinc-700/40";
      const classes = buildClassList([
        "inline-flex items-center gap-2 px-2 py-1 text-xs uppercase tracking-widest border rounded-sm",
        variantClass,
        node.style?.className,
      ]);
      return `${ind}<span className={${jsxString(classes)}}>{${jsxString(node.label)}}</span>`;
    }

    case "divider": {
      const classes = buildClassList([
        "flex items-center gap-3 text-xs uppercase tracking-widest text-zinc-500",
        node.style?.className,
      ]);
      if (node.label) {
        return `${ind}<div className={${jsxString(classes)}}>
${indChild}<span className="flex-1 border-t border-zinc-700/40" />
${indChild}<span>{${jsxString(node.label)}}</span>
${indChild}<span className="flex-1 border-t border-zinc-700/40" />
${ind}</div>`;
      }
      return `${ind}<hr className="border-t border-zinc-700/40" />`;
    }

    case "list": {
      const Tag = node.ordered ? "ol" : "ul";
      const listClass = node.ordered ? "list-decimal" : "list-disc";
      const classes = buildClassList([
        "ml-5 text-sm text-zinc-300",
        listClass,
        node.style?.className,
      ]);
      const items = node.items
        .map((item) => `${indChild}<li className="mb-1">{${jsxString(item)}}</li>`)
        .join("\n");
      return `${ind}<${Tag} className={${jsxString(classes)}}>
${items}
${ind}</${Tag}>`;
    }

    case "table": {
      const classes = buildClassList([
        "w-full overflow-x-auto",
        node.style?.width ? widthClasses[node.style.width] : null,
        node.style?.className,
      ]);
      const headers = node.columns
        .map(
          (col) =>
            `${indChild}      <th className="text-left border-b border-zinc-700/40 pb-2 pr-3 uppercase tracking-widest text-zinc-500">{${jsxString(
              col
            )}}</th>`
        )
        .join("\n");
      const rows = node.rows
        .map((row) => {
          const cells = row
            .map(
              (cell) =>
                `${indChild}        <td className="py-2 pr-3 text-zinc-300">{${jsxString(
                  cell
                )}}</td>`
            )
            .join("\n");
          return `${indChild}      <tr className="border-b border-zinc-700/20">
${cells}
${indChild}      </tr>`;
        })
        .join("\n");
      return `${ind}<div className={${jsxString(classes)}}>
${indChild}<table className="w-full border-collapse text-xs">
${indChild}  <thead>
${indChild}    <tr>
${headers}
${indChild}    </tr>
${indChild}  </thead>
${indChild}  <tbody>
${rows}
${indChild}  </tbody>
${indChild}</table>
${ind}</div>`;
    }

    case "stat": {
      const classes = buildClassList([
        "border border-zinc-700/40 bg-zinc-900/35 px-4 py-3 rounded-sm shadow-lg",
        node.style?.className,
      ]);
      return `${ind}<div className={${jsxString(classes)}}>
${indChild}<div className="text-xs uppercase tracking-widest text-zinc-500">{${jsxString(
        node.label
      )}}</div>
${indChild}<div className="text-2xl text-zinc-100 font-bold mt-2">{${jsxString(node.value)}}</div>
${node.helper ? `${indChild}<div className="text-xs text-zinc-500 mt-1">{${jsxString(node.helper)}}</div>\n` : ""}${ind}</div>`;
    }

    case "tabs": {
      const classes = buildClassList([
        "w-full border border-zinc-700/40 bg-zinc-900/35 rounded-sm",
        node.style?.width ? widthClasses[node.style.width] : null,
        node.style?.className,
      ]);
      const tabButtons = node.tabs
        .map(
          (tab, i) =>
            `${indChild}    <button
${indChild}      type="button"
${indChild}      onClick={() => setActiveTab(${i})}
${indChild}      className={\`px-3 py-2 text-xs uppercase tracking-widest border-b-2 transition-colors \${activeTab === ${i} ? "text-amber-500 border-amber-500" : "text-zinc-400 border-transparent hover:text-zinc-100"}\`}
${indChild}    >
${indChild}      {${jsxString(tab.label)}}
${indChild}    </button>`
        )
        .join("\n");
      const tabPanels = node.tabs
        .map(
          (tab, i) =>
            `${indChild}  {activeTab === ${i} && (
${renderNode(tab.content, depth + 3)}
${indChild}  )}`
        )
        .join("\n");
      return `${ind}{/* Tabs - requires useState for activeTab */}
${ind}<div className={${jsxString(classes)}}>
${indChild}<div className="flex gap-2 border-b border-zinc-700/30 px-2">
${tabButtons}
${indChild}</div>
${indChild}<div className="p-4">
${tabPanels}
${indChild}</div>
${ind}</div>`;
    }

    case "image": {
      const classes = buildClassList([
        "rounded-sm object-cover",
        node.style?.width ? widthClasses[node.style.width] : null,
        node.style?.className,
      ]);
      const src = node.src || "/placeholder.jpg";
      const alt = node.alt || "Image";
      return `${ind}<img src={${jsxString(src)}} alt={${jsxString(alt)}} className={${jsxString(
        classes
      )}} />`;
    }

    case "input": {
      const variantClass = node.variant ? variantClasses[node.variant] : "";
      const inputClasses = buildClassList([
        "bg-transparent border-b border-zinc-700/30 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500",
        variantClass,
      ]);
      const inputName = node.name || node.label.toLowerCase().replace(/\s+/g, "_");
      return `${ind}<label className={${jsxString(
        buildClassList(["flex flex-col gap-2 text-xs", node.style?.className])
      )}}>
${indChild}<span className="font-medium text-zinc-400">{${jsxString(node.label)}}</span>
${indChild}<input
${indChild}  name={${jsxString(inputName)}}
${indChild}  placeholder={${jsxString(node.placeholder)}}
${indChild}  ${node.value ? `defaultValue={${jsxString(node.value)}}` : ""}
${indChild}  className={${jsxString(inputClasses)}}
${indChild}/>
${ind}</label>`;
    }

    case "textarea": {
      const variantClass = node.variant ? variantClasses[node.variant] : "";
      const textareaClasses = buildClassList([
        "bg-transparent border border-zinc-700/30 p-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500",
        variantClass,
      ]);
      const textareaName = node.name || node.label.toLowerCase().replace(/\s+/g, "_");
      return `${ind}<label className={${jsxString(
        buildClassList(["flex flex-col gap-2 text-xs", node.style?.className])
      )}}>
${indChild}<span className="font-medium text-zinc-400">{${jsxString(node.label)}}</span>
${indChild}<textarea
${indChild}  name={${jsxString(textareaName)}}
${indChild}  placeholder={${jsxString(node.placeholder)}}
${indChild}  ${node.value ? `defaultValue={${jsxString(node.value)}}` : ""}
${indChild}  rows={${node.rows ?? 3}}
${indChild}  className={${jsxString(textareaClasses)}}
${indChild}/>
${ind}</label>`;
    }

    case "select": {
      const variantClass = node.variant ? variantClasses[node.variant] : "";
      const selectClasses = buildClassList([
        "bg-zinc-900 border border-zinc-700/30 p-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500",
        variantClass,
      ]);
      const selectName = node.name || node.label.toLowerCase().replace(/\s+/g, "_");
      const options = node.options
        .map((opt) => `${indChild}  <option value={${jsxString(opt)}}>{${jsxString(opt)}}</option>`)
        .join("\n");
      return `${ind}<label className={${jsxString(
        buildClassList(["flex flex-col gap-2 text-xs", node.style?.className])
      )}}>
${indChild}<span className="font-medium text-zinc-400">{${jsxString(node.label)}}</span>
${indChild}<select
${indChild}  name={${jsxString(selectName)}}
${indChild}  defaultValue={${jsxString(node.value ?? node.options[0])}}
${indChild}  className={${jsxString(selectClasses)}}
${indChild}>
${options}
${indChild}</select>
${ind}</label>`;
    }

    case "checkbox": {
      const checkboxName = node.name || node.label.toLowerCase().replace(/\s+/g, "_");
      return `${ind}<label className={${jsxString(
        buildClassList(["flex items-center gap-2 text-xs", node.style?.className])
      )}}>
${indChild}<input type="checkbox" name={${jsxString(
        checkboxName
      )}} ${node.checked ? "defaultChecked" : ""} className="accent-amber-500" />
${indChild}<span className="text-zinc-400">{${jsxString(node.label)}}</span>
${ind}</label>`;
    }

    case "button": {
      const variantClass = node.variant
        ? variantClasses[node.variant]
        : "bg-zinc-800 text-zinc-100 border-zinc-700 hover:bg-zinc-700";
      const classes = buildClassList([
        "px-4 py-2 text-xs uppercase tracking-widest border rounded-sm transition-colors",
        variantClass,
        node.style?.className,
      ]);
      return `${ind}<button type="button" className={${jsxString(classes)}}>{${jsxString(
        node.label
      )}}</button>`;
    }

    default:
      return `${ind}{/* Unknown component type */}`;
  }
}

function detectHooks(node: A2UIInput): string[] {
  const hooks: string[] = [];

  function traverse(n: A2UIInput) {
    if (n.type === "tabs") {
      hooks.push("useState");
    }
    if ("children" in n && Array.isArray(n.children)) {
      n.children.forEach(traverse);
    }
    if (n.type === "tabs") {
      n.tabs.forEach((tab) => traverse(tab.content));
    }
  }

  traverse(node);
  return [...new Set(hooks)];
}

export function exportA2UI(component: A2UIInput): string {
  const hooks = detectHooks(component);
  const hasState = hooks.includes("useState");

  const imports = ['import React from "react";'];
  if (hasState) {
    imports[0] = 'import React, { useState } from "react";';
  }

  const stateDeclarations = hasState ? "\n  const [activeTab, setActiveTab] = useState(0);\n" : "";

  const rendered = renderNode(component, 2);

  return `${imports.join("\n")}

export function EvidenceComponent() {${stateDeclarations}
  return (
${rendered}
  );
}
`;
}

export function exportA2UIAsJSON(component: A2UIInput): string {
  return JSON.stringify(component, null, 2);
}

export interface ExportFile {
  path: string;
  content: string;
}

export function exportA2UIMultiFile(
  component: A2UIInput,
  componentName: string = "Evidence"
): ExportFile[] {
  const files: ExportFile[] = [];
  const hooks = detectHooks(component);
  const hasState = hooks.includes("useState");

  // Main component file
  const imports = ['import React from "react";'];
  if (hasState) {
    imports[0] = 'import React, { useState } from "react";';
  }

  const stateDeclarations = hasState ? "\n  const [activeTab, setActiveTab] = useState(0);\n" : "";

  const rendered = renderNode(component, 2);

  const mainComponent = `${imports.join("\n")}

export function ${componentName}() {${stateDeclarations}
  return (
${rendered}
  );
}
`;

  files.push({
    path: `${componentName}/${componentName}.tsx`,
    content: mainComponent,
  });

  // Index file
  const indexContent = `export { ${componentName} } from "./${componentName}";
`;
  files.push({
    path: `${componentName}/index.ts`,
    content: indexContent,
  });

  // Data file with the JSON
  const dataContent = `// A2UI JSON data for ${componentName}
export const ${componentName.toLowerCase()}Data = ${JSON.stringify(component, null, 2)} as const;
`;
  files.push({
    path: `${componentName}/${componentName}.data.ts`,
    content: dataContent,
  });

  return files;
}
