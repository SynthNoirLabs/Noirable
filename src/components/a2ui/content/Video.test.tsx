import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Video } from "./Video";
import { ComponentRendererProps } from "../registry";
import { Video as VideoNode } from "@/lib/a2ui/catalog/components";

describe("Video Component", () => {
  it("renders video element with src", () => {
    const node: VideoNode = {
      component: "Video",
      id: "vid-1",
      url: "video.mp4",
    };
    const props = { node, theme: "noir" } as unknown as ComponentRendererProps;

    render(<Video {...props} />);
    const video = screen.getByTestId("video-element"); // We might need data-testid or selector
    // Or select by tag name
    // const video = document.querySelector('video');
    expect(video).toHaveAttribute("src", "video.mp4");
    expect(video).toHaveAttribute("controls");
  });

  it("applies styles", () => {
    const node: Record<string, unknown> = {
      component: "Video",
      id: "vid-2",
      url: "video.mp4",
      style: {
        className: "custom-video",
      },
    };
    const props = { node, theme: "noir" } as unknown as ComponentRendererProps;

    render(<Video {...props} />);
    const videoContainer = screen.getByTestId("video-container");
    expect(videoContainer.className).toContain("custom-video");
  });
});
