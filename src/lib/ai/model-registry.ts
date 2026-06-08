export interface ModelCapabilities {
  chat: boolean;
  vision: boolean;
  imageGen: boolean;
  imageGenMethod?: "generateImage" | "generateText";
  /** Long-running text→video generation (Veo). On-demand only, never bundled. */
  videoGen?: boolean;
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
  "gpt-5.5": {
    id: "gpt-5.5",
    name: "GPT 5.5",
    provider: "openai",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
      contextWindow: 1000000,
      maxOutput: 128000,
    },
  },
  "gpt-5.4-mini": {
    id: "gpt-5.4-mini",
    name: "GPT 5.4 Mini",
    provider: "openai",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
      contextWindow: 400000,
      maxOutput: 128000,
    },
  },
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

  "claude-opus-4-8": {
    id: "claude-opus-4-8",
    name: "Claude Opus 4.8",
    provider: "anthropic",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
      contextWindow: 1000000,
      maxOutput: 128000,
    },
  },
  "claude-sonnet-4-6": {
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    provider: "anthropic",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: false,
      streaming: true,
      tools: true,
      contextWindow: 1000000,
      maxOutput: 64000,
    },
  },
  "claude-haiku-4-5-20251001": {
    id: "claude-haiku-4-5-20251001",
    name: "Claude Haiku 4.5",
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

  "gemini-3.5-flash": {
    id: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
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
  "gemini-3.1-pro": {
    id: "gemini-3.1-pro",
    name: "Gemini 3.1 Pro",
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
  "gemini-3-flash": {
    id: "gemini-3-flash",
    name: "Gemini 3 Flash",
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
  "gemini-3-pro-image": {
    id: "gemini-3-pro-image",
    name: "Gemini 3 Pro Image (Nano Banana Pro)",
    provider: "google",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: true,
      imageGenMethod: "generateText",
      streaming: true,
      tools: true,
      contextWindow: 65536,
      maxOutput: 32768,
    },
  },
  "gemini-3.1-flash-image": {
    id: "gemini-3.1-flash-image",
    name: "Gemini 3.1 Flash Image (Nano Banana 2)",
    provider: "google",
    capabilities: {
      chat: true,
      vision: true,
      imageGen: true,
      imageGenMethod: "generateText",
      streaming: true,
      tools: true,
      contextWindow: 131072,
      maxOutput: 32768,
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
  // Veo Fast — long-running text→video. On-demand ONLY (Video Lab + explicit
  // per-component button); deliberately never invoked during UI/chat generation
  // the way images are, because each clip is comparatively expensive. Model ids
  // here MUST match Google's actual Veo ids (the @ai-sdk/google VideoModelId
  // union): the current fast model is `veo-3.1-fast-generate-preview` (the
  // default, PREVIEW-suffixed — there is no `veo-3.1-fast-generate-001`);
  // `veo-3.0-fast-generate-001` is the stable fallback.
  "veo-3.1-fast-generate-preview": {
    id: "veo-3.1-fast-generate-preview",
    name: "Veo 3.1 Fast",
    provider: "google",
    capabilities: {
      chat: false,
      vision: false,
      imageGen: false,
      videoGen: true,
      streaming: false,
      tools: false,
    },
  },
  "veo-3.0-fast-generate-001": {
    id: "veo-3.0-fast-generate-001",
    name: "Veo 3 Fast (stable)",
    provider: "google",
    capabilities: {
      chat: false,
      vision: false,
      imageGen: false,
      videoGen: true,
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

export function getVideoGenerationModels(): ModelInfo[] {
  return getModelsWithCapability("videoGen", true);
}

export function canGenerateVideos(modelId: string): boolean {
  const model = getModelInfo(modelId);
  return model?.capabilities.videoGen ?? false;
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
