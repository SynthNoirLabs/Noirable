import React, { useState } from "react";
import { type ChoicePicker as ChoicePickerType } from "@/lib/a2ui/catalog/components";
import { ComponentRendererProps } from "@/components/a2ui/registry";
import { cn } from "@/lib/utils";
import { useFormContext } from "@/components/renderer/FormContext";
import { getBindingPath, validate } from "./utils";

export const ChoicePicker: React.FC<ComponentRendererProps<ChoicePickerType>> = ({
  node,
  theme = "standard",
}) => {
  const formContext = useFormContext();
  const bindingPath = getBindingPath(node.value);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    const validationError = validate(newValue, node.checks);
    setError(validationError);

    if (formContext && bindingPath) {
      formContext.setValue(bindingPath, newValue);
    }
  };

  const currentValue =
    formContext && bindingPath ? (formContext.getValues()[bindingPath] as string) || "" : "";

  const label = typeof node.label === "string" ? node.label : "Select Option";

  return (
    <label className="flex flex-col gap-2 text-xs w-full">
      <span className="font-typewriter text-noir-paper/70">{label}</span>
      <select
        name={bindingPath || node.id}
        value={currentValue}
        onChange={handleChange}
        className={cn(
          "bg-transparent border border-noir-gray/30 p-2 text-sm text-noir-paper focus:outline-none focus:border-noir-paper transition-colors w-full rounded-sm",
          error && "border-noir-red/70"
        )}
      >
        <option value="" disabled className="bg-noir-black text-noir-paper">
          Select...
        </option>
        {node.options.map((option) => {
          const optLabel = typeof option.label === "string" ? option.label : option.value;
          return (
            <option
              key={option.value}
              value={option.value}
              className="bg-noir-black text-noir-paper"
            >
              {optLabel}
            </option>
          );
        })}
      </select>
      {error && <span className="text-[10px] text-noir-red font-mono">{error}</span>}
    </label>
  );
};
