import React, { useState } from "react";
import { type DateTimeInput as DateTimeInputType } from "@/lib/a2ui/catalog/components";
import { ComponentRendererProps } from "@/components/a2ui/registry";
import { cn } from "@/lib/utils";
import { useFormContext } from "@/components/renderer/FormContext";
import { getBindingPath, validate } from "./utils";

export const DateTimeInput: React.FC<ComponentRendererProps<DateTimeInputType>> = ({
  node,
  // Theme prop reserved for future theming support
  theme: _theme = "standard",
}) => {
  const formContext = useFormContext();
  const bindingPath = getBindingPath(node.value);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const validationError = validate(newValue, node.checks);
    setError(validationError);

    if (formContext && bindingPath) {
      formContext.setValue(bindingPath, newValue);
    }
  };

  const currentValue =
    formContext && bindingPath ? (formContext.getValues()[bindingPath] as string) || "" : "";

  // Determine HTML input type
  let inputType = "date";
  if (node.enableDate && node.enableTime) inputType = "datetime-local";
  else if (node.enableTime) inputType = "time";

  // Resolve min/max strings (assuming literal for now as dynamic is complex)
  const min = typeof node.min === "string" ? node.min : undefined;
  const max = typeof node.max === "string" ? node.max : undefined;

  return (
    <label className="flex flex-col gap-2 text-xs w-full">
      <span className="font-typewriter text-[var(--aesthetic-text)]/70">Date/Time</span>
      <input
        type={inputType}
        name={bindingPath || node.id}
        value={currentValue}
        onChange={handleChange}
        min={min}
        max={max}
        className={cn(
          "bg-transparent border-b border-[var(--aesthetic-border)]/30 py-2 text-sm text-[var(--aesthetic-text)] focus:outline-none focus:border-[var(--aesthetic-text)] transition-colors w-full font-mono",
          error && "border-[var(--aesthetic-error)]/70"
        )}
      />
      {error && (
        <span className="text-[10px] text-[var(--aesthetic-error)] font-mono">{error}</span>
      )}
    </label>
  );
};
