import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AudioPlayer } from "./AudioPlayer";
import { ComponentRendererProps } from "../registry";
import { AudioPlayer as AudioNode } from "@/lib/a2ui/catalog/components";

describe("AudioPlayer Component", () => {
  it("renders audio element with src", () => {
    const node: AudioNode = {
      component: "AudioPlayer",
      id: "audio-1",
      url: "audio.mp3",
    };
    const props = { node, theme: "noir" } as unknown as ComponentRendererProps;

    render(<AudioPlayer {...props} />);
    const audio = document.querySelector("audio");
    expect(audio).toBeInTheDocument();
    expect(audio).toHaveAttribute("src", "audio.mp3");
    expect(audio).toHaveAttribute("controls");
  });

  it("renders description if provided", () => {
    const node: AudioNode = {
      component: "AudioPlayer",
      id: "audio-2",
      url: "audio.mp3",
      description: "Test Audio",
    };
    const props = { node, theme: "noir" } as unknown as ComponentRendererProps;

    render(<AudioPlayer {...props} />);
    expect(screen.getByText("Test Audio")).toBeInTheDocument();
  });
});
