import { describe, it, expect } from "vitest";

import { runChecks } from "./checks";
import type { CheckRule } from "./checks";

const rule = (call: string, message: string, args?: Record<string, unknown>): CheckRule => ({
  call,
  message,
  ...(args ? { args } : {}),
});

describe("runChecks", () => {
  describe("no checks", () => {
    it("returns null when checks is undefined", () => {
      expect(runChecks("anything")).toBeNull();
    });

    it("returns null when checks is empty", () => {
      expect(runChecks("anything", [])).toBeNull();
    });
  });

  describe("required", () => {
    const checks = [rule("required", "is required")];

    it("passes for a non-empty string", () => {
      expect(runChecks("hello", checks)).toBeNull();
    });

    it("passes for true", () => {
      expect(runChecks(true, checks)).toBeNull();
    });

    it("passes for the number zero", () => {
      expect(runChecks(0, checks)).toBeNull();
    });

    it("passes for a non-empty array", () => {
      expect(runChecks(["a"], checks)).toBeNull();
    });

    it("fails for undefined", () => {
      expect(runChecks(undefined, checks)).toBe("is required");
    });

    it("fails for null", () => {
      expect(runChecks(null, checks)).toBe("is required");
    });

    it("fails for an empty string", () => {
      expect(runChecks("", checks)).toBe("is required");
    });

    it("fails for false", () => {
      expect(runChecks(false, checks)).toBe("is required");
    });

    it("fails for an empty array", () => {
      expect(runChecks([], checks)).toBe("is required");
    });
  });

  describe("email", () => {
    const checks = [rule("email", "invalid email")];

    it("passes for a valid email", () => {
      expect(runChecks("user@example.com", checks)).toBeNull();
    });

    it("passes for an empty string (use required to enforce presence)", () => {
      expect(runChecks("", checks)).toBeNull();
    });

    it("passes for non-string values", () => {
      expect(runChecks(123, checks)).toBeNull();
    });

    it("fails for a malformed email", () => {
      expect(runChecks("not-an-email", checks)).toBe("invalid email");
    });

    it("fails for an email missing the TLD", () => {
      expect(runChecks("user@example", checks)).toBe("invalid email");
    });
  });

  describe("regex", () => {
    it("passes when the string matches", () => {
      const checks = [rule("regex", "bad format", { pattern: "^[0-9]+$" })];
      expect(runChecks("12345", checks)).toBeNull();
    });

    it("fails when the string does not match", () => {
      const checks = [rule("regex", "bad format", { pattern: "^[0-9]+$" })];
      expect(runChecks("12a45", checks)).toBe("bad format");
    });

    it("passes for non-string values", () => {
      const checks = [rule("regex", "bad format", { pattern: "^[0-9]+$" })];
      expect(runChecks(12345, checks)).toBeNull();
    });

    it("passes when pattern arg is missing", () => {
      const checks = [rule("regex", "bad format")];
      expect(runChecks("anything", checks)).toBeNull();
    });

    it("passes when pattern arg is not a string", () => {
      const checks = [rule("regex", "bad format", { pattern: 42 })];
      expect(runChecks("anything", checks)).toBeNull();
    });

    it("treats an invalid pattern as a pass", () => {
      const checks = [rule("regex", "bad format", { pattern: "([" })];
      expect(runChecks("anything", checks)).toBeNull();
    });
  });

  describe("minLength", () => {
    const checks = [rule("minLength", "too short", { min: 3 })];

    it("passes when length >= min", () => {
      expect(runChecks("abc", checks)).toBeNull();
    });

    it("fails when length < min", () => {
      expect(runChecks("ab", checks)).toBe("too short");
    });

    it("passes for non-string values", () => {
      expect(runChecks(5, checks)).toBeNull();
    });

    it("passes when min arg is missing", () => {
      expect(runChecks("a", [rule("minLength", "too short")])).toBeNull();
    });

    it("coerces a string min arg", () => {
      expect(runChecks("ab", [rule("minLength", "too short", { min: "3" })])).toBe("too short");
    });
  });

  describe("maxLength", () => {
    const checks = [rule("maxLength", "too long", { max: 3 })];

    it("passes when length <= max", () => {
      expect(runChecks("abc", checks)).toBeNull();
    });

    it("fails when length > max", () => {
      expect(runChecks("abcd", checks)).toBe("too long");
    });

    it("passes for non-string values", () => {
      expect(runChecks(99999, checks)).toBeNull();
    });

    it("passes when max arg is missing", () => {
      expect(runChecks("abcd", [rule("maxLength", "too long")])).toBeNull();
    });
  });

  describe("min", () => {
    const checks = [rule("min", "too small", { min: 10 })];

    it("passes when value >= min", () => {
      expect(runChecks(10, checks)).toBeNull();
    });

    it("fails when value < min", () => {
      expect(runChecks(9, checks)).toBe("too small");
    });

    it("coerces a numeric string value", () => {
      expect(runChecks("5", checks)).toBe("too small");
      expect(runChecks("11", checks)).toBeNull();
    });

    it("passes when value is not numeric", () => {
      expect(runChecks("abc", checks)).toBeNull();
    });

    it("passes when min arg is missing", () => {
      expect(runChecks(1, [rule("min", "too small")])).toBeNull();
    });
  });

  describe("max", () => {
    const checks = [rule("max", "too big", { max: 10 })];

    it("passes when value <= max", () => {
      expect(runChecks(10, checks)).toBeNull();
    });

    it("fails when value > max", () => {
      expect(runChecks(11, checks)).toBe("too big");
    });

    it("coerces a numeric string value", () => {
      expect(runChecks("20", checks)).toBe("too big");
      expect(runChecks("3", checks)).toBeNull();
    });

    it("passes when value is not numeric", () => {
      expect(runChecks("abc", checks)).toBeNull();
    });
  });

  describe("unknown call", () => {
    it("is ignored (treated as pass)", () => {
      expect(runChecks("", [rule("phoneNumber", "nope")])).toBeNull();
    });
  });

  describe("ordering", () => {
    it("returns the first failing check's message", () => {
      const checks = [
        rule("required", "required failure"),
        rule("minLength", "minLength failure", { min: 5 }),
      ];
      expect(runChecks("", checks)).toBe("required failure");
    });

    it("returns a later failure when earlier checks pass", () => {
      const checks = [
        rule("required", "required failure"),
        rule("minLength", "minLength failure", { min: 5 }),
      ];
      expect(runChecks("ab", checks)).toBe("minLength failure");
    });

    it("returns null when all checks pass", () => {
      const checks = [
        rule("required", "required failure"),
        rule("minLength", "minLength failure", { min: 2 }),
        rule("maxLength", "maxLength failure", { max: 10 }),
      ];
      expect(runChecks("hello", checks)).toBeNull();
    });
  });
});
