import { render, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NoirSoundEffects, type NoirSoundEffectsControls } from "./NoirSoundEffects";
import type { AudioEventMap } from "@/lib/aesthetic/types";

function renderAndGetControls(props: Parameters<typeof NoirSoundEffects>[0] = { enabled: true }) {
  let controls: NoirSoundEffectsControls | null = null;
  render(<NoirSoundEffects {...props} onReady={(c) => (controls = c)} />);
  return () => controls;
}

describe("NoirSoundEffects", () => {
  it("exposes the event-driven and legacy controls", () => {
    const get = renderAndGetControls();
    const controls = get();
    expect(controls).not.toBeNull();
    expect(typeof controls?.playByEvent).toBe("function");
    expect(typeof controls?.playTypewriter).toBe("function");
    expect(typeof controls?.playThunder).toBe("function");
    expect(typeof controls?.playPhoneRing).toBe("function");
  });

  it("resolves a mapped semantic event without throwing", () => {
    // Audio is stubbed undefined in jsdom, so playback is a no-op; this exercises
    // the event→SFX resolution branch for a preset that maps the event.
    const get = renderAndGetControls({ enabled: true });
    expect(() => get()?.playByEvent("dramatic.beat")).not.toThrow();
  });

  it("is a safe no-op for an event the preset leaves unmapped", () => {
    // Minimal-style map: only message.complete is wired.
    const audioEvents: AudioEventMap = { "message.complete": "typewriter" };
    const get = renderAndGetControls({ enabled: true, audioEvents });
    expect(() => get()?.playByEvent("dramatic.beat")).not.toThrow();
    expect(() => get()?.playByEvent("error")).not.toThrow();
    expect(() => get()?.playByEvent("message.complete")).not.toThrow();
  });

  it("clears the controls callback on unmount", () => {
    const onReady = vi.fn();
    const { unmount } = render(<NoirSoundEffects enabled onReady={onReady} />);
    expect(onReady).toHaveBeenLastCalledWith(
      expect.objectContaining({ playByEvent: expect.any(Function) })
    );
    act(() => unmount());
    expect(onReady).toHaveBeenLastCalledWith(null);
  });
});
