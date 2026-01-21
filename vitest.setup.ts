import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.mock("server-only", () => ({}));

if (typeof window !== "undefined") {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
}
