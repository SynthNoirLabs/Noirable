export interface ModelCapabilities {
  chat: boolean;
  vision: boolean;
  imageGen: boolean;
  imageGenMethod?: "generateImage" | "generateText";
  streaming: boolean;
  tools: boolean;
  contextWindow?: number;
  maxOutput?: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: "openai" | "anthropic" | "google";
  capabilities: ModelCapabilities;
}

export const MODEL_REGISTRY: Record<string, ModelInfo> = {
  "gpt-5.2": {
    id: "gpt-5.2",
    name: "GPT 5.2",
    provider: "openai",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
      contextWindow: 272000,
      maxOutput: 128000,
    },
  },
  "gpt-5.2-mini": {
    id: "gpt-5.2-mini",
    name: "GPT 5.2 Mini",
    provider: "openai",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
      contextWindow: 128000,
      maxOutput: 64000,
    },
  },
  "gpt-5": {
    id: "gpt-5",
    name: "GPT 5",
    provider: "openai",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
      contextWindow: 128000,
      maxOutput: 32000,
    },
  },
  o3: {
    id: "o3",
    name: "O3",
    provider: "openai",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
      contextWindow: 200000,
      maxOutput: 100000,
    },
  },
  "o4-mini": {
    id: "o4-mini",
    name: "O4 Mini",
    provider: "openai",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
      contextWindow: 128000,
      maxOutput: 64000,
    },
  },
  "gpt-4o": {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
      contextWindow: 128000,
      maxOutput: 16384,
    },
  },
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
      contextWindow: 128000,
      maxOutput: 16384,
    },
  },
  "gpt-image-1.5": {
    id: "gpt-image-1.5",
    name: "GPT Image 1.5",
    provider: "openai",
    capabilities: {
      chat: false,
      vision: true,
      imageGen: true,
      imageGenMethod: "generateImage",
      streaming: false,
      tools: false,
    },
  },
  "dall-e-3": {
    id: "dall-e-3",
    name: "DALL-E 3",
    provider: "openai",
    capabilities: {
      chat: false,
      vision: false,
      imageGen: true,
      imageGenMethod: "generateImage",
      streaming: false,
      tools: false,
    },
  },

  "claude-opus-4.5-20251201": {
    id: "claude-opus-4.5-20251201",
    name: "Claude Opus 4.5",
    provider: "anthropic",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
      contextWindow: 200000,
      maxOutput: 32000,
    },
  },
  "claude-sonnet-4-20250514": {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    provider: "anthropic",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
      contextWindow: 200000,
      maxOutput: 64000,
    },
  },
  "claude-3-5-haiku-latest": {
    id: "claude-3-5-haiku-latest",
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
      contextWindow: 200000,
      maxOutput: 8192,
    },
  },

  "gemini-3-pro-preview": {
    id: "gemini-3-pro-preview",
    name: "Gemini 3 Pro Preview",
    provider: "google",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
      contextWindow: 1048576,
      maxOutput: 65535,
    },
  },
  "gemini-3-flash-preview": {
    id: "gemini-3-flash-preview",
    name: "Gemini 3 Flash Preview",
    provider: "google",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
      contextWindow: 1048576,
      maxOutput: 65536,
    },
  },
  "gemini-2.5-flash": {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
      contextWindow: 1048576,
      maxOutput: 65536,
    },
  },
  "gemini-2.5-flash-lite": {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    provider: "google",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
      contextWindow: 1048576,
      maxOutput: 65536,
    },
  },
  "gemini-2.5-flash-image": {
    id: "gemini-2.5-flash-image",
    name: "Gemini 2.5 Flash Image",
    provider: "google",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: true,
      imageGenMethod: "generateText",
      streaming: true,
      tools: true,
      contextWindow: 1048576,
      maxOutput: 65536,
    },
  },
  "gemini-3-pro-image-preview": {
    id: "gemini-3-pro-image-preview",
    name: "Gemini 3 Pro Image Preview",
    provider: "google",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: true,
      imageGenMethod: "generateText",
      streaming: true,
      tools: true,
      contextWindow: 1048576,
      maxOutput: 65536,
    },
  },
  "imagen-4.0-generate-001": {
    id: "imagen-4.0-generate-001",
    name: "Imagen 4.0",
    provider: "google",
    capabilities: {
      chat: false,
      vision: false,
      imageGen: true,
      imageGenMethod: "generateImage",
      streaming: false,
      tools: false,
    },
  },
};

export function getModelInfo(modelId: string): ModelInfo | undefined {
  return MODEL_REGISTRY[modelId];
}

export function getModelsWithCapability(
  capability: keyof ModelCapabilities,
  value: boolean | string = true
): ModelInfo[] {
  return Object.values(MODEL_REGISTRY).filter((model) => {
    const cap = model.capabilities[capability];
    return cap === value;
  });
}

export function getImageGenerationModels(): ModelInfo[] {
  return getModelsWithCapability("imageGen", true);
}

export function getChatModels(): ModelInfo[] {
  return getModelsWithCapability("chat", true);
}

export function getVisionModels(): ModelInfo[] {
  return getModelsWithCapability("vision", true);
}

export function canGenerateImages(modelId: string): boolean {
  const model = getModelInfo(modelId);
  return model?.capabilities.imageGen ?? false;
}

export function getImageGenMethod(modelId: string): "generateImage" | "generateText" | undefined {
  const model = getModelInfo(modelId);
  return model?.capabilities.imageGenMethod;
}

export function getModelsByProvider(provider: "openai" | "anthropic" | "google"): ModelInfo[] {
  return Object.values(MODEL_REGISTRY).filter((model) => model.provider === provider);
}

// Re-exported types and constants previously in models.ts (now consolidated here)
export type AIProviderType = "openai" | "anthropic" | "google" | "openai-compatible" | "auto";

function getAvailableModelIds(provider: "openai" | "anthropic" | "google"): string[] {
  return getModelsByProvider(provider)
    .filter((m) => m.capabilities.chat)
    .map((m) => m.id);
}

export const AVAILABLE_MODELS: Record<AIProviderType, string[]> = {
  auto: [],
  openai: getAvailableModelIds("openai"),
  anthropic: getAvailableModelIds("anthropic"),
  google: getAvailableModelIds("google"),
  "openai-compatible": [],
};
