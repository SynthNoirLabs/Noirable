import React, { useState } from "react";
import { type TextField as TextFieldType } from "@/lib/a2ui/catalog/components";
import { ComponentRendererProps } from "@/components/a2ui/registry";
import { cn } from "@/lib/utils";
import { useFormContext } from "@/components/renderer/FormContext";
import { getBindingPath, validate } from "./utils";

export const TextField: React.FC<ComponentRendererProps<TextFieldType>> = ({
  node,
  theme = "standard",
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
      <span className="font-typewriter text-noir-paper/70">{label}</span>
      <input
        type={inputType}
        name={bindingPath || node.id}
        value={currentValue}
        onChange={handleChange}
        className={cn(
          "bg-transparent border-b border-noir-gray/30 py-2 text-sm text-noir-paper focus:outline-none focus:border-noir-paper transition-colors w-full placeholder:text-noir-gray/30",
          error && "border-noir-red/70"
        )}
      />
      {error && <span className="text-[10px] text-noir-red font-mono">{error}</span>}
    </label>
  );
};
