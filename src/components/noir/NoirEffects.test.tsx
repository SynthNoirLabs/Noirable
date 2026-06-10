import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { NoirEffects } from "./NoirEffects";
import type { AmbientSettings } from "@/lib/store/useA2UIStore";

// The audio/music children pull in browser-only APIs we don't need here; stub
// them so the test focuses on which VISUAL particle overlay each preset selects.
vi.mock("./NoirMusic", () => ({ NoirMusic: () => null }));
vi.mock("./RainAudio", () => ({ RainAudio: () => null }));
vi.mock("./CrackleAudio", () => ({ CrackleAudio: () => null }));

const ambient: AmbientSettings = {
  rainEnabled: true,
  rainVolume: 1,
  fogEnabled: true,
  intensity: "medium",
  crackleEnabled: false,
  crackleVolume: 0.35,
};

describe("NoirEffects — per-preset particle selection", () => {
  it("gothic-manor shows drifting embers (atmosphere.particle = ember)", () => {
    const { queryByTestId } = render(
      <NoirEffects ambient={ambient} soundEnabled={false} aestheticId="gothic-manor" />
    );
    expect(queryByTestId("ember-overlay")).toBeInTheDocument();
    expect(queryByTestId("crackle-overlay")).toBeNull();
  });

  it("nostromo-console shows terminal grain (atmosphere.particle = grain)", () => {
    const { queryByTestId } = render(
      <NoirEffects ambient={ambient} soundEnabled={false} aestheticId="nostromo-console" />
    );
    expect(queryByTestId("crackle-overlay")).toBeInTheDocument();
    expect(queryByTestId("ember-overlay")).toBeNull();
  });

  it("minimal shows no particle overlays (atmosphere.particle = none)", () => {
    const { queryByTestId } = render(
      <NoirEffects ambient={ambient} soundEnabled={false} aestheticId="minimal" />
    );
    expect(queryByTestId("ember-overlay")).toBeNull();
    expect(queryByTestId("crackle-overlay")).toBeNull();
  });

  it("noir does not show ember or grain (its particle is rain)", () => {
    const { queryByTestId } = render(
      <NoirEffects ambient={ambient} soundEnabled={false} aestheticId="noir" />
    );
    expect(queryByTestId("ember-overlay")).toBeNull();
    expect(queryByTestId("crackle-overlay")).toBeNull();
  });

  it("an explicit crackle toggle forces grain on even for a rain world (noir)", () => {
    const { queryByTestId } = render(
      <NoirEffects
        ambient={{ ...ambient, crackleEnabled: true }}
        soundEnabled={false}
        aestheticId="noir"
      />
    );
    expect(queryByTestId("crackle-overlay")).toBeInTheDocument();
  });
});
