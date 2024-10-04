import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { createOpenAI } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'
import { anthropic } from '@ai-sdk/anthropic'
import { CoreMessage, LanguageModelV1 } from 'ai'

// Simple logging function
const log = {
  info: (message: string) => console.log(`[INFO] ${message}`),
  warn: (message: string) => console.warn(`[WARN] ${message}`),
  error: (message: string) => console.error(`[ERROR] ${message}`),
  debug: (message: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`)
    }
  }
}

// Configuration object
const config = {
  openai: {
    apiBase: () => process.env.OPENAI_API_BASE,
    apiKey: () => process.env.OPENAI_API_KEY,
    model: () => process.env.OPENAI_API_MODEL || 'gpt-4o-mini'
  },
  google: {
    apiKey: () => process.env.GOOGLE_GENERATIVE_AI_API_KEY
  },
  anthropic: {
    apiKey: () => process.env.ANTHROPIC_API_KEY
  }
}

/**
 * Combines Tailwind CSS classes.
 * @param inputs - ClassValue array to be combined
 * @returns Combined CSS classes
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Sanitizes a URL by replacing spaces with '%20'
 * @param url - The URL to sanitize
 * @returns The sanitized URL
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') {
    throw new TypeError('URL must be a string')
  }
  return url.replace(/\s+/g, '%20')
}

// Model creation functions
function getGoogleModel() {
  return google('gemini-1.5-flash-002')
}

function getAnthropicModel() {
  return anthropic('claude-3-5-sonnet-20240620')
}

function getOpenAIModel() {
  const apiKey = config.openai.apiKey()
  const baseURL = config.openai.apiBase()
  const model = config.openai.model()
  if (!apiKey) {
    throw new Error('OpenAI configuration is incomplete')
  }
  return createOpenAI({ apiKey, baseURL, organization: '' }).chat(model)
}

// Configuration check function
function checkConfiguration() {
  const providers = [
    { name: 'Google', check: () => config.google.apiKey() },
    { name: 'Anthropic', check: () => config.anthropic.apiKey() },
    { name: 'OpenAI', check: () => config.openai.apiKey() }
  ]

  const availableProviders = providers.filter(provider => provider.check())

  if (availableProviders.length === 0) {
    log.warn('No AI providers configured. The application will run with limited functionality.')
  } else {
    log.info(`Available AI providers: ${availableProviders.map(p => p.name).join(', ')}`)
  }
}

/**
 * Selects and returns an AI model based on available configurations.
 * @returns An instance of the selected AI model or null if no provider is available
 */
export function getModel(): LanguageModelV1 {
  const providers = [
    { name: 'Google', check: () => config.google.apiKey(), get: getGoogleModel },
    { name: 'Anthropic', check: () => config.anthropic.apiKey(), get: getAnthropicModel },
    { name: 'OpenAI', check: () => config.openai.apiKey(), get: getOpenAIModel }
  ]

  for (const provider of providers) {
    try {
      if (provider.check()) {
        return provider.get()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      log.debug(`${provider.name} provider not available: ${errorMessage}`)
    }
  }

  throw new Error('No AI provider available. Please configure at least one provider.')
}

/**
 * Transforms messages with 'tool' role to 'assistant' role and stringifies their content.
 * @param messages - Array of CoreMessage to transform
 * @returns Array of transformed CoreMessage
 */
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
  )
}

// Call this function when your application starts
checkConfiguration()