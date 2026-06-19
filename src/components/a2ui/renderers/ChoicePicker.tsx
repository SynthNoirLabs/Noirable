"use client";

import { useState } from "react";
import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { cn } from "@/lib/utils";
import { useSurfaceContext, type ComponentProps } from "../internal/context";
import { useResolve, getBindingPath } from "../internal/binding";
import { checksOf, useFieldValidation, FieldError } from "../internal/validation";

interface ChoiceOption {
  label?: unknown;
  value: string;
}

export function ChoicePickerRenderer({ component }: ComponentProps) {
  const { setData } = useSurfaceContext();
  const resolve = useResolve();
  const picker = component as SurfaceComponent & {
    label?: unknown;
    variant?: string;
    options?: ChoiceOption[];
    value?: unknown;
  };

  const label = picker.label ? String(resolve(picker.label)) : "";
  const options = Array.isArray(picker.options) ? picker.options : [];
  const bindingPath = getBindingPath(picker.value);
  const resolved = resolve(picker.value);
  const boundSelected: string[] = Array.isArray(resolved)
    ? (resolved as string[])
    : typeof resolved === "string" && resolved
      ? [resolved]
      : [];

  // When there's no `{path}` binding (e.g. a literal default), the picker is
  // uncontrolled — track the selection locally so clicks still register.
  const [localSelected, setLocalSelected] = useState<string[]>(boundSelected);
  const selected = bindingPath ? boundSelected : localSelected;
  const { error, markTouched } = useFieldValidation(selected, checksOf(component));

  const multiple = picker.variant === "multipleSelection";

  const toggle = (optValue: string) => {
    markTouched();
    const next = multiple
      ? selected.includes(optValue)
        ? selected.filter((v) => v !== optValue)
        : [...selected, optValue]
      : [optValue];
    if (bindingPath) {
      setData(bindingPath, next);
    } else {
      setLocalSelected(next);
    }
  };

  return (
    <fieldset className="flex flex-col gap-1.5 text-sm">
      {label && (
        <legend className="font-typewriter text-[10px] uppercase tracking-widest text-[var(--aesthetic-text)]/55 mb-1">
          {label}
        </legend>
      )}
      {options.map((option) => {
        const optLabel = String(resolve(option.label) ?? option.value);
        const isSelected = selected.includes(option.value);
        return (
          <label
            key={option.value}
            className={cn(
              "flex items-center gap-2.5 font-mono cursor-pointer rounded-sm px-2 py-1.5 border transition-colors",
              isSelected
                ? "border-[var(--aesthetic-accent)]/50 bg-[var(--aesthetic-accent)]/10 text-[var(--aesthetic-text)]"
                : "border-[var(--aesthetic-border)]/20 text-[var(--aesthetic-text)]/80 hover:border-[var(--aesthetic-border)]/40"
            )}
          >
            <input
              type={multiple ? "checkbox" : "radio"}
              name={`choice-${component.id}`}
              checked={isSelected}
              onChange={() => toggle(option.value)}
              className="w-4 h-4 accent-[var(--aesthetic-accent)] [color-scheme:dark] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]"
            />
            {optLabel}
          </label>
        );
      })}
      <FieldError error={error} />
    </fieldset>
  );
}
