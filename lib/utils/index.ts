//  lib/utils/index.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { createOpenAI } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { CoreMessage, LanguageModelV1 } from 'ai';

// Logging module
const log = {
  info: (message: string) => console.log(`[INFO] ${message}`),
  warn: (message: string) => console.warn(`[WARN] ${message}`),
  error: (message: string) => console.error(`[ERROR] ${message}`),
  debug: (message: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`);
    }
  }
};

// Configuration module
const config = {
  openai: {
    apiBase: () => process.env.OPENAI_API_BASE,
    apiKey: () => process.env.OPENAI_API_KEY,
    model: () => process.env.OPENAI_API_MODEL || 'gpt-4o'
  },
  google: {
    apiKey: () => process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    model: () => 'gemini-1.5-pro-002'
  },
  anthropic: {
    apiKey: () => process.env.ANTHROPIC_API_KEY,
    model: () => 'claude-3-5-sonnet-20240620'
  }
};

// Utility functions
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') {
    throw new TypeError('URL must be a string');
  }
  return url.replace(/\s+/g, '%20');
}

// AI Provider module
const aiProviders = {
  google: {
    check: () => !!config.google.apiKey(),
    get: () => google(config.google.model())
  },
  anthropic: {
    check: () => !!config.anthropic.apiKey(),
    get: () => anthropic(config.anthropic.model())
  },
  openai: {
    check: () => !!config.openai.apiKey(),
    get: () => {
      const apiKey = config.openai.apiKey();
      const baseURL = config.openai.apiBase();
      const model = config.openai.model();
      if (!apiKey) {
        throw new Error('OpenAI configuration is incomplete');
      }
      return createOpenAI({ apiKey, baseURL, organization: '' }).chat(model);
    }
  }
};

// AI Model selection
export function getModel(): LanguageModelV1 {
  const providerOrder = ['google', 'anthropic', 'openai'] as const;

  for (const providerName of providerOrder) {
    const provider = aiProviders[providerName];
    if (provider.check()) {
      try {
        return provider.get();
      } catch (error) {
        log.warn(`Failed to initialize ${providerName} model: ${error}`);
      }
    }
  }

  throw new Error('No AI provider available. Please configure at least one provider.');
}

// Message transformation
export function transformToolMessages(messages: CoreMessage[]): CoreMessage[] {
  return messages.map(message =>
      message.role === 'tool'
          ? {
            ...message,
            role: 'assistant',
            content: JSON.stringify(message.content),
            type: 'tool'
          }
          : message
  );
}

// Configuration check
export function checkConfiguration(): void {
  const availableProviders = Object.entries(aiProviders)
      .filter(([, provider]) => provider.check())
      .map(([name]) => name);

  if (availableProviders.length === 0) {
    log.warn('No AI providers configured. The application will run with limited functionality.');
  } else {
    log.info(`Available AI providers: ${availableProviders.join(', ')}`);
  }
}

// Initialize configuration check
checkConfiguration();