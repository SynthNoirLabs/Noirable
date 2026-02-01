import { describe, it, expect } from "vitest";
import {
  // Layout components
  rowSchema,
  columnSchema,
  listSchema,
  cardSchema,
  tabsSchema,
  dividerSchema,
  modalSchema,
  // Content components
  textSchema,
  imageSchema,
  iconSchema,
  videoSchema,
  audioPlayerSchema,
  // Input components
  buttonSchema,
  checkBoxSchema,
  textFieldSchema,
  dateTimeInputSchema,
  choicePickerSchema,
  sliderSchema,
  // Union type
  componentSchema,
  // Types
  type A2UIComponent,
} from "./components";

// =============================================================================
// Layout Components (7)
// =============================================================================

describe("Row", () => {
  it("validates a row with static children", () => {
    const result = rowSchema.safeParse({
      id: "toolbar",
      component: "Row",
      children: ["btn1", "btn2", "btn3"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.component).toBe("Row");
      expect(result.data.children).toEqual(["btn1", "btn2", "btn3"]);
    }
  });

  it("validates a row with template children", () => {
    const result = rowSchema.safeParse({
      id: "items-row",
      component: "Row",
      children: { componentId: "item-template", path: "/items" },
    });
    expect(result.success).toBe(true);
  });

  it("validates a row with justify and align", () => {
    const result = rowSchema.safeParse({
      id: "header",
      component: "Row",
      children: ["logo", "nav"],
      justify: "spaceBetween",
      align: "center",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.justify).toBe("spaceBetween");
      expect(result.data.align).toBe("center");
    }
  });

  it("rejects row without children", () => {
    const result = rowSchema.safeParse({
      id: "empty-row",
      component: "Row",
    });
    expect(result.success).toBe(false);
  });
});

describe("Column", () => {
  it("validates a column with static children", () => {
    const result = columnSchema.safeParse({
      id: "main-content",
      component: "Column",
      children: ["header", "body", "footer"],
    });
    expect(result.success).toBe(true);
  });

  it("validates a column with justify and align", () => {
    const result = columnSchema.safeParse({
      id: "sidebar",
      component: "Column",
      children: ["menu", "profile"],
      justify: "start",
      align: "stretch",
    });
    expect(result.success).toBe(true);
  });

  it("rejects column without children", () => {
    const result = columnSchema.safeParse({
      id: "empty-col",
      component: "Column",
    });
    expect(result.success).toBe(false);
  });
});

describe("List", () => {
  it("validates a list with static children", () => {
    const result = listSchema.safeParse({
      id: "todo-list",
      component: "List",
      children: ["item1", "item2", "item3"],
    });
    expect(result.success).toBe(true);
  });

  it("validates a list with template children", () => {
    const result = listSchema.safeParse({
      id: "messages",
      component: "List",
      children: { componentId: "message-item", path: "/messages" },
    });
    expect(result.success).toBe(true);
  });

  it("validates a list with direction and align", () => {
    const result = listSchema.safeParse({
      id: "horizontal-list",
      component: "List",
      children: ["a", "b"],
      direction: "horizontal",
      align: "center",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.direction).toBe("horizontal");
    }
  });

  it("rejects list without children", () => {
    const result = listSchema.safeParse({
      id: "empty-list",
      component: "List",
    });
    expect(result.success).toBe(false);
  });
});

describe("Card", () => {
  it("validates a card with child", () => {
    const result = cardSchema.safeParse({
      id: "profile-card",
      component: "Card",
      child: "card-content",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.child).toBe("card-content");
    }
  });

  it("rejects card without child", () => {
    const result = cardSchema.safeParse({
      id: "empty-card",
      component: "Card",
    });
    expect(result.success).toBe(false);
  });
});

describe("Tabs", () => {
  it("validates tabs with tab items", () => {
    const result = tabsSchema.safeParse({
      id: "settings-tabs",
      component: "Tabs",
      tabs: [
        { title: "General", child: "general-settings" },
        { title: "Privacy", child: "privacy-settings" },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tabs).toHaveLength(2);
    }
  });

  it("validates tabs with dynamic titles", () => {
    const result = tabsSchema.safeParse({
      id: "dynamic-tabs",
      component: "Tabs",
      tabs: [{ title: { path: "/tab1/title" }, child: "tab1-content" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects tabs without tabs array", () => {
    const result = tabsSchema.safeParse({
      id: "empty-tabs",
      component: "Tabs",
    });
    expect(result.success).toBe(false);
  });
});

describe("Divider", () => {
  it("validates a horizontal divider", () => {
    const result = dividerSchema.safeParse({
      id: "sep1",
      component: "Divider",
      axis: "horizontal",
    });
    expect(result.success).toBe(true);
  });

  it("validates a vertical divider", () => {
    const result = dividerSchema.safeParse({
      id: "sep2",
      component: "Divider",
      axis: "vertical",
    });
    expect(result.success).toBe(true);
  });

  it("validates divider without axis (defaults allowed)", () => {
    const result = dividerSchema.safeParse({
      id: "sep3",
      component: "Divider",
    });
    expect(result.success).toBe(true);
  });
});

describe("Modal", () => {
  it("validates a modal with trigger and content", () => {
    const result = modalSchema.safeParse({
      id: "confirm-modal",
      component: "Modal",
      trigger: "open-btn",
      content: "modal-content",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.trigger).toBe("open-btn");
      expect(result.data.content).toBe("modal-content");
    }
  });

  it("rejects modal without trigger", () => {
    const result = modalSchema.safeParse({
      id: "broken-modal",
      component: "Modal",
      content: "modal-content",
    });
    expect(result.success).toBe(false);
  });

  it("rejects modal without content", () => {
    const result = modalSchema.safeParse({
      id: "broken-modal",
      component: "Modal",
      trigger: "open-btn",
    });
    expect(result.success).toBe(false);
  });
});

// =============================================================================
// Content Components (5)
// =============================================================================

describe("Text", () => {
  it("validates text with string content", () => {
    const result = textSchema.safeParse({
      id: "title",
      component: "Text",
      text: "Welcome to A2UI",
    });
    expect(result.success).toBe(true);
  });

  it("validates text with data binding", () => {
    const result = textSchema.safeParse({
      id: "username",
      component: "Text",
      text: { path: "/user/name" },
    });
    expect(result.success).toBe(true);
  });

  it("validates text with variant", () => {
    const result = textSchema.safeParse({
      id: "heading",
      component: "Text",
      text: "Main Title",
      variant: "h1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.variant).toBe("h1");
    }
  });

  it("validates all text variants", () => {
    const variants = ["h1", "h2", "h3", "h4", "h5", "caption", "body"];
    for (const variant of variants) {
      const result = textSchema.safeParse({
        id: `text-${variant}`,
        component: "Text",
        text: "Test",
        variant,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects text without text property", () => {
    const result = textSchema.safeParse({
      id: "empty-text",
      component: "Text",
    });
    expect(result.success).toBe(false);
  });
});

describe("Image", () => {
  it("validates image with URL", () => {
    const result = imageSchema.safeParse({
      id: "logo",
      component: "Image",
      url: "https://example.com/logo.png",
    });
    expect(result.success).toBe(true);
  });

  it("validates image with data binding", () => {
    const result = imageSchema.safeParse({
      id: "profile-pic",
      component: "Image",
      url: { path: "/user/avatarUrl" },
    });
    expect(result.success).toBe(true);
  });

  it("validates image with fit property", () => {
    const result = imageSchema.safeParse({
      id: "banner",
      component: "Image",
      url: "https://example.com/banner.jpg",
      fit: "cover",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fit).toBe("cover");
    }
  });

  it("validates all image fit options", () => {
    const fits = ["contain", "cover", "fill", "none", "scale-down"];
    for (const fit of fits) {
      const result = imageSchema.safeParse({
        id: `img-${fit}`,
        component: "Image",
        url: "https://example.com/test.png",
        fit,
      });
      expect(result.success).toBe(true);
    }
  });

  it("validates all image variants", () => {
    const variants = ["icon", "avatar", "smallFeature", "mediumFeature", "largeFeature", "header"];
    for (const variant of variants) {
      const result = imageSchema.safeParse({
        id: `img-${variant}`,
        component: "Image",
        url: "https://example.com/test.png",
        variant,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects image without url", () => {
    const result = imageSchema.safeParse({
      id: "broken-img",
      component: "Image",
    });
    expect(result.success).toBe(false);
  });
});

describe("Icon", () => {
  it("validates icon with name", () => {
    const result = iconSchema.safeParse({
      id: "check-icon",
      component: "Icon",
      name: "check",
    });
    expect(result.success).toBe(true);
  });

  it("validates icon with data binding", () => {
    const result = iconSchema.safeParse({
      id: "dynamic-icon",
      component: "Icon",
      name: { path: "/icons/current" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects icon without name", () => {
    const result = iconSchema.safeParse({
      id: "broken-icon",
      component: "Icon",
    });
    expect(result.success).toBe(false);
  });
});

describe("Video", () => {
  it("validates video with URL", () => {
    const result = videoSchema.safeParse({
      id: "intro-video",
      component: "Video",
      url: "https://example.com/intro.mp4",
    });
    expect(result.success).toBe(true);
  });

  it("validates video with data binding", () => {
    const result = videoSchema.safeParse({
      id: "dynamic-video",
      component: "Video",
      url: { path: "/media/videoUrl" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects video without url", () => {
    const result = videoSchema.safeParse({
      id: "broken-video",
      component: "Video",
    });
    expect(result.success).toBe(false);
  });
});

describe("AudioPlayer", () => {
  it("validates audio player with URL", () => {
    const result = audioPlayerSchema.safeParse({
      id: "podcast",
      component: "AudioPlayer",
      url: "https://example.com/episode.mp3",
    });
    expect(result.success).toBe(true);
  });

  it("validates audio player with description", () => {
    const result = audioPlayerSchema.safeParse({
      id: "music-player",
      component: "AudioPlayer",
      url: "https://example.com/track.mp3",
      description: "Jazz Collection - Track 1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("Jazz Collection - Track 1");
    }
  });

  it("rejects audio player without url", () => {
    const result = audioPlayerSchema.safeParse({
      id: "broken-audio",
      component: "AudioPlayer",
    });
    expect(result.success).toBe(false);
  });
});

// =============================================================================
// Input Components (6)
// =============================================================================

describe("Button", () => {
  it("validates button with child and action", () => {
    const result = buttonSchema.safeParse({
      id: "submit-btn",
      component: "Button",
      child: "submit-text",
      action: { event: { name: "submit_form" } },
    });
    expect(result.success).toBe(true);
  });

  it("validates button with variant", () => {
    const result = buttonSchema.safeParse({
      id: "primary-btn",
      component: "Button",
      child: "btn-label",
      variant: "primary",
      action: { event: { name: "click" } },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.variant).toBe("primary");
    }
  });

  it("validates button with local action", () => {
    const result = buttonSchema.safeParse({
      id: "url-btn",
      component: "Button",
      child: "link-text",
      action: { functionCall: { call: "openUrl", args: { url: "https://example.com" } } },
    });
    expect(result.success).toBe(true);
  });

  it("validates button with event context", () => {
    const result = buttonSchema.safeParse({
      id: "ctx-btn",
      component: "Button",
      child: "btn-text",
      action: {
        event: {
          name: "delete_item",
          context: { itemId: { path: "/selected/id" } },
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects button without child", () => {
    const result = buttonSchema.safeParse({
      id: "broken-btn",
      component: "Button",
      action: { event: { name: "click" } },
    });
    expect(result.success).toBe(false);
  });

  it("rejects button without action", () => {
    const result = buttonSchema.safeParse({
      id: "broken-btn",
      component: "Button",
      child: "btn-label",
    });
    expect(result.success).toBe(false);
  });
});

describe("CheckBox", () => {
  it("validates checkbox with label and value", () => {
    const result = checkBoxSchema.safeParse({
      id: "terms-checkbox",
      component: "CheckBox",
      label: "I agree to the terms",
      value: { path: "/form/agreed" },
    });
    expect(result.success).toBe(true);
  });

  it("validates checkbox with literal boolean value", () => {
    const result = checkBoxSchema.safeParse({
      id: "default-checkbox",
      component: "CheckBox",
      label: "Subscribe to newsletter",
      value: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects checkbox without label", () => {
    const result = checkBoxSchema.safeParse({
      id: "broken-checkbox",
      component: "CheckBox",
      value: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects checkbox without value", () => {
    const result = checkBoxSchema.safeParse({
      id: "broken-checkbox",
      component: "CheckBox",
      label: "Test",
    });
    expect(result.success).toBe(false);
  });
});

describe("TextField", () => {
  it("validates text field with label", () => {
    const result = textFieldSchema.safeParse({
      id: "email-input",
      component: "TextField",
      label: "Email Address",
    });
    expect(result.success).toBe(true);
  });

  it("validates text field with value binding", () => {
    const result = textFieldSchema.safeParse({
      id: "name-input",
      component: "TextField",
      label: "Name",
      value: { path: "/user/name" },
    });
    expect(result.success).toBe(true);
  });

  it("validates text field with variant", () => {
    const result = textFieldSchema.safeParse({
      id: "password-input",
      component: "TextField",
      label: "Password",
      variant: "obscured",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.variant).toBe("obscured");
    }
  });

  it("validates all text field variants", () => {
    const variants = ["longText", "number", "shortText", "obscured"];
    for (const variant of variants) {
      const result = textFieldSchema.safeParse({
        id: `field-${variant}`,
        component: "TextField",
        label: "Test",
        variant,
      });
      expect(result.success).toBe(true);
    }
  });

  it("validates text field with checks", () => {
    const result = textFieldSchema.safeParse({
      id: "email-field",
      component: "TextField",
      label: "Email",
      checks: [
        {
          call: "required",
          args: { value: { path: "/email" } },
          message: "Email is required",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects text field without label", () => {
    const result = textFieldSchema.safeParse({
      id: "broken-field",
      component: "TextField",
    });
    expect(result.success).toBe(false);
  });
});

describe("DateTimeInput", () => {
  it("validates date time input with value", () => {
    const result = dateTimeInputSchema.safeParse({
      id: "appointment-picker",
      component: "DateTimeInput",
      value: { path: "/form/appointment" },
    });
    expect(result.success).toBe(true);
  });

  it("validates date time input with enableDate and enableTime", () => {
    const result = dateTimeInputSchema.safeParse({
      id: "datetime-picker",
      component: "DateTimeInput",
      value: "",
      enableDate: true,
      enableTime: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.enableDate).toBe(true);
      expect(result.data.enableTime).toBe(true);
    }
  });

  it("validates date only picker", () => {
    const result = dateTimeInputSchema.safeParse({
      id: "date-picker",
      component: "DateTimeInput",
      value: "2025-01-15",
      enableDate: true,
      enableTime: false,
    });
    expect(result.success).toBe(true);
  });

  it("validates date time input with min/max", () => {
    const result = dateTimeInputSchema.safeParse({
      id: "bounded-picker",
      component: "DateTimeInput",
      value: "",
      min: "2025-01-01",
      max: "2025-12-31",
    });
    expect(result.success).toBe(true);
  });

  it("rejects date time input without value", () => {
    const result = dateTimeInputSchema.safeParse({
      id: "broken-picker",
      component: "DateTimeInput",
    });
    expect(result.success).toBe(false);
  });
});

describe("ChoicePicker", () => {
  it("validates choice picker with options and value", () => {
    const result = choicePickerSchema.safeParse({
      id: "pref-picker",
      component: "ChoicePicker",
      options: [
        { label: "Email", value: "email" },
        { label: "Phone", value: "phone" },
      ],
      value: ["email"],
    });
    expect(result.success).toBe(true);
  });

  it("validates choice picker with variant", () => {
    const result = choicePickerSchema.safeParse({
      id: "radio-picker",
      component: "ChoicePicker",
      variant: "mutuallyExclusive",
      options: [
        { label: "Option A", value: "a" },
        { label: "Option B", value: "b" },
      ],
      value: { path: "/form/selection" },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.variant).toBe("mutuallyExclusive");
    }
  });

  it("validates choice picker with label", () => {
    const result = choicePickerSchema.safeParse({
      id: "labeled-picker",
      component: "ChoicePicker",
      label: "Select your preference",
      options: [{ label: "Yes", value: "yes" }],
      value: [],
    });
    expect(result.success).toBe(true);
  });

  it("validates choice picker with dynamic option labels", () => {
    const result = choicePickerSchema.safeParse({
      id: "dynamic-picker",
      component: "ChoicePicker",
      options: [{ label: { path: "/options/0/label" }, value: "opt1" }],
      value: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects choice picker without options", () => {
    const result = choicePickerSchema.safeParse({
      id: "broken-picker",
      component: "ChoicePicker",
      value: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects choice picker without value", () => {
    const result = choicePickerSchema.safeParse({
      id: "broken-picker",
      component: "ChoicePicker",
      options: [{ label: "Test", value: "test" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("Slider", () => {
  it("validates slider with min, max, and value", () => {
    const result = sliderSchema.safeParse({
      id: "volume-slider",
      component: "Slider",
      min: 0,
      max: 100,
      value: 50,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.min).toBe(0);
      expect(result.data.max).toBe(100);
      expect(result.data.value).toBe(50);
    }
  });

  it("validates slider with label", () => {
    const result = sliderSchema.safeParse({
      id: "brightness-slider",
      component: "Slider",
      label: "Brightness",
      min: 0,
      max: 100,
      value: { path: "/settings/brightness" },
    });
    expect(result.success).toBe(true);
  });

  it("validates slider with data binding value", () => {
    const result = sliderSchema.safeParse({
      id: "dynamic-slider",
      component: "Slider",
      min: 0,
      max: 100,
      value: { path: "/form/rating" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects slider without min", () => {
    const result = sliderSchema.safeParse({
      id: "broken-slider",
      component: "Slider",
      max: 100,
      value: 50,
    });
    expect(result.success).toBe(false);
  });

  it("rejects slider without max", () => {
    const result = sliderSchema.safeParse({
      id: "broken-slider",
      component: "Slider",
      min: 0,
      value: 50,
    });
    expect(result.success).toBe(false);
  });

  it("rejects slider without value", () => {
    const result = sliderSchema.safeParse({
      id: "broken-slider",
      component: "Slider",
      min: 0,
      max: 100,
    });
    expect(result.success).toBe(false);
  });
});

// =============================================================================
// Discriminated Union
// =============================================================================

describe("componentSchema (discriminated union)", () => {
  it("validates all 18 component types", () => {
    const components = [
      // Layout
      { id: "row", component: "Row", children: ["a"] },
      { id: "col", component: "Column", children: ["a"] },
      { id: "list", component: "List", children: ["a"] },
      { id: "card", component: "Card", child: "content" },
      { id: "tabs", component: "Tabs", tabs: [{ title: "T1", child: "c1" }] },
      { id: "div", component: "Divider" },
      { id: "modal", component: "Modal", trigger: "btn", content: "c" },
      // Content
      { id: "text", component: "Text", text: "Hello" },
      { id: "img", component: "Image", url: "https://example.com/a.png" },
      { id: "icon", component: "Icon", name: "check" },
      { id: "video", component: "Video", url: "https://example.com/v.mp4" },
      { id: "audio", component: "AudioPlayer", url: "https://example.com/a.mp3" },
      // Input
      { id: "btn", component: "Button", child: "lbl", action: { event: { name: "click" } } },
      { id: "chk", component: "CheckBox", label: "Agree", value: false },
      { id: "txt", component: "TextField", label: "Name" },
      { id: "dt", component: "DateTimeInput", value: "" },
      { id: "choice", component: "ChoicePicker", options: [{ label: "A", value: "a" }], value: [] },
      { id: "slider", component: "Slider", min: 0, max: 100, value: 50 },
    ];

    for (const comp of components) {
      const result = componentSchema.safeParse(comp);
      expect(result.success, `Failed for component: ${comp.component}`).toBe(true);
    }
  });

  it("rejects invalid component type", () => {
    const result = componentSchema.safeParse({
      id: "unknown",
      component: "NotAComponent",
      foo: "bar",
    });
    expect(result.success).toBe(false);
  });

  it("correctly narrows component type", () => {
    const textComponent = componentSchema.safeParse({
      id: "text",
      component: "Text",
      text: "Hello World",
    });

    expect(textComponent.success).toBe(true);
    if (textComponent.success) {
      const data = textComponent.data as A2UIComponent;
      if (data.component === "Text") {
        expect(data.text).toBe("Hello World");
      }
    }
  });
});

// =============================================================================
// Common Properties
// =============================================================================

describe("Common component properties", () => {
  it("validates component with weight", () => {
    const result = textSchema.safeParse({
      id: "weighted-text",
      component: "Text",
      text: "Flex child",
      weight: 2,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.weight).toBe(2);
    }
  });

  it("validates component with accessibility", () => {
    const result = buttonSchema.safeParse({
      id: "accessible-btn",
      component: "Button",
      child: "btn-text",
      action: { event: { name: "submit" } },
      accessibility: {
        label: "Submit form",
        description: "Submits the contact form",
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accessibility?.label).toBe("Submit form");
    }
  });
});
