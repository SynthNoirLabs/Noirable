import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.mock("server-only", () => ({}));

if (typeof window !== "undefined") {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  // JSDOM's media element implementation is partial and can throw on properties like
  // `currentTime`. We don't need real audio for unit tests, so disable `Audio`.
  vi.stubGlobal("Audio", undefined);
}

if (typeof HTMLMediaElement !== "undefined") {
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  HTMLMediaElement.prototype.pause = vi.fn();
}
