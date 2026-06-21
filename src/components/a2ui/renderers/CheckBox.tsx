"use client";

import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { useSurfaceContext, type ComponentProps } from "../internal/context";
import { useResolve, getBindingPath } from "../internal/binding";
import { checksOf, useFieldValidation, FieldError } from "../internal/validation";

export function CheckBoxRenderer({ component }: ComponentProps) {
  const { setData } = useSurfaceContext();
  const resolve = useResolve();
  const cb = component as SurfaceComponent & { label?: unknown; value?: unknown };

  const label = String(resolve(cb.label) ?? "");
  const bindingPath = getBindingPath(cb.value);
  const checked = Boolean(resolve(cb.value));
  const { error, markTouched } = useFieldValidation(checked, checksOf(component));

  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-2 text-[var(--aesthetic-text)] font-mono text-sm cursor-pointer">
        <input
          type="checkbox"
          aria-invalid={Boolean(error)}
          {...(bindingPath ? { checked } : { defaultChecked: checked })}
          onChange={(e) => {
            markTouched();
            if (bindingPath) setData(bindingPath, e.currentTarget.checked);
          }}
          className="w-4 h-4 accent-[var(--aesthetic-accent)] [color-scheme:dark] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]"
        />
        {label}
      </label>
      <FieldError error={error} />
    </div>
  );
}
