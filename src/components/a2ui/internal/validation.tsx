"use client";

import { useState } from "react";
import { runChecks, type CheckRule } from "@/lib/a2ui/validation";
import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";

// ============================================================================
// Validation
// ============================================================================

export function checksOf(component: SurfaceComponent): CheckRule[] | undefined {
  const checks = (component as { checks?: unknown }).checks;
  return Array.isArray(checks) ? (checks as CheckRule[]) : undefined;
}

/**
 * Field-level validation. Errors surface only after the field is "touched"
 * (changed or blurred) so a form doesn't shout before the user has typed.
 */
export function useFieldValidation(currentValue: unknown, checks: CheckRule[] | undefined) {
  const [touched, setTouched] = useState(false);
  const error = touched ? runChecks(currentValue, checks) : null;
  return { error, markTouched: () => setTouched(true) };
}

export function FieldError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <span role="alert" className="text-[10px] font-mono text-[var(--aesthetic-error)]">
      {error}
    </span>
  );
}
