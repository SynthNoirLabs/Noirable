import React, { useState } from "react";
import { type CheckBox as CheckBoxType } from "@/lib/a2ui/catalog/components";
import { ComponentRendererProps } from "@/components/a2ui/registry";
import { cn } from "@/lib/utils";
import { useFormContext } from "@/components/renderer/FormContext";
import { getBindingPath, validate } from "./utils";

export const CheckBox: React.FC<ComponentRendererProps<CheckBoxType>> = ({
  node,
  theme = "standard",
}) => {
  const formContext = useFormContext();
  const bindingPath = getBindingPath(node.value);

  // Local state for error if needed, though form context might handle it
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;

    // Validation
    const validationError = validate(newValue, node.checks);
    setError(validationError);

    if (formContext && bindingPath) {
      formContext.setValue(bindingPath, newValue);
    }
  };

  // Resolve current value: context > default
  const currentValue =
    formContext && bindingPath
      ? (formContext.getValues()[bindingPath] as boolean)
      : node.value === true; // Only if literal true, otherwise false

  const label = typeof node.label === "string" ? node.label : "Checkbox"; // handle dynamic string simply

  return (
    <div className="flex flex-col gap-1">
      <label className={cn("flex items-center gap-2 text-xs cursor-pointer select-none")}>
        <input
          type="checkbox"
          name={bindingPath || node.id}
          checked={!!currentValue}
          onChange={handleChange}
          className="appearance-none w-4 h-4 border border-noir-gray/50 rounded-sm checked:bg-noir-paper checked:border-noir-paper focus:outline-none focus:ring-1 focus:ring-noir-paper/50 transition-colors relative"
        />
        {/* Custom checkmark visualization could go here */}
        <span className="font-typewriter text-noir-paper/70 hover:text-noir-paper transition-colors">
          {label}
        </span>
      </label>
      {error && <span className="text-[10px] text-noir-red font-mono ml-6">{error}</span>}
    </div>
  );
};
