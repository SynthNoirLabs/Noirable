import React from "react";
import { a2uiInputSchema, type A2UIInput } from "@/lib/protocol/schema";
import { TypewriterText } from "@/components/noir/TypewriterText";
import { DossierCard } from "@/components/noir/DossierCard";
import { cn } from "@/lib/utils";
import { useFormContext, FormProvider, type FormValues } from "./FormContext";
import {
  spacingClasses,
  paddingClasses,
  alignClasses,
  widthClasses,
  gridColsClasses,
} from "@/lib/protocol/token-maps";

interface A2UIRendererProps {
  data: unknown;
  onFormSubmit?: (values: FormValues) => void;
}

export type { FormValues };

function A2UIRendererInner({ data }: Omit<A2UIRendererProps, "onFormSubmit">) {
  const formContext = useFormContext();
  const result = a2uiInputSchema.safeParse(data);

  if (!result.success) {
    return (
      <div className="bg-[var(--aesthetic-error)]/10 border-2 border-[var(--aesthetic-error)] p-4 rounded-sm animate-pulse max-w-md">
        <h3 className="text-[var(--aesthetic-error)] font-typewriter font-bold mb-2">REDACTED</h3>
        <p className="text-[var(--aesthetic-error)]/80 font-mono text-xs">
          UNKNOWN ARTIFACT DETECTED.
          <br />
          DATA CORRUPTION LEVEL: CRITICAL.
        </p>
      </div>
    );
  }

  const component = result.data;

  // Variant map uses CSS variables for theme-awareness (unlike exported token-maps which use hardcoded colors)
  const variantMap: Record<string, string> = {
    primary:
      "bg-[var(--aesthetic-accent)] text-[var(--aesthetic-background)] border-[var(--aesthetic-accent)]/60",
    secondary:
      "bg-[var(--aesthetic-surface)] text-[var(--aesthetic-text)] border-[var(--aesthetic-border)]/50",
    ghost: "bg-transparent text-[var(--aesthetic-text)] border-[var(--aesthetic-border)]/40",
    danger:
      "bg-[var(--aesthetic-error)] text-[var(--aesthetic-text)] border-[var(--aesthetic-error)]/60",
  };

  type TabsNode = Extract<A2UIInput, { type: "tabs" }>;

  const TabsRenderer = ({
    node,
    renderComponent,
  }: {
    node: TabsNode;
    renderComponent: (node: A2UIInput) => React.ReactNode;
  }) => {
    const [activeIndex, setActiveIndex] = React.useState(() => {
      if (typeof node.activeIndex === "number") {
        return Math.min(Math.max(node.activeIndex, 0), node.tabs.length - 1);
      }
      return 0;
    });

    const activeTab = node.tabs[activeIndex];

    return (
      <div
        className={cn(
          "w-full border border-[var(--aesthetic-border)]/40 bg-[var(--aesthetic-background)]/35 rounded-sm",
          node.style?.width ? widthClasses[node.style.width] : null,
          node.style?.className
        )}
      >
        <div className="flex gap-2 border-b border-[var(--aesthetic-border)]/30 px-2">
          {node.tabs.map((tab, index) => (
            <button
              key={`${tab.label}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "px-3 py-2 text-[10px] uppercase tracking-[0.2em] font-typewriter border-b-2 transition-colors focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]",
                index === activeIndex
                  ? "text-[var(--aesthetic-accent)] border-[var(--aesthetic-accent)]"
                  : "text-[var(--aesthetic-text)]/60 border-transparent hover:text-[var(--aesthetic-text)]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-4">{activeTab ? renderComponent(activeTab.content) : null}</div>
      </div>
    );
  };

  const renderComponent = (node: A2UIInput): React.ReactNode => {
    switch (node.type) {
      case "text":
        return (
          <TypewriterText
            content={node.content}
            priority={node.priority}
            className="px-4 py-2 bg-[var(--aesthetic-background)]/35 border border-[var(--aesthetic-border)]/40 rounded-sm shadow-[0_0_14px_rgba(0,0,0,0.35)]"
          />
        );
      case "card":
        return (
          <DossierCard title={node.title} description={node.description} status={node.status} />
        );
      case "container":
        return (
          <div
            className={cn(
              "flex flex-col",
              node.style?.gap ? spacingClasses[node.style.gap] : null,
              node.style?.padding ? paddingClasses[node.style.padding] : null,
              node.style?.align ? alignClasses[node.style.align] : null,
              node.style?.width ? widthClasses[node.style.width] : null,
              node.style?.className
            )}
          >
            {node.children.map((child, index) => (
              <React.Fragment key={index}>{renderComponent(child)}</React.Fragment>
            ))}
          </div>
        );
      case "row":
        return (
          <div
            className={cn(
              "flex flex-row flex-wrap",
              node.style?.gap ? spacingClasses[node.style.gap] : null,
              node.style?.padding ? paddingClasses[node.style.padding] : null,
              node.style?.align ? alignClasses[node.style.align] : null,
              node.style?.width ? widthClasses[node.style.width] : null,
              node.style?.className
            )}
          >
            {node.children.map((child, index) => (
              <React.Fragment key={index}>{renderComponent(child)}</React.Fragment>
            ))}
          </div>
        );
      case "column":
        return (
          <div
            className={cn(
              "flex flex-col",
              node.style?.gap ? spacingClasses[node.style.gap] : null,
              node.style?.padding ? paddingClasses[node.style.padding] : null,
              node.style?.align ? alignClasses[node.style.align] : null,
              node.style?.width ? widthClasses[node.style.width] : null,
              node.style?.className
            )}
          >
            {node.children.map((child, index) => (
              <React.Fragment key={index}>{renderComponent(child)}</React.Fragment>
            ))}
          </div>
        );
      case "grid":
        return (
          <div
            className={cn(
              "grid",
              node.columns ? gridColsClasses[node.columns] : "grid-cols-2",
              node.style?.gap ? spacingClasses[node.style.gap] : null,
              node.style?.padding ? paddingClasses[node.style.padding] : null,
              node.style?.width ? widthClasses[node.style.width] : null,
              node.style?.className
            )}
          >
            {node.children.map((child, index) => (
              <React.Fragment key={index}>{renderComponent(child)}</React.Fragment>
            ))}
          </div>
        );
      case "heading": {
        const HeadingTag = `h${node.level}` as "h1" | "h2" | "h3" | "h4";
        return (
          <HeadingTag
            className={cn(
              "font-typewriter text-[var(--aesthetic-text)]",
              node.level === 1 && "text-3xl",
              node.level === 2 && "text-2xl",
              node.level === 3 && "text-xl",
              node.level === 4 && "text-lg",
              node.style?.className
            )}
          >
            {node.text}
          </HeadingTag>
        );
      }
      case "paragraph":
        return (
          <p
            className={cn(
              "font-mono text-sm leading-relaxed text-[var(--aesthetic-text)]/80",
              node.style?.className
            )}
          >
            {node.text}
          </p>
        );
      case "callout":
        return (
          <div
            className={cn(
              "border-l-2 border-[var(--aesthetic-accent)]/60 bg-[var(--aesthetic-background)]/45 px-4 py-3 rounded-sm shadow-[0_0_14px_rgba(0,0,0,0.35)]",
              node.style?.width ? widthClasses[node.style.width] : null,
              node.style?.className
            )}
          >
            <TypewriterText content={node.content} priority={node.priority} className="text-sm" />
          </div>
        );
      case "badge":
        return (
          <span
            className={cn(
              "inline-flex items-center gap-2 px-2 py-1 text-[10px] uppercase tracking-[0.2em] border rounded-sm font-typewriter",
              node.variant ? variantMap[node.variant] : "border-[var(--aesthetic-border)]/40",
              node.style?.className
            )}
          >
            {node.label}
          </span>
        );
      case "divider":
        return (
          <div
            className={cn(
              "flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-[var(--aesthetic-text)]/60 font-typewriter",
              node.style?.className
            )}
          >
            <span className="flex-1 border-t border-[var(--aesthetic-border)]/40" />
            {node.label && <span>{node.label}</span>}
            {node.label && <span className="flex-1 border-t border-[var(--aesthetic-border)]/40" />}
          </div>
        );
      case "list": {
        const ListTag = node.ordered ? "ol" : "ul";
        return (
          <ListTag
            className={cn(
              "ml-5 text-sm text-[var(--aesthetic-text)]/85 font-mono",
              node.ordered ? "list-decimal" : "list-disc",
              node.style?.className
            )}
          >
            {node.items.map((item, index) => (
              <li key={index} className="mb-1">
                {item}
              </li>
            ))}
          </ListTag>
        );
      }
      case "table":
        return (
          <div
            className={cn(
              "w-full overflow-x-auto",
              node.style?.width ? widthClasses[node.style.width] : null,
              node.style?.className
            )}
          >
            <table className="w-full border-collapse text-xs font-mono">
              <thead>
                <tr className="text-[var(--aesthetic-text)]/70">
                  {node.columns.map((col, index) => (
                    <th
                      key={index}
                      className="text-left border-b border-[var(--aesthetic-border)]/40 pb-2 pr-3 uppercase tracking-[0.2em]"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {node.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-[var(--aesthetic-border)]/20">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="py-2 pr-3 text-[var(--aesthetic-text)]/80">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "stat":
        return (
          <div
            className={cn(
              "border border-[var(--aesthetic-border)]/40 bg-[var(--aesthetic-background)]/35 px-4 py-3 rounded-sm shadow-[0_0_12px_rgba(0,0,0,0.35)]",
              node.style?.className
            )}
          >
            <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--aesthetic-text)]/60 font-typewriter">
              {node.label}
            </div>
            <div className="text-2xl text-[var(--aesthetic-text)] font-typewriter mt-2">
              {node.value}
            </div>
            {node.helper && (
              <div className="text-xs text-[var(--aesthetic-text)]/60 font-mono mt-1">
                {node.helper}
              </div>
            )}
          </div>
        );
      case "tabs": {
        return <TabsRenderer node={node} renderComponent={renderComponent} />;
      }
      case "image":
        if (!node.src) {
          return (
            <div
              className={cn(
                "border border-[var(--aesthetic-border)]/40 bg-[var(--aesthetic-background)]/35 px-4 py-3 rounded-sm text-xs font-mono text-[var(--aesthetic-text)]/70",
                node.style?.className
              )}
            >
              IMAGE PENDING
            </div>
          );
        }
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={node.src}
            alt={node.alt ?? "Generated image"}
            className={cn(
              "rounded-sm object-cover",
              node.style?.width ? widthClasses[node.style.width] : null,
              node.style?.className
            )}
          />
        );
      case "input": {
        const inputName = node.name || node.label.toLowerCase().replace(/\s+/g, "_");
        const inputId = `a2ui-input-${inputName}`;
        return (
          <div className={cn("flex flex-col gap-2 text-xs", node.style?.className)}>
            <label htmlFor={inputId} className="font-typewriter text-[var(--aesthetic-text)]/70">
              {node.label}
            </label>
            <input
              id={inputId}
              name={inputName}
              placeholder={node.placeholder}
              defaultValue={node.value ?? ""}
              onChange={(e) => formContext?.setValue(inputName, e.target.value)}
              className={cn(
                "bg-transparent border-b border-[var(--aesthetic-border)]/30 py-2 text-sm text-[var(--aesthetic-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]",
                node.variant ? variantMap[node.variant] : ""
              )}
            />
          </div>
        );
      }
      case "textarea": {
        const textareaName = node.name || node.label.toLowerCase().replace(/\s+/g, "_");
        const textareaId = `a2ui-textarea-${textareaName}`;
        return (
          <div className={cn("flex flex-col gap-2 text-xs", node.style?.className)}>
            <label htmlFor={textareaId} className="font-typewriter text-[var(--aesthetic-text)]/70">
              {node.label}
            </label>
            <textarea
              id={textareaId}
              name={textareaName}
              placeholder={node.placeholder}
              defaultValue={node.value ?? ""}
              onChange={(e) => formContext?.setValue(textareaName, e.target.value)}
              rows={node.rows ?? 3}
              className={cn(
                "bg-transparent border border-[var(--aesthetic-border)]/30 p-2 text-sm text-[var(--aesthetic-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]",
                node.variant ? variantMap[node.variant] : ""
              )}
            />
          </div>
        );
      }
      case "select": {
        const selectName = node.name || node.label.toLowerCase().replace(/\s+/g, "_");
        const selectId = `a2ui-select-${selectName}`;
        return (
          <div className={cn("flex flex-col gap-2 text-xs", node.style?.className)}>
            <label htmlFor={selectId} className="font-typewriter text-[var(--aesthetic-text)]/70">
              {node.label}
            </label>
            <select
              id={selectId}
              name={selectName}
              defaultValue={node.value ?? node.options[0]}
              onChange={(e) => formContext?.setValue(selectName, e.target.value)}
              className={cn(
                "bg-transparent border border-[var(--aesthetic-border)]/30 p-2 text-sm text-[var(--aesthetic-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]",
                node.variant ? variantMap[node.variant] : ""
              )}
            >
              {node.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );
      }
      case "checkbox": {
        const checkboxName = node.name || node.label.toLowerCase().replace(/\s+/g, "_");
        const checkboxId = `a2ui-checkbox-${checkboxName}`;
        return (
          <div className={cn("flex items-center gap-2 text-xs", node.style?.className)}>
            <input
              id={checkboxId}
              type="checkbox"
              name={checkboxName}
              defaultChecked={node.checked ?? false}
              onChange={(e) => formContext?.setValue(checkboxName, e.target.checked)}
              className="focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]"
            />
            <label htmlFor={checkboxId} className="font-typewriter text-[var(--aesthetic-text)]/70">
              {node.label}
            </label>
          </div>
        );
      }
      case "button": {
        const handleClick = () => {
          if (!formContext) return;
          switch (node.action) {
            case "submit":
              formContext.onSubmit?.(formContext.getValues());
              break;
            case "reset":
              formContext.reset();
              break;
            case "log":
              // Debug action - logs form values to console in development
              if (process.env.NODE_ENV !== "production") {
                console.log("Form values:", formContext.getValues());
              }
              break;
            default:
              // No action - just a display button
              break;
          }
        };
        return (
          <button
            type="button"
            onClick={handleClick}
            className={cn(
              "px-3 py-2 text-xs uppercase tracking-widest border rounded-sm focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]",
              node.variant ? variantMap[node.variant] : "",
              node.style?.className
            )}
          >
            {node.label}
          </button>
        );
      }
      default:
        return null;
    }
  };

  return <>{renderComponent(component)}</>;
}

export function A2UIRenderer({ data, onFormSubmit }: A2UIRendererProps) {
  return (
    <FormProvider onSubmit={onFormSubmit}>
      <A2UIRendererInner data={data} />
    </FormProvider>
  );
}
