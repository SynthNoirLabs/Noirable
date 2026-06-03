import type { A2UIInput } from "@/lib/protocol/schema";
import {
  spacingClasses,
  paddingClasses,
  alignClasses,
  widthClasses,
  gridColsClasses,
  variantClasses,
  priorityClasses,
  statusClasses,
} from "@/lib/protocol/token-maps";

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

/**
 * Mutable allocators threaded through the render so each stateful node (tabs,
 * modal) gets its own React state variable instead of sharing one.
 */
interface RenderContext {
  tab: number;
  modal: number;
}

function renderNode(node: A2UIInput, depth: number = 0, ctx: RenderContext): string {
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
      const children = node.children.map((child) => renderNode(child, depth + 1, ctx)).join("\n");
      return `${ind}<div className={${jsxString(classes)}}>
${children}
${ind}</div>`;
    }

    case "row": {
      const classes = buildClassList(["flex flex-row flex-wrap", styleToClasses(node.style)]);
      const children = node.children.map((child) => renderNode(child, depth + 1, ctx)).join("\n");
      return `${ind}<div className={${jsxString(classes)}}>
${children}
${ind}</div>`;
    }

    case "column": {
      const classes = buildClassList(["flex flex-col", styleToClasses(node.style)]);
      const children = node.children.map((child) => renderNode(child, depth + 1, ctx)).join("\n");
      return `${ind}<div className={${jsxString(classes)}}>
${children}
${ind}</div>`;
    }

    case "grid": {
      const colClass = node.columns ? gridColsClasses[node.columns] : "grid-cols-2";
      const classes = buildClassList(["grid", colClass, styleToClasses(node.style)]);
      const children = node.children.map((child) => renderNode(child, depth + 1, ctx)).join("\n");
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
      const variantClass = node.variant
        ? variantClasses[node.variant]
        : "bg-zinc-900/40 border-zinc-700/40";
      const classes = buildClassList([
        "inline-flex items-center gap-2 px-2 py-1 text-xs uppercase tracking-widest border rounded-sm transition-colors hover:border-amber-500/70 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25)]",
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
      // Each tabs node owns a distinct state variable so multiple tab groups
      // in one export don't share (and clobber) a single activeTab.
      const tabIndex = ctx.tab++;
      const stateVar = tabIndex === 0 ? "activeTab" : `activeTab${tabIndex}`;
      const setStateVar = tabIndex === 0 ? "setActiveTab" : `setActiveTab${tabIndex}`;
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
${indChild}      onClick={() => ${setStateVar}(${i})}
${indChild}      className={\`px-3 py-2 text-xs uppercase tracking-widest border-b-2 transition-colors \${${stateVar} === ${i} ? "text-amber-500 border-amber-500" : "text-zinc-400 border-transparent hover:text-zinc-100"}\`}
${indChild}    >
${indChild}      {${jsxString(tab.label)}}
${indChild}    </button>`
        )
        .join("\n");
      const tabPanels = node.tabs
        .map(
          (tab, i) =>
            `${indChild}  {${stateVar} === ${i} && (
${renderNode(tab.content, depth + 3, ctx)}
${indChild}  )}`
        )
        .join("\n");
      return `${ind}{/* Tabs - requires useState for ${stateVar} */}
${ind}<div className={${jsxString(classes)}}>
${indChild}<div className="flex gap-2 border-b border-zinc-700/30 px-2">
${tabButtons}
${indChild}</div>
${indChild}<div className="p-4">
${tabPanels}
${indChild}</div>
${ind}</div>`;
    }

    case "modal": {
      // Each modal node owns a distinct open/close state variable.
      const modalIndex = ctx.modal++;
      const stateVar = `modalOpen${modalIndex}`;
      const setStateVar = `setModalOpen${modalIndex}`;
      const trigger = renderNode(node.trigger, depth + 2, ctx);
      const content = renderNode(node.content, depth + 3, ctx);
      return `${ind}{/* Modal - requires useState for ${stateVar} */}
${ind}<div>
${indChild}<div onClick={() => ${setStateVar}(true)} className="inline-block cursor-pointer">
${trigger}
${indChild}</div>
${indChild}{${stateVar} && (
${indChild}  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => ${setStateVar}(false)}>
${indChild}    <div className="max-w-lg rounded-sm border border-zinc-700/40 bg-zinc-900 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
${content}
${indChild}    </div>
${indChild}  </div>
${indChild})}
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

/**
 * Count the stateful nodes (tabs, modal) in the tree. Each one needs its own
 * React state variable, so counts (not a boolean) drive code generation.
 */
function countStatefulNodes(node: A2UIInput): { tabs: number; modals: number } {
  let tabs = 0;
  let modals = 0;

  function traverse(n: A2UIInput) {
    if (n.type === "tabs") {
      tabs++;
      n.tabs.forEach((tab) => traverse(tab.content));
    }
    if (n.type === "modal") {
      modals++;
      traverse(n.trigger);
      traverse(n.content);
    }
    if ("children" in n && Array.isArray(n.children)) {
      n.children.forEach(traverse);
    }
  }

  traverse(node);
  return { tabs, modals };
}

/**
 * Build the import line and `useState` declarations for a tree, plus a fresh
 * render of the body. The render-time counters are seeded from a fresh context
 * so the declared variable names line up exactly with the emitted JSX.
 */
function buildComponentBody(component: A2UIInput): { importLine: string; body: string } {
  const { tabs, modals } = countStatefulNodes(component);
  const hasState = tabs > 0 || modals > 0;

  const declarations: string[] = [];
  for (let i = 0; i < tabs; i++) {
    const stateVar = i === 0 ? "activeTab" : `activeTab${i}`;
    const setStateVar = i === 0 ? "setActiveTab" : `setActiveTab${i}`;
    declarations.push(`  const [${stateVar}, ${setStateVar}] = useState(0);`);
  }
  for (let i = 0; i < modals; i++) {
    declarations.push(`  const [modalOpen${i}, setModalOpen${i}] = useState(false);`);
  }

  const importLine = hasState
    ? 'import React, { useState } from "react";'
    : 'import React from "react";';
  const stateBlock = declarations.length > 0 ? `\n${declarations.join("\n")}\n` : "";
  const rendered = renderNode(component, 2, { tab: 0, modal: 0 });

  return {
    importLine,
    body: `${stateBlock}
  return (
${rendered}
  );`,
  };
}

export function exportA2UI(component: A2UIInput): string {
  const { importLine, body } = buildComponentBody(component);

  return `${importLine}

export function EvidenceComponent() {${body}
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

  // Main component file
  const { importLine, body } = buildComponentBody(component);

  const mainComponent = `${importLine}

export function ${componentName}() {${body}
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
