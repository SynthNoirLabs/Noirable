import React, { useState } from "react";
import { type Slider as SliderType } from "@/lib/a2ui/catalog/components";
import { ComponentRendererProps } from "@/components/a2ui/registry";
import { cn } from "@/lib/utils";
import { useFormContext } from "@/components/renderer/FormContext";
import { getBindingPath, validate } from "./utils";

export const Slider: React.FC<ComponentRendererProps<SliderType>> = ({
  node,
  // Theme prop reserved for future theming support
  theme: _theme = "standard",
}) => {
  const formContext = useFormContext();
  const bindingPath = getBindingPath(node.value);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value; // FormContext stores strings/booleans usually
    const validationError = validate(Number(newValue), node.checks);
    setError(validationError);

    if (formContext && bindingPath) {
      formContext.setValue(bindingPath, newValue);
    }
  };

  const currentValue =
    formContext && bindingPath
      ? (formContext.getValues()[bindingPath] as string) || node.min
      : node.min;

  const label = typeof node.label === "string" ? node.label : "Range";

  return (
    <label className="flex flex-col gap-2 text-xs w-full">
      <div className="flex justify-between items-end">
        <span className="font-typewriter text-[var(--aesthetic-text)]/70">{label}</span>
        <span className="font-mono text-[var(--aesthetic-text)]">{currentValue}</span>
      </div>
      <input
        type="range"
        name={bindingPath || node.id}
        min={node.min}
        max={node.max}
        value={currentValue}
        onChange={handleChange}
        className={cn(
          "w-full h-1 bg-[var(--aesthetic-surface-alt)]/30 rounded-lg appearance-none cursor-pointer accent-[var(--aesthetic-text)]",
          error && "accent-[var(--aesthetic-error)]"
        )}
      />
      {error && (
        <span className="text-[10px] text-[var(--aesthetic-error)] font-mono">{error}</span>
      )}
    </label>
  );
};
