"use client";

import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { useSurfaceContext, type ComponentProps } from "../internal/context";
import { useResolve, getBindingPath } from "../internal/binding";
import { checksOf, useFieldValidation, FieldError } from "../internal/validation";

export function DateTimeInputRenderer({ component }: ComponentProps) {
  const { setData } = useSurfaceContext();
  const resolve = useResolve();
  const dti = component as SurfaceComponent & {
    label?: unknown;
    value?: unknown;
    enableDate?: boolean;
    enableTime?: boolean;
    min?: unknown;
    max?: unknown;
    accessibility?: { label?: unknown };
  };

  const bindingPath = getBindingPath(dti.value);
  const value = String(resolve(dti.value) ?? "");
  // Prefer the top-level `label`; fall back to the accessibility label.
  const labelSource = dti.label ?? dti.accessibility?.label;
  const label = labelSource ? String(resolve(labelSource)) : undefined;
  const min = dti.min != null ? String(resolve(dti.min) ?? "") : undefined;
  const max = dti.max != null ? String(resolve(dti.max) ?? "") : undefined;
  const { error, markTouched } = useFieldValidation(value, checksOf(component));

  // Default to date when neither flag is set; pick the closest native type.
  const enableDate = dti.enableDate ?? true;
  const enableTime = dti.enableTime ?? false;
  const inputType =
    enableDate && enableTime ? "datetime-local" : enableTime && !enableDate ? "time" : "date";

  const fieldId = `surface-datetime-${dti.id}`;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={fieldId}
          className="font-typewriter text-[10px] uppercase tracking-widest text-[var(--aesthetic-text)]/55"
        >
          {label}
        </label>
      )}
      <input
        id={fieldId}
        type={inputType}
        aria-invalid={Boolean(error)}
        {...(min ? { min } : {})}
        {...(max ? { max } : {})}
        {...(bindingPath ? { value } : { defaultValue: value })}
        onChange={(e) => {
          markTouched();
          if (bindingPath) setData(bindingPath, e.currentTarget.value);
        }}
        onBlur={markTouched}
        className="bg-[var(--aesthetic-surface)] border border-[var(--aesthetic-border)]/30 rounded-sm px-3 py-2 text-[var(--aesthetic-text)] font-mono text-sm focus:border-[var(--aesthetic-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)] [color-scheme:dark]"
      />
      <FieldError error={error} />
    </div>
  );
}
