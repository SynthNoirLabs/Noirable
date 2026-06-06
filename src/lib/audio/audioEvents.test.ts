import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AUDIO_EVENT_NAMES,
  DUCK_FACTOR,
  RESTORE_FACTOR,
  duckMusic,
  eventTriggersLightning,
  getMusicDuckFactor,
  restoreMusic,
  scanTextForAudioEvents,
  scanTextForAudioEventTimings,
  setMusicDuckFactor,
  subscribeMusicDuck,
} from "./audioEvents";

afterEach(() => {
  // Reset the shared duck channel between tests.
  restoreMusic();
});

describe("scanTextForAudioEvents", () => {
  it("maps thunder/lightning keywords to dramatic.beat", () => {
    expect(scanTextForAudioEvents("a flash of lightning")).toEqual(["dramatic.beat"]);
    expect(scanTextForAudioEvents("distant THUNDER rolled")).toEqual(["dramatic.beat"]);
    expect(scanTextForAudioEvents("un relámpago")).toEqual(["dramatic.beat"]);
  });

  it("maps phone-ringing keywords to error", () => {
    expect(scanTextForAudioEvents("then the phone rang")).toEqual(["error"]);
    expect(scanTextForAudioEvents("the telephone ringing in the hall")).toEqual(["error"]);
    expect(scanTextForAudioEvents("el teléfono sonó")).toEqual(["error"]);
  });

  it("returns both events when both kinds of keyword appear", () => {
    expect(scanTextForAudioEvents("lightning struck and the phone rang")).toEqual([
      "dramatic.beat",
      "error",
    ]);
  });

  it("returns nothing for neutral text or empty input", () => {
    expect(scanTextForAudioEvents("a calm quiet afternoon")).toEqual([]);
    expect(scanTextForAudioEvents("")).toEqual([]);
  });
});

describe("scanTextForAudioEventTimings", () => {
  it("returns the earliest keyword index per event, sorted ascending", () => {
    const timings = scanTextForAudioEventTimings("the phone rang, then lightning flashed");
    expect(timings).toEqual([
      { event: "error", index: 4 },
      { event: "dramatic.beat", index: 21 },
    ]);
  });

  it("returns nothing for empty input", () => {
    expect(scanTextForAudioEventTimings("")).toEqual([]);
  });
});

describe("eventTriggersLightning", () => {
  it("only flashes lightning on dramatic.beat", () => {
    expect(eventTriggersLightning("dramatic.beat")).toBe(true);
    for (const name of AUDIO_EVENT_NAMES.filter((n) => n !== "dramatic.beat")) {
      expect(eventTriggersLightning(name)).toBe(false);
    }
  });
});

describe("music duck channel", () => {
  it("notifies subscribers immediately with the current factor", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeMusicDuck(listener);
    expect(listener).toHaveBeenCalledWith(RESTORE_FACTOR);
    unsubscribe();
  });

  it("ducks and restores the music bed", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeMusicDuck(listener);
    listener.mockClear();

    duckMusic();
    expect(getMusicDuckFactor()).toBe(DUCK_FACTOR);
    expect(listener).toHaveBeenLastCalledWith(DUCK_FACTOR);

    restoreMusic();
    expect(getMusicDuckFactor()).toBe(RESTORE_FACTOR);
    expect(listener).toHaveBeenLastCalledWith(RESTORE_FACTOR);

    unsubscribe();
  });

  it("does not re-notify when the factor is unchanged", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeMusicDuck(listener);
    listener.mockClear();

    restoreMusic(); // already at RESTORE_FACTOR
    expect(listener).not.toHaveBeenCalled();

    unsubscribe();
  });

  it("clamps the factor into [0, 1]", () => {
    setMusicDuckFactor(5);
    expect(getMusicDuckFactor()).toBe(1);
    setMusicDuckFactor(-2);
    expect(getMusicDuckFactor()).toBe(0);
  });

  it("stops notifying after unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeMusicDuck(listener);
    listener.mockClear();
    unsubscribe();

    duckMusic();
    expect(listener).not.toHaveBeenCalled();
  });
});
