import "server-only";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export type AIProviderInstance =
  | ReturnType<typeof createOpenAI>
  | ReturnType<typeof createAnthropic>
  | ReturnType<typeof createGoogleGenerativeAI>
  | null;

interface AuthConfig {
  openai?: string | { access: string };
  anthropic?: string | { access: string };
  google?: string | { access: string };
}

let cachedAuthConfig: AuthConfig | null = null;
let authConfigLoaded = false;

/** @internal Reset auth config cache (for testing only) */
export function _resetAuthCache(): void {
  cachedAuthConfig = null;
  authConfigLoaded = false;
}

async function loadAuthConfig(): Promise<AuthConfig> {
  if (authConfigLoaded) return cachedAuthConfig ?? {};
  const home = os.homedir();
  const authPath = path.join(home, ".local/share/opencode/auth.json");
  try {
    const data = await fs.readFile(authPath, "utf-8");
    cachedAuthConfig = JSON.parse(data) as AuthConfig;
  } catch {
    cachedAuthConfig = {};
  }
  authConfigLoaded = true;
  return cachedAuthConfig ?? {};
}

function loadAuthConfigSync(): AuthConfig {
  if (authConfigLoaded) return cachedAuthConfig ?? {};
  const home = os.homedir();
  const authPath = path.join(home, ".local/share/opencode/auth.json");
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fsSync = require("fs") as typeof import("fs");
    if (fsSync.existsSync(authPath)) {
      cachedAuthConfig = JSON.parse(fsSync.readFileSync(authPath, "utf-8")) as AuthConfig;
    }
  } catch {
    cachedAuthConfig = {};
  }
  authConfigLoaded = true;
  return cachedAuthConfig ?? {};
}

function resolveKey(
  config: AuthConfig,
  provider: "openai" | "anthropic" | "google"
): string | undefined {
  const entry = config[provider];
  if (!entry) return undefined;
  return typeof entry === "string" ? entry : entry.access;
}

export type ProviderType = "openai" | "anthropic" | "google" | "openai-compatible" | "mock";

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
export function getProviderWithOverrides(override?: ModelOverride): ProviderResult {
  if (!override || override.provider === "auto" || !override.provider) {
    const result = getProvider();
    if (override?.model && result.type !== "mock") {
      return { ...result, model: override.model };
    }
    return result;
  }

  const config = loadAuthConfigSync();

  switch (override.provider) {
    case "openai":
    case "openai-compatible": {
      const baseUrl = process.env.OPENAI_BASE_URL;
      const apiKey = process.env.OPENAI_API_KEY || resolveKey(config, "openai");

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
      const apiKey = process.env.ANTHROPIC_API_KEY || resolveKey(config, "anthropic");

      if (!apiKey) {
        throw new Error("Anthropic API key not found");
      }

      return {
        provider: createAnthropic({ apiKey }),
        model: override.model || process.env.AI_MODEL || "claude-3-5-sonnet-latest",
        type: "anthropic",
      };
    }

    case "google": {
      const apiKey =
        process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
        process.env.GEMINI_API_KEY ||
        resolveKey(config, "google");

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

/** Preload auth config asynchronously (call at app startup) */
export { loadAuthConfig as preloadAuthConfig };

export function getProvider(): ProviderResult {
  const config = loadAuthConfigSync();

  // 1. Check OpenAI Compatible (Prioritize Custom Proxy)
  const openAIBaseUrl = process.env.OPENAI_BASE_URL;
  if (openAIBaseUrl) {
    const compatKey = process.env.OPENAI_API_KEY || resolveKey(config, "openai");

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
  const openAIKey = process.env.OPENAI_API_KEY || resolveKey(config, "openai");
  if (openAIKey) {
    return {
      provider: createOpenAI({ apiKey: openAIKey }),
      model: process.env.AI_MODEL || "gpt-4o",
      type: "openai",
    };
  }

  // 3. Check Anthropic (Env or Config)
  const anthropicKey = process.env.ANTHROPIC_API_KEY || resolveKey(config, "anthropic");
  if (anthropicKey) {
    return {
      provider: createAnthropic({ apiKey: anthropicKey }),
      model: process.env.AI_MODEL || "claude-3-5-sonnet-latest",
      type: "anthropic",
    };
  }

  // 4. Check Google/Gemini (Env or Config)
  const googleKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    resolveKey(config, "google");
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
