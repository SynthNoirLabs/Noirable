import React from "react";
import { type Button as ButtonType } from "@/lib/a2ui/catalog/components";
import { ComponentRendererProps } from "@/components/a2ui/registry";
import { cn } from "@/lib/utils";
import { useFormContext } from "@/components/renderer/FormContext";

export const Button: React.FC<ComponentRendererProps<ButtonType>> = ({
  node,
  // Theme prop reserved for future theming support
  theme: _theme = "standard",
}) => {
  const formContext = useFormContext();

  const handleClick = (e: React.MouseEvent) => {
    const action = node.action;

    if ("event" in action) {
      // Legacy support for form submission
      if (action.event.name === "submit" && formContext?.onSubmit) {
        e.preventDefault();
        formContext.onSubmit(formContext.getValues());
      }
    }
  };

  const variantStyles = {
    primary:
      "bg-[var(--aesthetic-text)] text-[var(--aesthetic-background)] hover:bg-[var(--aesthetic-text)]/90",
    borderless:
      "bg-transparent text-[var(--aesthetic-text)] hover:bg-[var(--aesthetic-text)]/10 border border-transparent",
  };

  const baseStyles =
    "px-4 py-2 rounded-sm font-typewriter text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--aesthetic-text)]/50 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClass = node.variant ? variantStyles[node.variant] : variantStyles.primary;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(baseStyles, variantClass)}
      id={node.id}
    >
      {node.child}
    </button>
  );
};
