import React, { useState } from "react";
import { type Slider as SliderType } from "@/lib/a2ui/catalog/components";
import { ComponentRendererProps } from "@/components/a2ui/registry";
import { cn } from "@/lib/utils";
import { useFormContext } from "@/components/renderer/FormContext";
import { getBindingPath, validate } from "./utils";

export const Slider: React.FC<ComponentRendererProps<SliderType>> = ({
  node,
  theme = "standard",
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
        <span className="font-typewriter text-noir-paper/70">{label}</span>
        <span className="font-mono text-noir-paper">{currentValue}</span>
      </div>
      <input
        type="range"
        name={bindingPath || node.id}
        min={node.min}
        max={node.max}
        value={currentValue}
        onChange={handleChange}
        className={cn(
          "w-full h-1 bg-noir-gray/30 rounded-lg appearance-none cursor-pointer accent-noir-paper",
          error && "accent-noir-red"
        )}
      />
      {error && <span className="text-[10px] text-noir-red font-mono">{error}</span>}
    </label>
  );
};
