import { z } from "zod";
import {
  dynamicStringSchema,
  dynamicBooleanSchema,
  dynamicNumberSchema,
  dynamicStringListSchema,
  checkRuleSchema,
} from "@/lib/a2ui/catalog/components";

export type DynamicString = z.infer<typeof dynamicStringSchema>;
export type DynamicBoolean = z.infer<typeof dynamicBooleanSchema>;
export type DynamicNumber = z.infer<typeof dynamicNumberSchema>;
export type DynamicStringList = z.infer<typeof dynamicStringListSchema>;
export type CheckRule = z.infer<typeof checkRuleSchema>;

export type AnyDynamicValue = DynamicString | DynamicBoolean | DynamicNumber | DynamicStringList;

export function getBindingPath(value: AnyDynamicValue | undefined): string | undefined {
  if (!value) return undefined;
  if (typeof value === "object" && !Array.isArray(value) && "path" in value) {
    return value.path;
  }
  return undefined;
}

export function getInitialValue(
  value: AnyDynamicValue | undefined
): string | boolean | number | string[] | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "object") return value as string | boolean | number; // Literal primitive
  if (Array.isArray(value)) return value; // Literal array
  return undefined;
}

export function validate(
  value: string | boolean | number | string[] | undefined,
  checks?: CheckRule[]
): string | null {
  if (!checks || checks.length === 0) return null;

  for (const check of checks) {
    const { call, args, message } = check;
    if (call === "required") {
      if (value === undefined || value === "" || value === false || value === null) return message;
      if (Array.isArray(value) && value.length === 0) return message;
    }
    if (call === "email" && typeof value === "string") {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return message;
    }
    if (call === "minLength" && typeof value === "string" && args?.min) {
      if (value.length < Number(args.min)) return message;
    }
  }
  return null;
}
