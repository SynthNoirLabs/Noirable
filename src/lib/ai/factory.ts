import "server-only";
import fs from "fs";
import path from "path";
import os from "os";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AIProviderInstance = any; // Flexible for multiple SDK providers

export type ProviderType =
  | "openai"
  | "anthropic"
  | "google"
  | "openai-compatible"
  | "mock";

export interface ProviderResult {
  provider: AIProviderInstance;
  model: string;
  type: ProviderType;
}

export interface ModelOverride {
  provider?: "openai" | "anthropic" | "google" | "openai-compatible" | "auto";
  model?: string;
}

/**
 * Get AI provider with optional client-specified overrides.
 * Priority: override provider/model > env vars > auth.json > mock fallback
 */
export function getProviderWithOverrides(
  override?: ModelOverride,
): ProviderResult {
  if (!override || override.provider === "auto" || !override.provider) {
    const result = getProvider();
    if (override?.model && result.type !== "mock") {
      return { ...result, model: override.model };
    }
    return result;
  }

  const home = os.homedir();
  const authPath = path.join(home, ".local/share/opencode/auth.json");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let config: any = {};

  if (fs.existsSync(authPath)) {
    try {
      config = JSON.parse(fs.readFileSync(authPath, "utf-8"));
    } catch {
      console.warn("Failed to parse auth.json");
    }
  }

  switch (override.provider) {
    case "openai":
    case "openai-compatible": {
      const baseUrl = process.env.OPENAI_BASE_URL;
      let apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey && config.openai) {
        apiKey =
          typeof config.openai === "string"
            ? config.openai
            : config.openai.access;
      }

      if (!apiKey && !baseUrl) {
        throw new Error("OpenAI API key not found");
      }

      const providerOptions: { apiKey: string; baseURL?: string } = {
        apiKey: apiKey || "dummy",
      };
      if (baseUrl) {
        providerOptions.baseURL = baseUrl;
      }

      return {
        provider: createOpenAI(providerOptions),
        model: override.model || process.env.AI_MODEL || "gpt-4o",
        type: baseUrl ? "openai-compatible" : "openai",
      };
    }

    case "anthropic": {
      let apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey && config.anthropic) {
        apiKey =
          typeof config.anthropic === "string"
            ? config.anthropic
            : config.anthropic.access;
      }

      if (!apiKey) {
        throw new Error("Anthropic API key not found");
      }

      return {
        provider: createAnthropic({ apiKey }),
        model:
          override.model || process.env.AI_MODEL || "claude-3-5-sonnet-latest",
        type: "anthropic",
      };
    }

    case "google": {
      let apiKey =
        process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey && config.google) {
        apiKey =
          typeof config.google === "string"
            ? config.google
            : config.google.access;
      }

      if (!apiKey) {
        throw new Error("Google API key not found");
      }

      return {
        provider: createGoogleGenerativeAI({ apiKey }),
        model: override.model || process.env.AI_MODEL || "gemini-1.5-pro",
        type: "google",
      };
    }

    default:
      return getProvider();
  }
}

export function getProvider(): ProviderResult {
  const home = os.homedir();
  const authPath = path.join(home, ".local/share/opencode/auth.json");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let config: any = {};

  if (fs.existsSync(authPath)) {
    try {
      config = JSON.parse(fs.readFileSync(authPath, "utf-8"));
    } catch {
      console.warn("Failed to parse auth.json");
    }
  }

  // 1. Check OpenAI Compatible (Prioritize Custom Proxy)
  const openAIBaseUrl = process.env.OPENAI_BASE_URL;
  if (openAIBaseUrl) {
    // Check for a key, but default to 'dummy' if using a local proxy that doesn't need one
    let compatKey = process.env.OPENAI_API_KEY;
    if (!compatKey && config.openai) {
      compatKey =
        typeof config.openai === "string"
          ? config.openai
          : config.openai.access;
    }

    // Use standard OpenAI provider but with custom URL.
    // This often ensures better compatibility with tools than the generic 'openai-compatible' wrapper
    return {
      provider: createOpenAI({
        baseURL: openAIBaseUrl,
        apiKey: compatKey || "dummy",
      }),
      model: process.env.AI_MODEL || "gpt-5.2(medium)",
      type: "openai",
    };
  }

  // 2. Check OpenAI (Env or Config)
  let openAIKey = process.env.OPENAI_API_KEY;
  if (!openAIKey && config.openai) {
    openAIKey =
      typeof config.openai === "string" ? config.openai : config.openai.access;
  }

  if (openAIKey) {
    return {
      provider: createOpenAI({ apiKey: openAIKey }),
      model: process.env.AI_MODEL || "gpt-4o",
      type: "openai",
    };
  }

  // 3. Check Anthropic (Env or Config)
  let anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey && config.anthropic) {
    anthropicKey =
      typeof config.anthropic === "string"
        ? config.anthropic
        : config.anthropic.access;
  }

  if (anthropicKey) {
    return {
      provider: createAnthropic({ apiKey: anthropicKey }),
      model: process.env.AI_MODEL || "claude-3-5-sonnet-latest",
      type: "anthropic",
    };
  }

  // 4. Check Google/Gemini (Env or Config)
  let googleKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!googleKey && config.google) {
    googleKey =
      typeof config.google === "string" ? config.google : config.google.access;
  }

  if (googleKey) {
    return {
      provider: createGoogleGenerativeAI({ apiKey: googleKey }),
      model: process.env.AI_MODEL || "gemini-1.5-pro",
      type: "google",
    };
  }

  // 5. Fallback to Mock in Dev
  if (process.env.NODE_ENV === "development") {
    return { provider: null, model: "mock", type: "mock" };
  }

  throw new Error("No valid API key found for OpenAI, Anthropic, or Google.");
}
