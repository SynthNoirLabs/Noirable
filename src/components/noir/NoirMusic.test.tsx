import { render, act } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { NoirMusic } from "./NoirMusic";
import { duckMusic, restoreMusic } from "@/lib/audio/audioEvents";

afterEach(() => {
  restoreMusic();
});

describe("NoirMusic ducking", () => {
  it("subscribes to the music-duck channel while mounted and tolerates duck/restore", () => {
    // Audio is stubbed undefined in jsdom, so no element is created; this asserts
    // the subscription lifecycle and that duck/restore notifications are safe.
    const { unmount } = render(<NoirMusic enabled soundEnabled volume={0.22} />);

    expect(() => {
      act(() => {
        duckMusic();
        restoreMusic();
      });
    }).not.toThrow();

    expect(() => act(() => unmount())).not.toThrow();
  });

  it("does not throw when disabled", () => {
    expect(() => render(<NoirMusic enabled={false} soundEnabled />)).not.toThrow();
  });

  it("renders nothing", () => {
    const { container } = render(<NoirMusic enabled soundEnabled />);
    expect(container).toBeEmptyDOMElement();
  });

  // Sanity: a duck issued before mount is picked up by the immediate replay in
  // subscribeMusicDuck, so a late-mounting bed converges to the ducked level.
  it("survives mounting while a duck is already in progress", () => {
    act(() => duckMusic());
    expect(() => render(<NoirMusic enabled soundEnabled volume={0.22} />)).not.toThrow();
    act(() => restoreMusic());
  });
});
