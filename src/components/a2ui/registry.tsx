import React from "react";
import type { A2UIInput } from "@/lib/protocol/schema";
import { Text, Image, Icon, Video, AudioPlayer } from "./content";
import { Button, CheckBox, TextField, DateTimeInput, ChoicePicker, Slider } from "./input";

export const A2UI_TYPES = [
  "text",
  "card",
  "container",
  "row",
  "column",
  "grid",
  "heading",
  "paragraph",
  "callout",
  "badge",
  "divider",
  "modal",
  "list",
  "table",
  "stat",
  "tabs",
  "image",
  "input",
  "textarea",
  "select",
  "checkbox",
  "button",
  // v0.9 additions
  "Text",
  "Image",
  "Icon",
  "Video",
  "AudioPlayer",
  // v0.9 Input additions
  "Button",
  "CheckBox",
  "TextField",
  "DateTimeInput",
  "ChoicePicker",
  "Slider",
] as const;

export type A2UIType = (typeof A2UI_TYPES)[number];

export interface ComponentRendererProps<T = A2UIInput> {
  node: T;
  theme?: "noir" | "standard";
}

export type ComponentRenderer = React.FC<ComponentRendererProps<A2UIInput>>;

export const FallbackRenderer: ComponentRenderer = ({ node }) => {
  return (
    <div className="bg-noir-red/10 border-2 border-noir-red p-4 rounded-sm animate-pulse max-w-md">
      <h3 className="text-noir-red font-typewriter font-bold mb-2">REDACTED</h3>
      <p className="text-noir-red/80 font-mono text-xs">
        UNKNOWN ARTIFACT DETECTED: {(node as A2UIInput)?.type || "UNDEFINED"}
        <br />
        DATA CORRUPTION LEVEL: CRITICAL.
      </p>
    </div>
  );
};
FallbackRenderer.displayName = "FallbackRenderer";

// Stub for components not yet implemented
const StubRenderer: ComponentRenderer = ({ node }) => {
  return (
    <div className="border border-dashed border-noir-gray/40 p-2 text-noir-paper/50 text-xs font-mono">
      [{node.type}] PENDING IMPLEMENTATION
    </div>
  );
};
StubRenderer.displayName = "StubRenderer";

const registry = new Map<string, ComponentRenderer>();

// Register all types to Stub initially
A2UI_TYPES.forEach((type) => {
  registry.set(type, StubRenderer);
});

// Register implemented components
// v0.9 Content
registerComponent("Text", Text);
registerComponent("Image", Image);
registerComponent("Icon", Icon);
registerComponent("Video", Video);
registerComponent("AudioPlayer", AudioPlayer);

// v0.9 Input
// Cast to ComponentRenderer because input components use types from catalog/components
// which are not yet in A2UIInput union in schema.ts
registerComponent("Button", Button as unknown as ComponentRenderer);
registerComponent("CheckBox", CheckBox as unknown as ComponentRenderer);
registerComponent("TextField", TextField as unknown as ComponentRenderer);
registerComponent("DateTimeInput", DateTimeInput as unknown as ComponentRenderer);
registerComponent("ChoicePicker", ChoicePicker as unknown as ComponentRenderer);
registerComponent("Slider", Slider as unknown as ComponentRenderer);

// v0.8 / Legacy fallbacks
registerComponent("text", Text);
registerComponent("image", Image);

export function registerComponent(type: string, component: ComponentRenderer) {
  registry.set(type, component);
}

export function getComponent(type: string): ComponentRenderer {
  return registry.get(type) ?? FallbackRenderer;
}
