import React from "react";
import { a2uiSchema } from "@/lib/protocol/schema";
import { TypewriterText } from "@/components/noir/TypewriterText";
import { DossierCard } from "@/components/noir/DossierCard";
import { cn } from "@/lib/utils";

interface A2UIRendererProps {
  data: unknown;
}

export function A2UIRenderer({ data }: A2UIRendererProps) {
  const result = a2uiSchema.safeParse(data);

  if (!result.success) {
    return (
      <div className="bg-noir-red/10 border-2 border-noir-red p-4 rounded-sm animate-pulse max-w-md">
        <h3 className="text-noir-red font-typewriter font-bold mb-2">
          REDACTED
        </h3>
        <p className="text-noir-red/80 font-mono text-xs">
          UNKNOWN ARTIFACT DETECTED.
          <br />
          DATA CORRUPTION LEVEL: CRITICAL.
        </p>
      </div>
    );
  }

  const component = result.data;

  const spacingMap: Record<string, string> = {
    none: "",
    xs: "gap-2",
    sm: "gap-3",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
  };

  const paddingMap: Record<string, string> = {
    none: "",
    xs: "p-2",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  };

  const alignMap: Record<string, string> = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
  };

  const widthMap: Record<string, string> = {
    auto: "w-auto",
    full: "w-full",
    "1/2": "w-1/2",
    "1/3": "w-1/3",
    "2/3": "w-2/3",
  };

  const variantMap: Record<string, string> = {
    primary: "bg-noir-amber text-noir-ink border-noir-amber/60",
    secondary: "bg-noir-dark text-noir-paper border-noir-gray/50",
    ghost: "bg-transparent text-noir-paper border-noir-gray/40",
    danger: "bg-noir-red text-noir-paper border-noir-red/60",
  };

  const renderComponent = (node: typeof component): React.ReactNode => {
    switch (node.type) {
      case "text":
        return (
          <TypewriterText content={node.content} priority={node.priority} />
        );
      case "card":
        return (
          <DossierCard
            title={node.title}
            description={node.description}
            status={node.status}
          />
        );
      case "container":
        return (
          <div
            className={cn(
              "flex flex-col",
              node.style?.gap ? spacingMap[node.style.gap] : null,
              node.style?.padding ? paddingMap[node.style.padding] : null,
              node.style?.align ? alignMap[node.style.align] : null,
              node.style?.width ? widthMap[node.style.width] : null,
              node.style?.className,
            )}
          >
            {node.children.map((child, index) => (
              <React.Fragment key={index}>
                {renderComponent(child)}
              </React.Fragment>
            ))}
          </div>
        );
      case "row":
        return (
          <div
            className={cn(
              "flex flex-row flex-wrap",
              node.style?.gap ? spacingMap[node.style.gap] : null,
              node.style?.padding ? paddingMap[node.style.padding] : null,
              node.style?.align ? alignMap[node.style.align] : null,
              node.style?.width ? widthMap[node.style.width] : null,
              node.style?.className,
            )}
          >
            {node.children.map((child, index) => (
              <React.Fragment key={index}>
                {renderComponent(child)}
              </React.Fragment>
            ))}
          </div>
        );
      case "column":
        return (
          <div
            className={cn(
              "flex flex-col",
              node.style?.gap ? spacingMap[node.style.gap] : null,
              node.style?.padding ? paddingMap[node.style.padding] : null,
              node.style?.align ? alignMap[node.style.align] : null,
              node.style?.width ? widthMap[node.style.width] : null,
              node.style?.className,
            )}
          >
            {node.children.map((child, index) => (
              <React.Fragment key={index}>
                {renderComponent(child)}
              </React.Fragment>
            ))}
          </div>
        );
      case "grid":
        return (
          <div
            className={cn(
              "grid",
              node.columns ? `grid-cols-${node.columns}` : "grid-cols-2",
              node.style?.gap ? spacingMap[node.style.gap] : null,
              node.style?.padding ? paddingMap[node.style.padding] : null,
              node.style?.width ? widthMap[node.style.width] : null,
              node.style?.className,
            )}
          >
            {node.children.map((child, index) => (
              <React.Fragment key={index}>
                {renderComponent(child)}
              </React.Fragment>
            ))}
          </div>
        );
      case "heading":
        return (
          <div
            className={cn(
              "font-typewriter text-noir-paper",
              node.level === 1 && "text-3xl",
              node.level === 2 && "text-2xl",
              node.level === 3 && "text-xl",
              node.level === 4 && "text-lg",
              node.style?.className,
            )}
          >
            {node.text}
          </div>
        );
      case "paragraph":
        return (
          <p
            className={cn(
              "font-mono text-sm leading-relaxed text-noir-paper/80",
              node.style?.className,
            )}
          >
            {node.text}
          </p>
        );
      case "image":
        return (
          <img
            src={node.src}
            alt={node.alt}
            className={cn(
              "rounded-sm object-cover",
              node.style?.width ? widthMap[node.style.width] : null,
              node.style?.className,
            )}
          />
        );
      case "input":
        return (
          <label className={cn("flex flex-col gap-2 text-xs", node.style?.className)}>
            <span className="font-typewriter text-noir-paper/70">
              {node.label}
            </span>
            <input
              placeholder={node.placeholder}
              value={node.value ?? ""}
              readOnly
              className={cn(
                "bg-transparent border-b border-noir-gray/30 py-2 text-sm text-noir-paper focus:outline-none",
                node.variant ? variantMap[node.variant] : "",
              )}
            />
          </label>
        );
      case "textarea":
        return (
          <label className={cn("flex flex-col gap-2 text-xs", node.style?.className)}>
            <span className="font-typewriter text-noir-paper/70">
              {node.label}
            </span>
            <textarea
              placeholder={node.placeholder}
              value={node.value ?? ""}
              readOnly
              rows={node.rows ?? 3}
              className={cn(
                "bg-transparent border border-noir-gray/30 p-2 text-sm text-noir-paper focus:outline-none",
                node.variant ? variantMap[node.variant] : "",
              )}
            />
          </label>
        );
      case "select":
        return (
          <label className={cn("flex flex-col gap-2 text-xs", node.style?.className)}>
            <span className="font-typewriter text-noir-paper/70">
              {node.label}
            </span>
            <select
              value={node.value ?? node.options[0]}
              className={cn(
                "bg-transparent border border-noir-gray/30 p-2 text-sm text-noir-paper focus:outline-none",
                node.variant ? variantMap[node.variant] : "",
              )}
            >
              {node.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        );
      case "checkbox":
        return (
          <label className={cn("flex items-center gap-2 text-xs", node.style?.className)}>
            <input type="checkbox" checked={node.checked ?? false} readOnly />
            <span className="font-typewriter text-noir-paper/70">
              {node.label}
            </span>
          </label>
        );
      case "button":
        return (
          <button
            type="button"
            className={cn(
              "px-3 py-2 text-xs uppercase tracking-widest border rounded-sm",
              node.variant ? variantMap[node.variant] : "",
              node.style?.className,
            )}
          >
            {node.label}
          </button>
        );
      default:
        return null;
    }
  };

  return <>{renderComponent(component)}</>;
}
