export type AIProviderType = "openai" | "anthropic" | "google" | "openai-compatible" | "auto";

export interface ModelCapabilities {
  chat: boolean;
  vision: boolean;
  imageGen: boolean;
  streaming: boolean;
  tools: boolean;
}

export interface ModelDefinition {
  id: string;
  name: string;
  provider: "openai" | "anthropic" | "google";
  capabilities: ModelCapabilities;
}

export const MODELS: ModelDefinition[] = [
  {
    id: "gpt-5.2",
    name: "GPT 5.2",
    provider: "openai",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
    },
  },
  {
    id: "gpt-5.2-mini",
    name: "GPT 5.2 Mini",
    provider: "openai",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
    },
  },
  {
    id: "gpt-5",
    name: "GPT 5",
    provider: "openai",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
    },
  },
  {
    id: "o3",
    name: "O3",
    provider: "openai",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
    },
  },
  {
    id: "o4-mini",
    name: "O4 Mini",
    provider: "openai",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
    },
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
    },
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
    },
  },
  {
    id: "claude-opus-4.5-20251201",
    name: "Claude Opus 4.5",
    provider: "anthropic",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
    },
  },
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    provider: "anthropic",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
    },
  },
  {
    id: "claude-3-5-haiku-latest",
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
    },
  },
  {
    id: "gemini-3-pro-preview",
    name: "Gemini 3 Pro Preview",
    provider: "google",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
    },
  },
  {
    id: "gemini-3-flash-preview",
    name: "Gemini 3 Flash Preview",
    provider: "google",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
    },
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
    },
  },
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    provider: "google",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
    },
  },
];

export function getModelsByProvider(provider: AIProviderType): ModelDefinition[] {
  if (provider === "auto" || provider === "openai-compatible") return [];
  return MODELS.filter((m) => m.provider === provider);
}

export function getChatModels(): ModelDefinition[] {
  return MODELS.filter((m) => m.capabilities.chat);
}

export function getAvailableModelIds(provider: AIProviderType): string[] {
  return getModelsByProvider(provider).map((m) => m.id);
}

export const AVAILABLE_MODELS: Record<AIProviderType, string[]> = {
  auto: [],
  openai: getAvailableModelIds("openai"),
  anthropic: getAvailableModelIds("anthropic"),
  google: getAvailableModelIds("google"),
  "openai-compatible": [],
};
