import React from "react";
import { type Button as ButtonType } from "@/lib/a2ui/catalog/components";
import { ComponentRendererProps } from "@/components/a2ui/registry";
import { cn } from "@/lib/utils";
import { useFormContext } from "@/components/renderer/FormContext";

export const Button: React.FC<ComponentRendererProps<ButtonType>> = ({
  node,
  theme = "standard",
}) => {
  const formContext = useFormContext();

  const handleClick = (e: React.MouseEvent) => {
    const action = node.action;

    if ("event" in action) {
      console.log(`[Button] Triggering event: ${action.event.name}`, action.event.context);

      // Legacy support for form submission
      if (action.event.name === "submit" && formContext?.onSubmit) {
        e.preventDefault();
        formContext.onSubmit(formContext.getValues());
      }
    } else if ("functionCall" in action) {
      console.log(
        `[Button] Calling function: ${action.functionCall.call}`,
        action.functionCall.args
      );
    }
  };

  const variantStyles = {
    primary: "bg-noir-paper text-noir-black hover:bg-noir-paper/90",
    borderless: "bg-transparent text-noir-paper hover:bg-noir-paper/10 border border-transparent",
  };

  const baseStyles =
    "px-4 py-2 rounded-sm font-typewriter text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-noir-paper/50 disabled:opacity-50 disabled:cursor-not-allowed";

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
