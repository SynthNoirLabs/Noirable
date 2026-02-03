import React, { useState } from "react";
import { type ChoicePicker as ChoicePickerType } from "@/lib/a2ui/catalog/components";
import { ComponentRendererProps } from "@/components/a2ui/registry";
import { cn } from "@/lib/utils";
import { useFormContext } from "@/components/renderer/FormContext";
import { getBindingPath, validate } from "./utils";

export const ChoicePicker: React.FC<ComponentRendererProps<ChoicePickerType>> = ({
  node,
  // Theme prop reserved for future theming support
  theme: _theme = "standard",
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
      <span className="font-typewriter text-[var(--aesthetic-text)]/70">{label}</span>
      <select
        name={bindingPath || node.id}
        value={currentValue}
        onChange={handleChange}
        className={cn(
          "bg-transparent border border-[var(--aesthetic-border)]/30 p-2 text-sm text-[var(--aesthetic-text)] focus:outline-none focus:border-[var(--aesthetic-text)] transition-colors w-full rounded-sm",
          error && "border-[var(--aesthetic-error)]/70"
        )}
      >
        <option
          value=""
          disabled
          className="bg-[var(--aesthetic-background)] text-[var(--aesthetic-text)]"
        >
          Select...
        </option>
        {node.options.map((option) => {
          const optLabel = typeof option.label === "string" ? option.label : option.value;
          return (
            <option
              key={option.value}
              value={option.value}
              className="bg-[var(--aesthetic-background)] text-[var(--aesthetic-text)]"
            >
              {optLabel}
            </option>
          );
        })}
      </select>
      {error && (
        <span className="text-[10px] text-[var(--aesthetic-error)] font-mono">{error}</span>
      )}
    </label>
  );
};
