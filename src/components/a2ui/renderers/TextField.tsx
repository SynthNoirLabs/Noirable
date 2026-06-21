"use client";

import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { cn } from "@/lib/utils";
import { useSurfaceContext, type ComponentProps } from "../internal/context";
import { useResolve, getBindingPath } from "../internal/binding";
import { checksOf, useFieldValidation, FieldError } from "../internal/validation";

export function TextFieldRenderer({ component }: ComponentProps) {
  const { setData } = useSurfaceContext();
  const resolve = useResolve();
  const field = component as SurfaceComponent & {
    label?: unknown;
    value?: unknown;
    variant?: string;
  };

  const label = String(resolve(field.label) ?? "");
  const bindingPath = getBindingPath(field.value);
  const value = String(resolve(field.value) ?? "");
  const { error, markTouched } = useFieldValidation(value, checksOf(component));

  const fieldId = `surface-field-${field.id}`;
  const inputType =
    field.variant === "obscured" ? "password" : field.variant === "number" ? "number" : "text";

  const sharedClass = cn(
    "bg-[var(--aesthetic-background)]/60 border rounded-[var(--aesthetic-radius,2px)] px-3 py-2.5 text-[var(--aesthetic-text)] font-mono text-sm placeholder:text-[var(--aesthetic-text)]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]",
    error
      ? "border-[var(--aesthetic-error)]/70 focus:border-[var(--aesthetic-error)]"
      : "border-[var(--aesthetic-border)]/40 focus:border-[var(--aesthetic-accent)]"
  );

  const onChange = (next: string) => {
    markTouched();
    if (bindingPath) setData(bindingPath, next);
  };

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
      {field.variant === "longText" ? (
        <textarea
          id={fieldId}
          rows={4}
          aria-invalid={Boolean(error)}
          // Controlled when bound, uncontrolled otherwise — a literal value is
          // a one-shot default, while a `{path}` binding is the source of truth.
          {...(bindingPath ? { value } : { defaultValue: value })}
          onChange={(e) => onChange(e.currentTarget.value)}
          onBlur={markTouched}
          className={sharedClass}
        />
      ) : (
        <input
          id={fieldId}
          type={inputType}
          aria-invalid={Boolean(error)}
          {...(bindingPath ? { value } : { defaultValue: value })}
          onChange={(e) => onChange(e.currentTarget.value)}
          onBlur={markTouched}
          className={sharedClass}
        />
      )}
      <FieldError error={error} />
    </div>
  );
}
