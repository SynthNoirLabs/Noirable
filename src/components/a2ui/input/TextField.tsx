import React, { useState } from "react";
import { type TextField as TextFieldType } from "@/lib/a2ui/catalog/components";
import { ComponentRendererProps } from "@/components/a2ui/registry";
import { cn } from "@/lib/utils";
import { useFormContext } from "@/components/renderer/FormContext";
import { getBindingPath, validate } from "./utils";

export const TextField: React.FC<ComponentRendererProps<TextFieldType>> = ({
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

  const label = typeof node.label === "string" ? node.label : "Text Field";
  const typeMap = {
    shortText: "text",
    longText: "text", // use input for now, maybe textarea later if needed
    number: "number",
    obscured: "password",
  };

  const inputType = node.variant ? typeMap[node.variant] : "text";

  return (
    <label className="flex flex-col gap-2 text-xs w-full">
      <span className="font-typewriter text-[var(--aesthetic-text)]/70">{label}</span>
      <input
        type={inputType}
        name={bindingPath || node.id}
        value={currentValue}
        onChange={handleChange}
        className={cn(
          "bg-transparent border-b border-[var(--aesthetic-border)]/30 py-2 text-sm text-[var(--aesthetic-text)] focus:outline-none focus:border-[var(--aesthetic-text)] transition-colors w-full placeholder:text-[var(--aesthetic-text-muted)]/30",
          error && "border-[var(--aesthetic-error)]/70"
        )}
      />
      {error && (
        <span className="text-[10px] text-[var(--aesthetic-error)] font-mono">{error}</span>
      )}
    </label>
  );
};
