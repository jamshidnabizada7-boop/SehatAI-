import ZAI from 'z-ai-web-dev-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { CORPUS } from '@/data/corpus';
import type { Lang, Citation } from '@/lib/types';
import type { RetrievalHit } from '@/lib/engine/safety-engine';
import { CLARIFICATION_QUESTIONS } from '@/lib/engine/context-extraction';

// ============================================================
// SehatAI — Multi-Provider Server-side LLM helper layer
// Cascade:
//   Tier 0: Primary Qwen/DashScope (qwen-plus, qwen-max, qwen-turbo)
//   Tier 1: Ultra-fast Google Gemini (gemini-2.5-flash, gemini-2.5-flash-lite, gemini-3.5-flash-lite)
//   Tier 2: Redundant high-speed Groq (qwen/qwen3.8-27b, openai/gpt-oss-120b, openai/gpt-oss-20b)
//   Tier 2b: ZAI support tier
//   Tier 3: Deterministic Offline Safety Engine
//
// In-Memory Circuit Breaker State Machine:
//   CLOSED -> OPEN (on 429 or >=2 consecutive failures) -> HALF_OPEN (after cooldown)
//
// Zero Leaky Sockets:
//   All timeouts backed by AbortController signal propagation.
//
// EVERY function here is fail-safe: it returns null on any
// failure and NEVER throws unhandled exceptions to callers.
// ============================================================

type ZAIInstance = Awaited<ReturnType<typeof ZAI.create>>;

export type ProviderTier = 'tier0_qwen' | 'tier1_gemini' | 'tier2_groq' | 'tier3_offline';
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface LlmMessage {
  role: 'assistant' | 'user'; // SDK convention: system prompt is sent as 'assistant'
  content: string;
}

export interface CascadeOptions {
  timeoutMs?: number;
  connectTimeoutMs?: number;
  streamTimeoutMs?: number;
  abortSignal?: AbortSignal;
  temperature?: number;
  jsonMode?: boolean;
  tierOverride?: ProviderTier;
  schemaHint?: string;
  onDelta?: (delta: string) => void;
}

export interface LlmResult {
  content: string;
  provider: ProviderTier | string;
  model: string;
  latencyMs: number;
}

export interface ProviderCircuitStatus {
  tier: string;
  status: CircuitState;
  consecutiveFailures: number;
  openUntil: number; // Unix epoch ms
  lastError?: string;
  lastFailureTime?: number;
  totalSuccesses: number;
  totalFailures: number;
}

// ------------------------------------------------------------
// Circuit Breaker State Machine
// ------------------------------------------------------------

export class ProviderCircuitBreaker {
  private states: Map<string, ProviderCircuitStatus> = new Map();
  private readonly failureThreshold: number;
  private readonly defaultCooldownMs: number;
  private readonly rateLimitCooldownMs: number;

  constructor(options: {
    failureThreshold?: number;
    defaultCooldownMs?: number;
    rateLimitCooldownMs?: number;
  } = {}) {
    this.failureThreshold = options.failureThreshold ?? 2;
    this.defaultCooldownMs = options.defaultCooldownMs ?? 30000; // 30s
    this.rateLimitCooldownMs = options.rateLimitCooldownMs ?? 45000; // 45s
    this.initTier('tier0_qwen');
    this.initTier('tier1_gemini');
    this.initTier('tier2_groq');
    this.initTier('tier_cerebras');
    this.initTier('tier_openrouter');
    this.initTier('tier_mistral');
    this.initTier('tier_zai');
  }

  private initTier(tier: string): void {
    if (!this.states.has(tier)) {
      this.states.set(tier, {
        tier,
        status: 'CLOSED',
        consecutiveFailures: 0,
        openUntil: 0,
        totalSuccesses: 0,
        totalFailures: 0,
      });
    }
  }

  public isAvailable(tier: string): boolean {
    this.initTier(tier);
    const state = this.states.get(tier)!;
    if (state.status === 'CLOSED') return true;
    if (state.status === 'OPEN') {
      if (Date.now() >= state.openUntil) {
        state.status = 'HALF_OPEN';
        return true;
      }
      return false; // Fast 0ms failover
    }
    // HALF_OPEN allows a single probe
    return true;
  }

  public recordSuccess(tier: string): void {
    this.initTier(tier);
    const state = this.states.get(tier)!;
    state.status = 'CLOSED';
    state.consecutiveFailures = 0;
    state.openUntil = 0;
    state.totalSuccesses++;
    state.lastError = undefined;
  }

  public recordFailure(tier: string, error: unknown): void {
    this.initTier(tier);
    const state = this.states.get(tier)!;
    state.totalFailures++;
    state.consecutiveFailures++;
    state.lastFailureTime = Date.now();
    state.lastError = error instanceof Error ? error.message : String(error);

    const errStr = (state.lastError || '').toLowerCase();
    const status = (error as { status?: number; statusCode?: number })?.status ||
      (error as { status?: number; statusCode?: number })?.statusCode;
    const isRateLimit =
      status === 429 ||
      errStr.includes('429') ||
      errStr.includes('rate limit') ||
      errStr.includes('quota') ||
      errStr.includes('resource_exhausted') ||
      errStr.includes('too many requests');

    if (isRateLimit) {
      state.status = 'OPEN';
      state.openUntil = Date.now() + this.rateLimitCooldownMs;
      console.warn(`[CircuitBreaker] ${tier} tripped to OPEN (429 Rate Limit) for ${this.rateLimitCooldownMs}ms`);
    } else if (state.consecutiveFailures >= this.failureThreshold || state.status === 'HALF_OPEN') {
      state.status = 'OPEN';
      state.openUntil = Date.now() + this.defaultCooldownMs;
      console.warn(`[CircuitBreaker] ${tier} tripped to OPEN (${state.consecutiveFailures} consecutive failures) for ${this.defaultCooldownMs}ms`);
    }
  }

  public getState(tier: string): ProviderCircuitStatus {
    this.initTier(tier);
    return { ...this.states.get(tier)! };
  }

  public getAllStates(): Record<string, ProviderCircuitStatus> {
    const result: Record<string, ProviderCircuitStatus> = {};
    for (const [key, val] of this.states.entries()) {
      result[key] = { ...val };
    }
    return result;
  }

  public forceState(tier: string, status: CircuitState, cooldownMs?: number): void {
    this.initTier(tier);
    const s = this.states.get(tier)!;
    s.status = status;
    if (status === 'OPEN') {
      s.openUntil = Date.now() + (cooldownMs ?? this.defaultCooldownMs);
    } else {
      s.openUntil = 0;
      if (status === 'CLOSED') {
        s.consecutiveFailures = 0;
      }
    }
  }

  public reset(): void {
    for (const key of this.states.keys()) {
      this.states.set(key, {
        tier: key,
        status: 'CLOSED',
        consecutiveFailures: 0,
        openUntil: 0,
        totalSuccesses: 0,
        totalFailures: 0,
      });
    }
  }
}

export const circuitBreaker = new ProviderCircuitBreaker();

// ------------------------------------------------------------
// Multi-Key Pool & Rotation Manager
// Automatically cascades through backup API keys on 429/quota limits
// ------------------------------------------------------------

export interface KeyPoolItem {
  key: string;
  cooldownUntil: number;
  failures: number;
}

export class ApiKeyPool {
  private items: KeyPoolItem[] = [];
  public readonly name: string;

  constructor(name: string, envKeys: string[]) {
    this.name = name;
    this.reload(envKeys);
  }

  reload(envKeys: string[]): void {
    const rawKeys: string[] = [];
    for (const env of envKeys) {
      const val = process.env[env];
      if (val && typeof val === 'string') {
        const parts = val.split(/[,;\n]+/).map((s) => s.trim()).filter((s) => s.length >= 10 && !s.includes('YOUR_'));
        rawKeys.push(...parts);
      }
      for (let i = 1; i <= 10; i++) {
        const idxVal = process.env[`${env}_${i}`] || process.env[`${env}${i}`];
        if (idxVal && typeof idxVal === 'string') {
          const trimmed = idxVal.trim();
          if (trimmed.length >= 10 && !trimmed.includes('YOUR_') && !rawKeys.includes(trimmed)) {
            rawKeys.push(trimmed);
          }
        }
      }
    }
    const unique = Array.from(new Set(rawKeys));
    this.items = unique.map((key) => {
      const existing = this.items.find((it) => it.key === key);
      return existing ?? { key, cooldownUntil: 0, failures: 0 };
    });
  }

  hasKeys(): boolean {
    return this.items.length > 0;
  }

  getAllKeys(): string[] {
    return this.items.map((it) => it.key);
  }

  getAvailableKeys(): string[] {
    const now = Date.now();
    return this.items
      .filter((it) => it.cooldownUntil <= now)
      .map((it) => it.key);
  }

  markRateLimited(key: string, cooldownMs = 60000): void {
    const found = this.items.find((it) => it.key === key);
    if (found) {
      found.cooldownUntil = Date.now() + cooldownMs;
      found.failures++;
      const available = this.getAvailableKeys().length;
      console.warn(`[KeyPool] ${this.name} key (...${key.slice(-4)}) rate limited (cooldown: ${cooldownMs / 1000}s). ${available} backup key(s) remaining.`);
    }
  }

  markSuccess(key: string): void {
    const found = this.items.find((it) => it.key === key);
    if (found) {
      found.failures = 0;
      found.cooldownUntil = 0;
    }
  }

  reset(): void {
    for (const it of this.items) {
      it.cooldownUntil = 0;
      it.failures = 0;
    }
  }
}

export function isRateLimitError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('Quota exceeded') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('RateLimitError') ||
    msg.includes('rate limit') ||
    msg.includes('Too Many Requests')
  );
}

// ------------------------------------------------------------
// Client Singletons & Pools
// ------------------------------------------------------------

let zaiInstance: ZAIInstance | null = null;
let zaiPromise: Promise<ZAIInstance> | null = null;
let dashScopePool: ApiKeyPool | null = null;
let geminiPool: ApiKeyPool | null = null;
let groqPool: ApiKeyPool | null = null;
let cerebrasPool: ApiKeyPool | null = null;
let openRouterPool: ApiKeyPool | null = null;
let mistralPool: ApiKeyPool | null = null;

export function getDashScopePool(): ApiKeyPool {
  if (!dashScopePool) {
    dashScopePool = new ApiKeyPool('DashScope', ['DASHSCOPE_API_KEY', 'DASHSCOPE_API_KEYS']);
  } else {
    dashScopePool.reload(['DASHSCOPE_API_KEY', 'DASHSCOPE_API_KEYS']);
  }
  return dashScopePool;
}

export function getGeminiPool(): ApiKeyPool {
  if (!geminiPool) {
    geminiPool = new ApiKeyPool('Gemini', ['GEMINI_API_KEY', 'GOOGLE_API_KEY', 'GEMINI_API_KEYS', 'GOOGLE_API_KEYS']);
  } else {
    geminiPool.reload(['GEMINI_API_KEY', 'GOOGLE_API_KEY', 'GEMINI_API_KEYS', 'GOOGLE_API_KEYS']);
  }
  return geminiPool;
}

export function getGroqPool(): ApiKeyPool {
  if (!groqPool) {
    groqPool = new ApiKeyPool('Groq', ['GROQ_API_KEY', 'GROQ_API_KEYS']);
  } else {
    groqPool.reload(['GROQ_API_KEY', 'GROQ_API_KEYS']);
  }
  return groqPool;
}

export function getCerebrasPool(): ApiKeyPool {
  if (!cerebrasPool) {
    cerebrasPool = new ApiKeyPool('Cerebras', ['CEREBRAS_API_KEY', 'CEREBRAS_API_KEYS']);
  } else {
    cerebrasPool.reload(['CEREBRAS_API_KEY', 'CEREBRAS_API_KEYS']);
  }
  return cerebrasPool;
}

export function getOpenRouterPool(): ApiKeyPool {
  if (!openRouterPool) {
    openRouterPool = new ApiKeyPool('OpenRouter', ['OPENROUTER_API_KEY', 'OPENROUTER_API_KEYS']);
  } else {
    openRouterPool.reload(['OPENROUTER_API_KEY', 'OPENROUTER_API_KEYS']);
  }
  return openRouterPool;
}

export function getMistralPool(): ApiKeyPool {
  if (!mistralPool) {
    mistralPool = new ApiKeyPool('Mistral', ['MISTRAL_API_KEY', 'MISTRAL_API_KEYS']);
  } else {
    mistralPool.reload(['MISTRAL_API_KEY', 'MISTRAL_API_KEYS']);
  }
  return mistralPool;
}

/** Reset client singletons (used in testing) */
export function resetClientsForTesting(): void {
  dashScopePool?.reset();
  geminiPool?.reset();
  groqPool?.reset();
  cerebrasPool?.reset();
  openRouterPool?.reset();
  mistralPool?.reset();
  zaiInstance = null;
  zaiPromise = null;
  circuitBreaker.reset();
}

export class OpenAiCompatibleClient {
  public apiKey: string;
  public baseURL: string;
  public extraHeaders: Record<string, string>;

  constructor(apiKey: string, baseURL: string, extraHeaders: Record<string, string> = {}) {
    this.apiKey = apiKey;
    this.baseURL = baseURL.replace(/\/+$/, '');
    this.extraHeaders = extraHeaders;
  }

  async chatCompletions(payload: any, signal: AbortSignal) {
    const res = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...this.extraHeaders,
      },
      body: JSON.stringify(payload),
      signal,
    });
    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${await res.text()}`);
    }
    return res;
  }
}

export class DashScopeClient extends OpenAiCompatibleClient {
  constructor(apiKey: string) {
    super(
      apiKey,
      process.env.DASHSCOPE_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    );
  }
}

export function getDashScope(): DashScopeClient | null {
  const pool = getDashScopePool();
  const keys = pool.getAvailableKeys();
  if (keys.length === 0) return null;
  return new DashScopeClient(keys[0]);
}

/** Singleton Gemini client supporting standard and AI Studio keys */
export function getGemini(): GoogleGenerativeAI | null {
  const pool = getGeminiPool();
  const keys = pool.getAvailableKeys();
  if (keys.length === 0) return null;
  return new GoogleGenerativeAI(keys[0]);
}

/** Singleton Groq fallback client */
export function getGroq(): Groq | null {
  const pool = getGroqPool();
  const keys = pool.getAvailableKeys();
  if (keys.length === 0) return null;
  return new Groq({ apiKey: keys[0] });
}

/** Singleton ZAI client (per server module graph). */
export async function getZAI(): Promise<ZAIInstance | null> {
  if (zaiInstance) return zaiInstance;
  if (!zaiPromise) {
    zaiPromise = ZAI.create()
      .then((z) => {
        zaiInstance = z;
        return z;
      })
      .catch(() => null as unknown as ZAIInstance);
  }
  return zaiPromise;
}

// ------------------------------------------------------------
// Non-Leaky Abort-Backed Timeout Mechanism
// ------------------------------------------------------------

export async function runWithAbortTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  ms: number,
  label: string,
  parentSignal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | null = null;

  const onParentAbort = () => {
    controller.abort(parentSignal?.reason || new Error('Aborted by caller'));
  };

  if (parentSignal) {
    if (parentSignal.aborted) {
      controller.abort(parentSignal.reason);
      throw new Error(`${label} already aborted by caller`);
    }
    parentSignal.addEventListener('abort', onParentAbort, { once: true });
  }

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`${label} timed out after ${ms}ms`);
      controller.abort(err);
      reject(err);
    }, ms);
  });

  try {
    const result = await Promise.race([fn(controller.signal), timeoutPromise]);
    return result;
  } finally {
    if (timer) clearTimeout(timer);
    if (parentSignal) {
      parentSignal.removeEventListener('abort', onParentAbort);
    }
  }
}

// ------------------------------------------------------------
// Stream Thought Filter (for Groq reasoning models)
// ------------------------------------------------------------

export class StreamThoughtFilter {
  private inThink = false;
  private buffer = '';

  public processChunk(chunk: string): string {
    this.buffer += chunk;
    let emitText = '';

    while (this.buffer.length > 0) {
      if (!this.inThink) {
        const thinkStartIdx = this.buffer.indexOf('<think>');
        if (thinkStartIdx === -1) {
          const partialMatch = this.getPartialTagMatch(this.buffer, '<think>');
          if (partialMatch > 0) {
            emitText += this.buffer.slice(0, this.buffer.length - partialMatch);
            this.buffer = this.buffer.slice(this.buffer.length - partialMatch);
            break;
          } else {
            emitText += this.buffer;
            this.buffer = '';
            break;
          }
        } else {
          emitText += this.buffer.slice(0, thinkStartIdx);
          this.buffer = this.buffer.slice(thinkStartIdx + '<think>'.length);
          this.inThink = true;
        }
      } else {
        const thinkEndIdx = this.buffer.indexOf('</think>');
        if (thinkEndIdx === -1) {
          const partialMatch = this.getPartialTagMatch(this.buffer, '</think>');
          if (partialMatch > 0) {
            this.buffer = this.buffer.slice(this.buffer.length - partialMatch);
            break;
          } else {
            this.buffer = '';
            break;
          }
        } else {
          this.buffer = this.buffer.slice(thinkEndIdx + '</think>'.length);
          this.inThink = false;
        }
      }
    }

    return emitText;
  }

  public flush(): string {
    if (this.inThink) {
      this.buffer = '';
      return '';
    }
    const remaining = this.buffer;
    this.buffer = '';
    return remaining;
  }

  private getPartialTagMatch(str: string, tag: string): number {
    for (let len = Math.min(str.length, tag.length - 1); len > 0; len--) {
      if (str.endsWith(tag.slice(0, len))) {
        return len;
      }
    }
    return 0;
  }
}

// ------------------------------------------------------------
// Model Configurations & Helpers
// ------------------------------------------------------------


export const DASHSCOPE_FALLBACK_MODELS = [
  'qwen-plus',
  'qwen-max',
  'qwen-turbo',
  'qwen2.5-72b-instruct'
];

export const GEMINI_FALLBACK_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
];

export const GROQ_FALLBACK_MODELS = [
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.6-27b',
  'allam-2-7b',
];

export const CEREBRAS_FALLBACK_MODELS = [
  'llama-3.3-70b',
  'llama3.1-70b',
  'llama3.1-8b',
];

export const OPENROUTER_FALLBACK_MODELS = [
  'meta-llama/llama-3.3-70b-instruct',
  'google/gemini-2.0-flash-001',
  'qwen/qwen-2.5-72b-instruct',
  'mistralai/mistral-small-24b-instruct-2501',
];

export const MISTRAL_FALLBACK_MODELS = [
  'mistral-small-latest',
  'open-mistral-nemo',
  'mistral-medium-latest',
];

interface ChatCompletionLike {
  choices?: { message?: { content?: string | null } }[];
}

function prepareGeminiMessages(messages: LlmMessage[]) {
  let systemInstruction: string | undefined = undefined;
  const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (i === 0 && msg.role === 'assistant') {
      systemInstruction = msg.content;
    } else {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }
  }

  if (contents.length === 0) {
    contents.push({
      role: 'user',
      parts: [{ text: systemInstruction || '' }],
    });
    systemInstruction = undefined;
  } else if (contents[0].role !== 'user') {
    contents.unshift({
      role: 'user',
      parts: [{ text: 'Begin clinical evaluation.' }],
    });
  }

  return { systemInstruction, contents };
}

// ------------------------------------------------------------
// Strip Markdown Fences & Extract JSON
// ------------------------------------------------------------

export function extractJsonBlock(text: string): string | null {
  if (!text) return null;
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) cleaned = fenceMatch[1].trim();
  const start = cleaned.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return cleaned.slice(start, i + 1);
    }
  }
  return null;
}

// ------------------------------------------------------------
// Multi-Provider Non-Streaming Chat Completion (`llmChat`)
// Cascade: 1. Gemini -> 2. Groq -> 3. ZAI -> 4. null
// ------------------------------------------------------------

export async function llmChat(
  messages: LlmMessage[],
  opts: CascadeOptions = {},
): Promise<string | null> {
  const timeoutMs = opts.timeoutMs ?? 15000;
  const parentSignal = opts.abortSignal;


  // Tier 0: DashScope (Qwen)
  const dashScopePool = getDashScopePool();
  if (dashScopePool.hasKeys() && circuitBreaker.isAvailable('tier0_qwen') && !opts.tierOverride) {
    const keys = dashScopePool.getAvailableKeys();
    for (const key of keys) {
      const client = new DashScopeClient(key);
      let keyRateLimited = false;
      for (const modelName of DASHSCOPE_FALLBACK_MODELS) {
        try {
          const text = await runWithAbortTimeout(
            async (signal) => {
              const res = await client.chatCompletions({
                model: modelName,
                messages: messages.map((m) => ({
                  role: m.role === 'assistant' ? 'assistant' : 'user',
                  content: m.content,
                })),
                temperature: opts.temperature ?? 0.3,
              }, signal);
              const data = await res.json();
              return data.choices?.[0]?.message?.content;
            },
            Math.min(timeoutMs, 6000),
            `dashscopeChat-${modelName}`,
            parentSignal,
          );

          if (typeof text === 'string' && text.trim().length > 0) {
            dashScopePool.markSuccess(key);
            circuitBreaker.recordSuccess('tier0_qwen');
            return text.trim();
          }
        } catch (err) {
          if (isRateLimitError(err)) {
            dashScopePool.markRateLimited(key, 45000);
            keyRateLimited = true;
            break; // rotate to next key in pool
          }
          console.warn(`[LLM] DashScope (${modelName}) chat error:`, err instanceof Error ? err.message : err);
        }
      }
      if (!keyRateLimited && dashScopePool.getAvailableKeys().length === 0) {
        circuitBreaker.recordFailure('tier0_qwen', new Error('All DashScope keys exhausted'));
        break;
      }
    }
  }

  // Tier 1: Google Gemini
  const geminiPool = getGeminiPool();
  if (geminiPool.hasKeys() && circuitBreaker.isAvailable('tier1_gemini') && opts.tierOverride !== 'tier2_groq') {
    const keys = geminiPool.getAvailableKeys();
    for (const key of keys) {
      const gemini = new GoogleGenerativeAI(key);
      const { systemInstruction, contents } = prepareGeminiMessages(messages);
      let keyRateLimited = false;
      for (const modelName of GEMINI_FALLBACK_MODELS) {
        try {
          const text = await runWithAbortTimeout(
            async (signal) => {
              const model = gemini.getGenerativeModel({
                model: modelName,
                systemInstruction,
              });
              const result = await model.generateContent({ contents }, { signal });
              return result.response.text();
            },
            Math.min(timeoutMs, 6000),
            `geminiChat-${modelName}`,
            parentSignal,
          );

          if (typeof text === 'string' && text.trim().length > 0) {
            geminiPool.markSuccess(key);
            circuitBreaker.recordSuccess('tier1_gemini');
            return text.trim();
          }
        } catch (err) {
          if (isRateLimitError(err)) {
            geminiPool.markRateLimited(key, 45000);
            keyRateLimited = true;
            break; // rotate to next key in pool
          }
          console.warn(`[LLM] Gemini (${modelName}) chat error:`, err instanceof Error ? err.message : err);
        }
      }
      if (!keyRateLimited && geminiPool.getAvailableKeys().length === 0) {
        circuitBreaker.recordFailure('tier1_gemini', new Error('All Gemini keys exhausted'));
        break;
      }
    }
  }

  // Tier 2: Groq Fallback
  const groqPool = getGroqPool();
  if (groqPool.hasKeys() && circuitBreaker.isAvailable('tier2_groq')) {
    const keys = groqPool.getAvailableKeys();
    for (const key of keys) {
      const groq = new Groq({ apiKey: key });
      let keyRateLimited = false;
      for (const modelName of GROQ_FALLBACK_MODELS) {
        try {
          const text = await runWithAbortTimeout(
            async (signal) => {
              const completion = await groq.chat.completions.create(
                {
                  model: modelName,
                  messages: messages.map((m) => ({
                    role: m.role === 'assistant' ? 'assistant' : 'user',
                    content: m.content,
                  })),
                  temperature: opts.temperature ?? 0.3,
                },
                { signal },
              );
              return completion.choices?.[0]?.message?.content;
            },
            Math.min(timeoutMs, 6000),
            `groqChat-${modelName}`,
            parentSignal,
          );

          if (typeof text === 'string') {
            const cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
            if (cleaned.length > 0) {
              groqPool.markSuccess(key);
              circuitBreaker.recordSuccess('tier2_groq');
              return cleaned;
            }
          }
        } catch (err) {
          if (isRateLimitError(err)) {
            groqPool.markRateLimited(key, 45000);
            keyRateLimited = true;
            break; // rotate to next key in pool
          }
          console.warn(`[LLM] Groq chat (${modelName}) error:`, err instanceof Error ? err.message : err);
        }
      }
      if (!keyRateLimited && groqPool.getAvailableKeys().length === 0) {
        circuitBreaker.recordFailure('tier2_groq', new Error('All Groq keys exhausted'));
        break;
      }
    }
  }

  // Tier 3: Cerebras (Ultra-fast inference)
  const cerebrasPool = getCerebrasPool();
  if (cerebrasPool.hasKeys() && circuitBreaker.isAvailable('tier_cerebras')) {
    const keys = cerebrasPool.getAvailableKeys();
    for (const key of keys) {
      const client = new OpenAiCompatibleClient(key, 'https://api.cerebras.ai/v1');
      let keyRateLimited = false;
      for (const modelName of CEREBRAS_FALLBACK_MODELS) {
        try {
          const text = await runWithAbortTimeout(
            async (signal) => {
              const res = await client.chatCompletions({
                model: modelName,
                messages: messages.map((m) => ({
                  role: m.role === 'assistant' ? 'assistant' : 'user',
                  content: m.content,
                })),
                temperature: opts.temperature ?? 0.3,
              }, signal);
              const data = await res.json();
              return data.choices?.[0]?.message?.content;
            },
            Math.min(timeoutMs, 6000),
            `cerebrasChat-${modelName}`,
            parentSignal,
          );

          if (typeof text === 'string' && text.trim().length > 0) {
            cerebrasPool.markSuccess(key);
            circuitBreaker.recordSuccess('tier_cerebras');
            return text.trim();
          }
        } catch (err) {
          if (isRateLimitError(err)) {
            cerebrasPool.markRateLimited(key, 45000);
            keyRateLimited = true;
            break;
          }
          console.warn(`[LLM] Cerebras chat (${modelName}) error:`, err instanceof Error ? err.message : err);
        }
      }
      if (!keyRateLimited && cerebrasPool.getAvailableKeys().length === 0) {
        circuitBreaker.recordFailure('tier_cerebras', new Error('All Cerebras keys exhausted'));
        break;
      }
    }
  }

  // Tier 4: OpenRouter
  const openRouterPool = getOpenRouterPool();
  if (openRouterPool.hasKeys() && circuitBreaker.isAvailable('tier_openrouter')) {
    const keys = openRouterPool.getAvailableKeys();
    for (const key of keys) {
      const client = new OpenAiCompatibleClient(key, 'https://openrouter.ai/api/v1', {
        'HTTP-Referer': 'https://sehatai.pk',
        'X-Title': 'SehatAI',
      });
      let keyRateLimited = false;
      for (const modelName of OPENROUTER_FALLBACK_MODELS) {
        try {
          const text = await runWithAbortTimeout(
            async (signal) => {
              const res = await client.chatCompletions({
                model: modelName,
                messages: messages.map((m) => ({
                  role: m.role === 'assistant' ? 'assistant' : 'user',
                  content: m.content,
                })),
                temperature: opts.temperature ?? 0.3,
              }, signal);
              const data = await res.json();
              return data.choices?.[0]?.message?.content;
            },
            Math.min(timeoutMs, 6000),
            `openRouterChat-${modelName}`,
            parentSignal,
          );

          if (typeof text === 'string' && text.trim().length > 0) {
            openRouterPool.markSuccess(key);
            circuitBreaker.recordSuccess('tier_openrouter');
            return text.trim();
          }
        } catch (err) {
          if (isRateLimitError(err)) {
            openRouterPool.markRateLimited(key, 45000);
            keyRateLimited = true;
            break;
          }
          console.warn(`[LLM] OpenRouter chat (${modelName}) error:`, err instanceof Error ? err.message : err);
        }
      }
      if (!keyRateLimited && openRouterPool.getAvailableKeys().length === 0) {
        circuitBreaker.recordFailure('tier_openrouter', new Error('All OpenRouter keys exhausted'));
        break;
      }
    }
  }

  // Tier 5: Mistral AI
  const mistralPool = getMistralPool();
  if (mistralPool.hasKeys() && circuitBreaker.isAvailable('tier_mistral')) {
    const keys = mistralPool.getAvailableKeys();
    for (const key of keys) {
      const client = new OpenAiCompatibleClient(key, 'https://api.mistral.ai/v1');
      let keyRateLimited = false;
      for (const modelName of MISTRAL_FALLBACK_MODELS) {
        try {
          const text = await runWithAbortTimeout(
            async (signal) => {
              const res = await client.chatCompletions({
                model: modelName,
                messages: messages.map((m) => ({
                  role: m.role === 'assistant' ? 'assistant' : 'user',
                  content: m.content,
                })),
                temperature: opts.temperature ?? 0.3,
              }, signal);
              const data = await res.json();
              return data.choices?.[0]?.message?.content;
            },
            Math.min(timeoutMs, 6000),
            `mistralChat-${modelName}`,
            parentSignal,
          );

          if (typeof text === 'string' && text.trim().length > 0) {
            mistralPool.markSuccess(key);
            circuitBreaker.recordSuccess('tier_mistral');
            return text.trim();
          }
        } catch (err) {
          if (isRateLimitError(err)) {
            mistralPool.markRateLimited(key, 45000);
            keyRateLimited = true;
            break;
          }
          console.warn(`[LLM] Mistral chat (${modelName}) error:`, err instanceof Error ? err.message : err);
        }
      }
      if (!keyRateLimited && mistralPool.getAvailableKeys().length === 0) {
        circuitBreaker.recordFailure('tier_mistral', new Error('All Mistral keys exhausted'));
        break;
      }
    }
  }

  // Tier 6: ZAI Support Tier
  if (circuitBreaker.isAvailable('tier_zai')) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const zai = await getZAI();
        if (!zai) break;
        const text = await runWithAbortTimeout(
          async () => {
            const completion = (await zai.chat.completions.create({
              messages,
              thinking: { type: 'disabled' },
            })) as ChatCompletionLike | null;
            return completion?.choices?.[0]?.message?.content;
          },
          Math.min(timeoutMs, 8000),
          'zaiChat',
          parentSignal,
        );

        if (typeof text === 'string' && text.trim().length > 0) {
          circuitBreaker.recordSuccess('tier_zai');
          return text.trim();
        }
      } catch (err) {
        circuitBreaker.recordFailure('tier_zai', err);
      }
    }
  }

  return null;
}

// ------------------------------------------------------------
// Multi-Provider Streaming Chat Completion (`llmChatStream`)
// Cascade: 1. Gemini -> 2. Groq -> 3. ZAI -> 4. null
// ------------------------------------------------------------

export async function llmChatStream(
  messages: LlmMessage[],
  onDelta: (delta: string) => void,
  opts?: CascadeOptions,
): Promise<string | null>;
export async function llmChatStream(
  systemPrompt: string,
  messages: LlmMessage[],
  onDelta: (delta: string) => void,
  opts?: CascadeOptions,
): Promise<string | null>;
export async function llmChatStream(
  messagesOrSystem: LlmMessage[] | string,
  onDeltaOrMessages: ((delta: string) => void) | LlmMessage[],
  optsOrOnDelta?: CascadeOptions | ((delta: string) => void),
  maybeOpts?: CascadeOptions,
): Promise<string | null> {
  let messages: LlmMessage[];
  let onDelta: (delta: string) => void;
  let opts: CascadeOptions;

  if (typeof messagesOrSystem === 'string') {
    const systemPrompt = messagesOrSystem;
    const rawMsgs = Array.isArray(onDeltaOrMessages) ? onDeltaOrMessages : [];
    messages = [{ role: 'assistant', content: systemPrompt }, ...rawMsgs];
    onDelta = typeof optsOrOnDelta === 'function' ? optsOrOnDelta : () => {};
    opts = maybeOpts ?? {};
  } else {
    messages = messagesOrSystem;
    onDelta = typeof onDeltaOrMessages === 'function' ? onDeltaOrMessages : () => {};
    opts = (typeof optsOrOnDelta === 'object' && optsOrOnDelta !== null ? optsOrOnDelta : {}) as CascadeOptions;
  }

  const timeoutMs = opts.timeoutMs ?? 25000;
  const parentSignal = opts.abortSignal;


  // Tier 0: DashScope (Qwen) Streaming
  const dashScopePool = getDashScopePool();
  if (dashScopePool.hasKeys() && circuitBreaker.isAvailable('tier0_qwen') && !opts.tierOverride) {
    const keys = dashScopePool.getAvailableKeys();
    for (const key of keys) {
      const client = new DashScopeClient(key);
      let keyRateLimited = false;
      for (const modelName of DASHSCOPE_FALLBACK_MODELS) {
        try {
          const fullText = await runWithAbortTimeout(
            async (signal) => {
              const res = await client.chatCompletions({
                model: modelName,
                messages: messages.map((m) => ({
                  role: m.role === 'assistant' ? 'assistant' : 'user',
                  content: m.content,
                })),
                stream: true,
                temperature: opts.temperature ?? 0.3,
              }, signal);

              if (!res.body) throw new Error('No response body');
              
              let full = '';
              const reader = res.body.getReader();
              const decoder = new TextDecoder();
              let buffer = '';
              while (true) {
                if (signal.aborted) {
                  reader.cancel().catch(() => {});
                  throw new Error('DashScope stream aborted');
                }
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';
                for (const rawLine of lines) {
                  const line = rawLine.trim();
                  if (!line.startsWith('data:')) continue;
                  const payload = line.slice(5).trim();
                  if (!payload || payload === '[DONE]') continue;
                  try {
                    const obj = JSON.parse(payload) as {
                      choices?: { delta?: { content?: string } }[];
                    };
                    const delta = obj.choices?.[0]?.delta?.content;
                    if (typeof delta === 'string' && delta.length > 0) {
                      full += delta;
                      onDelta(delta);
                    }
                  } catch {
                    // skip malformed SSE line
                  }
                }
              }
              return full;
            },
            timeoutMs,
            `dashscopeStream-${modelName}`,
            parentSignal,
          );

          if (fullText && fullText.trim().length > 0) {
            dashScopePool.markSuccess(key);
            circuitBreaker.recordSuccess('tier0_qwen');
            return fullText;
          }
        } catch (err) {
          if (isRateLimitError(err)) {
            dashScopePool.markRateLimited(key, 45000);
            keyRateLimited = true;
            break; // rotate to next key in pool
          }
          console.warn(`[LLM] DashScope stream (${modelName}) error:`, err instanceof Error ? err.message : err);
        }
      }
      if (!keyRateLimited && dashScopePool.getAvailableKeys().length === 0) {
        circuitBreaker.recordFailure('tier0_qwen', new Error('All DashScope keys exhausted'));
        break;
      }
    }
  }

  // Tier 1: Google Gemini Streaming
  const geminiPool = getGeminiPool();
  if (geminiPool.hasKeys() && circuitBreaker.isAvailable('tier1_gemini') && opts.tierOverride !== 'tier2_groq') {
    const keys = geminiPool.getAvailableKeys();
    for (const key of keys) {
      const gemini = new GoogleGenerativeAI(key);
      const { systemInstruction, contents } = prepareGeminiMessages(messages);
      let keyRateLimited = false;
      for (const modelName of GEMINI_FALLBACK_MODELS) {
        try {
          const fullText = await runWithAbortTimeout(
            async (signal) => {
              const model = gemini.getGenerativeModel({
                model: modelName,
                systemInstruction,
              });
              const result = await model.generateContentStream({ contents }, { signal });
              let full = '';
              for await (const chunk of result.stream) {
                if (signal.aborted) throw new Error('Stream aborted by signal');
                const delta = chunk.text();
                if (delta && delta.length > 0) {
                  full += delta;
                  onDelta(delta);
                }
              }
              return full;
            },
            timeoutMs,
            `geminiStream-${modelName}`,
            parentSignal,
          );

          if (fullText && fullText.trim().length > 0) {
            geminiPool.markSuccess(key);
            circuitBreaker.recordSuccess('tier1_gemini');
            return fullText;
          }
        } catch (err) {
          if (isRateLimitError(err)) {
            geminiPool.markRateLimited(key, 45000);
            keyRateLimited = true;
            break; // rotate to next key in pool
          }
          console.warn(`[LLM] Gemini stream (${modelName}) error:`, err instanceof Error ? err.message : err);
        }
      }
      if (!keyRateLimited && geminiPool.getAvailableKeys().length === 0) {
        circuitBreaker.recordFailure('tier1_gemini', new Error('All Gemini keys exhausted'));
        break;
      }
    }
  }

  // Tier 2: Groq Streaming with StreamThoughtFilter
  const groqPool = getGroqPool();
  if (groqPool.hasKeys() && circuitBreaker.isAvailable('tier2_groq')) {
    const keys = groqPool.getAvailableKeys();
    for (const key of keys) {
      const groq = new Groq({ apiKey: key });
      let keyRateLimited = false;
      for (const modelName of GROQ_FALLBACK_MODELS) {
        try {
          const fullText = await runWithAbortTimeout(
            async (signal) => {
              const stream = await groq.chat.completions.create(
                {
                  model: modelName,
                  messages: messages.map((m) => ({
                    role: m.role === 'assistant' ? 'assistant' : 'user',
                    content: m.content,
                  })),
                  stream: true,
                  temperature: opts.temperature ?? 0.3,
                },
                { signal },
              );

              let full = '';
              const thoughtFilter = new StreamThoughtFilter();

              for await (const chunk of stream) {
                if (signal.aborted) throw new Error('Groq stream aborted by signal');
                const rawDelta = chunk.choices?.[0]?.delta?.content;
                if (rawDelta && rawDelta.length > 0) {
                  full += rawDelta;
                  const cleanDelta = thoughtFilter.processChunk(rawDelta);
                  if (cleanDelta.length > 0) {
                    onDelta(cleanDelta);
                  }
                }
              }

              const remaining = thoughtFilter.flush();
              if (remaining.length > 0) {
                onDelta(remaining);
              }

              const cleaned = full.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
              return cleaned;
            },
            timeoutMs,
            `groqStream-${modelName}`,
            parentSignal,
          );

          if (fullText && fullText.trim().length > 0) {
            groqPool.markSuccess(key);
            circuitBreaker.recordSuccess('tier2_groq');
            return fullText;
          }
        } catch (err) {
          if (isRateLimitError(err)) {
            groqPool.markRateLimited(key, 45000);
            keyRateLimited = true;
            break; // rotate to next key in pool
          }
          console.warn(`[LLM] Groq stream (${modelName}) error:`, err instanceof Error ? err.message : err);
        }
      }
      if (!keyRateLimited && groqPool.getAvailableKeys().length === 0) {
        circuitBreaker.recordFailure('tier2_groq', new Error('All Groq keys exhausted'));
        break;
      }
    }
  }

  // Tier 3: Cerebras Streaming (Ultra-Fast 2000 t/s)
  const cerebrasPool = getCerebrasPool();
  if (cerebrasPool.hasKeys() && circuitBreaker.isAvailable('tier_cerebras')) {
    const keys = cerebrasPool.getAvailableKeys();
    for (const key of keys) {
      const client = new OpenAiCompatibleClient(key, 'https://api.cerebras.ai/v1');
      let keyRateLimited = false;
      for (const modelName of CEREBRAS_FALLBACK_MODELS) {
        try {
          const fullText = await runWithAbortTimeout(
            async (signal) => {
              const res = await client.chatCompletions({
                model: modelName,
                messages: messages.map((m) => ({
                  role: m.role === 'assistant' ? 'assistant' : 'user',
                  content: m.content,
                })),
                stream: true,
                temperature: opts.temperature ?? 0.3,
              }, signal);

              if (!res.body) throw new Error('No response body');
              let full = '';
              const reader = res.body.getReader();
              const decoder = new TextDecoder();
              let buffer = '';
              const thoughtFilter = new StreamThoughtFilter();

              while (true) {
                if (signal.aborted) {
                  reader.cancel().catch(() => {});
                  throw new Error('Cerebras stream aborted');
                }
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';
                for (const rawLine of lines) {
                  const line = rawLine.trim();
                  if (!line.startsWith('data:')) continue;
                  const payload = line.slice(5).trim();
                  if (!payload || payload === '[DONE]') continue;
                  try {
                    const obj = JSON.parse(payload) as {
                      choices?: { delta?: { content?: string } }[];
                    };
                    const delta = obj.choices?.[0]?.delta?.content;
                    if (typeof delta === 'string' && delta.length > 0) {
                      full += delta;
                      const clean = thoughtFilter.processChunk(delta);
                      if (clean.length > 0) onDelta(clean);
                    }
                  } catch {}
                }
              }
              const remaining = thoughtFilter.flush();
              if (remaining.length > 0) onDelta(remaining);
              return full.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
            },
            timeoutMs,
            `cerebrasStream-${modelName}`,
            parentSignal,
          );

          if (fullText && fullText.trim().length > 0) {
            cerebrasPool.markSuccess(key);
            circuitBreaker.recordSuccess('tier_cerebras');
            return fullText;
          }
        } catch (err) {
          if (isRateLimitError(err)) {
            cerebrasPool.markRateLimited(key, 45000);
            keyRateLimited = true;
            break;
          }
          console.warn(`[LLM] Cerebras stream (${modelName}) error:`, err instanceof Error ? err.message : err);
        }
      }
      if (!keyRateLimited && cerebrasPool.getAvailableKeys().length === 0) {
        circuitBreaker.recordFailure('tier_cerebras', new Error('All Cerebras keys exhausted'));
        break;
      }
    }
  }

  // Tier 4: OpenRouter Streaming
  const openRouterPool = getOpenRouterPool();
  if (openRouterPool.hasKeys() && circuitBreaker.isAvailable('tier_openrouter')) {
    const keys = openRouterPool.getAvailableKeys();
    for (const key of keys) {
      const client = new OpenAiCompatibleClient(key, 'https://openrouter.ai/api/v1', {
        'HTTP-Referer': 'https://sehatai.pk',
        'X-Title': 'SehatAI',
      });
      let keyRateLimited = false;
      for (const modelName of OPENROUTER_FALLBACK_MODELS) {
        try {
          const fullText = await runWithAbortTimeout(
            async (signal) => {
              const res = await client.chatCompletions({
                model: modelName,
                messages: messages.map((m) => ({
                  role: m.role === 'assistant' ? 'assistant' : 'user',
                  content: m.content,
                })),
                stream: true,
                temperature: opts.temperature ?? 0.3,
              }, signal);

              if (!res.body) throw new Error('No response body');
              let full = '';
              const reader = res.body.getReader();
              const decoder = new TextDecoder();
              let buffer = '';
              const thoughtFilter = new StreamThoughtFilter();

              while (true) {
                if (signal.aborted) {
                  reader.cancel().catch(() => {});
                  throw new Error('OpenRouter stream aborted');
                }
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';
                for (const rawLine of lines) {
                  const line = rawLine.trim();
                  if (!line.startsWith('data:')) continue;
                  const payload = line.slice(5).trim();
                  if (!payload || payload === '[DONE]') continue;
                  try {
                    const obj = JSON.parse(payload) as {
                      choices?: { delta?: { content?: string } }[];
                    };
                    const delta = obj.choices?.[0]?.delta?.content;
                    if (typeof delta === 'string' && delta.length > 0) {
                      full += delta;
                      const clean = thoughtFilter.processChunk(delta);
                      if (clean.length > 0) onDelta(clean);
                    }
                  } catch {}
                }
              }
              const remaining = thoughtFilter.flush();
              if (remaining.length > 0) onDelta(remaining);
              return full.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
            },
            timeoutMs,
            `openRouterStream-${modelName}`,
            parentSignal,
          );

          if (fullText && fullText.trim().length > 0) {
            openRouterPool.markSuccess(key);
            circuitBreaker.recordSuccess('tier_openrouter');
            return fullText;
          }
        } catch (err) {
          if (isRateLimitError(err)) {
            openRouterPool.markRateLimited(key, 45000);
            keyRateLimited = true;
            break;
          }
          console.warn(`[LLM] OpenRouter stream (${modelName}) error:`, err instanceof Error ? err.message : err);
        }
      }
      if (!keyRateLimited && openRouterPool.getAvailableKeys().length === 0) {
        circuitBreaker.recordFailure('tier_openrouter', new Error('All OpenRouter keys exhausted'));
        break;
      }
    }
  }

  // Tier 5: Mistral AI Streaming
  const mistralPool = getMistralPool();
  if (mistralPool.hasKeys() && circuitBreaker.isAvailable('tier_mistral')) {
    const keys = mistralPool.getAvailableKeys();
    for (const key of keys) {
      const client = new OpenAiCompatibleClient(key, 'https://api.mistral.ai/v1');
      let keyRateLimited = false;
      for (const modelName of MISTRAL_FALLBACK_MODELS) {
        try {
          const fullText = await runWithAbortTimeout(
            async (signal) => {
              const res = await client.chatCompletions({
                model: modelName,
                messages: messages.map((m) => ({
                  role: m.role === 'assistant' ? 'assistant' : 'user',
                  content: m.content,
                })),
                stream: true,
                temperature: opts.temperature ?? 0.3,
              }, signal);

              if (!res.body) throw new Error('No response body');
              let full = '';
              const reader = res.body.getReader();
              const decoder = new TextDecoder();
              let buffer = '';
              const thoughtFilter = new StreamThoughtFilter();

              while (true) {
                if (signal.aborted) {
                  reader.cancel().catch(() => {});
                  throw new Error('Mistral stream aborted');
                }
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';
                for (const rawLine of lines) {
                  const line = rawLine.trim();
                  if (!line.startsWith('data:')) continue;
                  const payload = line.slice(5).trim();
                  if (!payload || payload === '[DONE]') continue;
                  try {
                    const obj = JSON.parse(payload) as {
                      choices?: { delta?: { content?: string } }[];
                    };
                    const delta = obj.choices?.[0]?.delta?.content;
                    if (typeof delta === 'string' && delta.length > 0) {
                      full += delta;
                      const clean = thoughtFilter.processChunk(delta);
                      if (clean.length > 0) onDelta(clean);
                    }
                  } catch {}
                }
              }
              const remaining = thoughtFilter.flush();
              if (remaining.length > 0) onDelta(remaining);
              return full.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
            },
            timeoutMs,
            `mistralStream-${modelName}`,
            parentSignal,
          );

          if (fullText && fullText.trim().length > 0) {
            mistralPool.markSuccess(key);
            circuitBreaker.recordSuccess('tier_mistral');
            return fullText;
          }
        } catch (err) {
          if (isRateLimitError(err)) {
            mistralPool.markRateLimited(key, 45000);
            keyRateLimited = true;
            break;
          }
          console.warn(`[LLM] Mistral stream (${modelName}) error:`, err instanceof Error ? err.message : err);
        }
      }
      if (!keyRateLimited && mistralPool.getAvailableKeys().length === 0) {
        circuitBreaker.recordFailure('tier_mistral', new Error('All Mistral keys exhausted'));
        break;
      }
    }
  }

  // Tier 2b: ZAI Streaming
  if (circuitBreaker.isAvailable('tier_zai')) {
    try {
      const zai = await getZAI();
      if (zai) {
        const fullText = await runWithAbortTimeout(
          async (signal) => {
            const result = (await zai.chat.completions.create({
              messages,
              stream: true,
              thinking: { type: 'disabled' },
            })) as unknown;

            if (result && typeof (result as ReadableStream).getReader === 'function') {
              let full = '';
              const reader = (result as ReadableStream<Uint8Array>).getReader();
              const decoder = new TextDecoder();
              let buffer = '';
              while (true) {
                if (signal.aborted) {
                  reader.cancel().catch(() => {});
                  throw new Error('ZAI stream aborted');
                }
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';
                for (const rawLine of lines) {
                  const line = rawLine.trim();
                  if (!line.startsWith('data:')) continue;
                  const payload = line.slice(5).trim();
                  if (!payload || payload === '[DONE]') continue;
                  try {
                    const obj = JSON.parse(payload) as {
                      choices?: { delta?: { content?: string } }[];
                    };
                    const delta = obj.choices?.[0]?.delta?.content;
                    if (typeof delta === 'string' && delta.length > 0) {
                      full += delta;
                      onDelta(delta);
                    }
                  } catch {
                    // skip malformed SSE line
                  }
                }
              }
              return full.trim();
            }

            const completion = result as ChatCompletionLike | null;
            const text = completion?.choices?.[0]?.message?.content;
            if (typeof text === 'string' && text.trim().length > 0) {
              onDelta(text);
              return text.trim();
            }
            return '';
          },
          timeoutMs,
          'zaiStream',
          parentSignal,
        );

        if (fullText && fullText.trim().length > 0) {
          circuitBreaker.recordSuccess('tier_zai');
          return fullText;
        }
      }
    } catch (err) {
      circuitBreaker.recordFailure('tier_zai', err);
    }
  }

  return null;
}

// ------------------------------------------------------------
// Structured JSON Call (`llmJSON`)
// Native JSON Mode -> Groq JSON Mode -> Chat JSON Extraction -> null
// ------------------------------------------------------------

export async function llmJSON<T>(
  system: string,
  user: string,
  opts: CascadeOptions = {},
): Promise<T | null> {
  const timeoutMs = opts.timeoutMs ?? 15000;
  const parentSignal = opts.abortSignal;


  // Tier 0: DashScope Native JSON
  const dashScopePool = getDashScopePool();
  if (dashScopePool.hasKeys() && circuitBreaker.isAvailable('tier0_qwen') && !opts.tierOverride) {
    const keys = dashScopePool.getAvailableKeys();
    for (const key of keys) {
      const client = new DashScopeClient(key);
      let keyRateLimited = false;
      for (const modelName of DASHSCOPE_FALLBACK_MODELS) {
        try {
          const text = await runWithAbortTimeout(
            async (signal) => {
              const res = await client.chatCompletions({
                model: modelName,
                messages: [
                  { role: 'system', content: system },
                  { role: 'user', content: user },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.1,
              }, signal);
              const data = await res.json();
              return data.choices?.[0]?.message?.content;
            },
            Math.min(timeoutMs, 8000),
            `dashscopeJSON-${modelName}`,
            parentSignal,
          );

          if (text) {
            const block = extractJsonBlock(text) || text.trim();
            const parsed = JSON.parse(block) as T;
            dashScopePool.markSuccess(key);
            circuitBreaker.recordSuccess('tier0_qwen');
            return parsed;
          }
        } catch (err) {
          if (isRateLimitError(err)) {
            dashScopePool.markRateLimited(key, 45000);
            keyRateLimited = true;
            break; // rotate to next key in pool
          }
          console.warn(`[LLM] DashScope JSON (${modelName}) error:`, err instanceof Error ? err.message : err);
        }
      }
      if (!keyRateLimited && dashScopePool.getAvailableKeys().length === 0) {
        circuitBreaker.recordFailure('tier0_qwen', new Error('All DashScope keys exhausted'));
        break;
      }
    }
  }

  // Tier 1: Gemini Native JSON
  const geminiPool = getGeminiPool();
  if (geminiPool.hasKeys() && circuitBreaker.isAvailable('tier1_gemini') && opts.tierOverride !== 'tier2_groq') {
    const keys = geminiPool.getAvailableKeys();
    for (const key of keys) {
      const gemini = new GoogleGenerativeAI(key);
      let keyRateLimited = false;
      for (const modelName of GEMINI_FALLBACK_MODELS) {
        try {
          const text = await runWithAbortTimeout(
            async (signal) => {
              const model = gemini.getGenerativeModel({
                model: modelName,
                systemInstruction: system,
                generationConfig: {
                  responseMimeType: 'application/json',
                },
              });
              const result = await model.generateContent(user, { signal });
              return result.response.text();
            },
            Math.min(timeoutMs, 8000),
            `geminiJSON-${modelName}`,
            parentSignal,
          );

          if (text) {
            const block = extractJsonBlock(text) || text.trim();
            const parsed = JSON.parse(block) as T;
            geminiPool.markSuccess(key);
            circuitBreaker.recordSuccess('tier1_gemini');
            return parsed;
          }
        } catch (err) {
          if (isRateLimitError(err)) {
            geminiPool.markRateLimited(key, 45000);
            keyRateLimited = true;
            break; // rotate to next key in pool
          }
          console.warn(`[LLM] Gemini JSON (${modelName}) error:`, err instanceof Error ? err.message : err);
        }
      }
      if (!keyRateLimited && geminiPool.getAvailableKeys().length === 0) {
        circuitBreaker.recordFailure('tier1_gemini', new Error('All Gemini keys exhausted'));
        break;
      }
    }
  }

  // Tier 2: Groq JSON Mode
  const groqPool = getGroqPool();
  if (groqPool.hasKeys() && circuitBreaker.isAvailable('tier2_groq')) {
    const keys = groqPool.getAvailableKeys();
    for (const key of keys) {
      const groq = new Groq({ apiKey: key });
      let keyRateLimited = false;
      for (const modelName of GROQ_FALLBACK_MODELS) {
        try {
          const text = await runWithAbortTimeout(
            async (signal) => {
              const completion = await groq.chat.completions.create(
                {
                  model: modelName,
                  messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: user },
                  ],
                  response_format: { type: 'json_object' },
                  temperature: 0.1,
                },
                { signal },
              );
              return completion.choices?.[0]?.message?.content;
            },
            Math.min(timeoutMs, 8000),
            `groqJSON-${modelName}`,
            parentSignal,
          );

          if (text) {
            const block = extractJsonBlock(text) || text.trim();
            const parsed = JSON.parse(block) as T;
            groqPool.markSuccess(key);
            circuitBreaker.recordSuccess('tier2_groq');
            return parsed;
          }
        } catch (err) {
          if (isRateLimitError(err)) {
            groqPool.markRateLimited(key, 45000);
            keyRateLimited = true;
            break; // rotate to next key in pool
          }
          console.warn(`[LLM] Groq JSON (${modelName}) error:`, err instanceof Error ? err.message : err);
        }
      }
      if (!keyRateLimited && groqPool.getAvailableKeys().length === 0) {
        circuitBreaker.recordFailure('tier2_groq', new Error('All Groq keys exhausted'));
        break;
      }
    }
  }

  // Tier 2b / Fallback: General Chat + Block Parser
  try {
    const messages: LlmMessage[] = [
      { role: 'assistant', content: system },
      { role: 'user', content: user },
    ];
    const rawText = await llmChat(messages, { timeoutMs, abortSignal: parentSignal });
    if (rawText) {
      const block = extractJsonBlock(rawText);
      if (block) {
        return JSON.parse(block) as T;
      }
    }
  } catch {
    // Parse error
  }

  return null;
}

// ------------------------------------------------------------
// Tier 3: Deterministic Offline Safety Engine Helpers
// ------------------------------------------------------------

const DETERMINISTIC_FALLBACK_NOTE: Record<Lang, string> = {
  en: '_Clinical safety notice: Verified health guidance from Ministry of Health / WHO / UNICEF._',
  ur: '_طبی حفاظتی نوٹس: وزارت صحت / ڈبلیو ایچ او / یونیسیف کی تصدیق شدہ رہنمائی۔_',
  roman: '_Tibbi hifazati notice: Wazarat-e-Sehat / WHO / UNICEF ki tasdeeq shuda rehnumai._',
};

const DETERMINISTIC_UNVERIFIABLE_NOTE: Record<Lang, string> = {
  en: '_Clinical safety notice: Verified guidance based on standard clinical protocols._',
  ur: '_طبی حفاظتی نوٹس: معیاری طبی پروٹوکول پر مبنی تصدیق شدہ رہنمائی۔_',
  roman: '_Tibbi hifazati notice: Meyari tibbi protocols par mabni tasdeeq shuda rehnumai._',
};

const DETERMINISTIC_MED_REFUSAL: Record<Lang, (drugs: string[]) => string> = {
  en: (drugs) =>
    `**Medication decisions need a professional**\n\nI cannot recommend ${drugs.length ? `which medicine (${drugs.join(', ')})` : 'a medicine'} or what dose — the right choice depends on your health, other medicines and personal factors, and must come from a doctor or pharmacist who can examine you.\n\n• Take medicines only as they were prescribed for you\n• Never start, stop or change a dose on your own\n• A pharmacist can advise on safe general use\n\nIf you feel worse after taking any medicine, contact a doctor or call 1166 (Health Helpline) today.`,
  ur: (drugs) =>
    `**دوا کا فیصلہ ماہر کی ضرورت**\n\nمیں تجویز نہیں کر سکتا کہ کون سی دوا (${drugs.join('، ')}) اور کتنی خوراک — صحیح انتخاب آپ کی صحت، دیگر ادویات اور ذاتی امور پر منحصر ہے، اور یہ صرف ڈاکٹر یا فارماسسٹ ہی کر سکتا ہے۔\n\n• دوا صرف اسی طرح لیں جیسے آپ کے لیے تجویز ہوئی\n• اپنی مرضی سے دوا شروع، بند یا بدلیں نہیں\n• عمومی محفوظ استعمال کے لیے فارماسسٹ سے پوچھیں\n\nکوئی دوا لینے کے بعد تکلیف بڑھے تو ڈاکٹر سے رابطہ کریں یا آج 1166 (ہیلتھ ہیلپ لائن) پر کال کریں۔`,
  roman: (drugs) =>
    `**Dawa ka faisla mahir ki zaroorat**\n\nMain tajweez nahin kar sakta ke kaun si dawa (${drugs.join(', ')}) aur kitni khoraak — sahi intikhab aap ki sehat, doosri adwiyat aur zaati umoor par munhasir hai, aur yeh sirf doctor ya pharmacist hi kar sakta hai.\n\n• Dawa sirf usi tarah lein jaisi aap ke liye tayweez hui\n• Apni marzi se dawa shuru, band ya badlein nahin\n• Aam mehfooz istemal ke liye pharmacist se poochein\n\nKoi dawa lene ke baad takleef barhay to doctor se raabta karein ya aaj 1166 (Health Helpline) par call karein.`,
};

const DETERMINISTIC_CLARIFY_NOTE: Record<Lang, string> = {
  en: '**I want to help you safely**\n\nI do not have enough information yet to guide you. Please tell me:',
  ur: '**میں آپ کی محفوظ مدد کرنا چاہتا ہوں**\n\nرہنمائی کے لیے میرے پاس ابھی کافی معلومات نہیں ہیں۔ براہِ کرم بتائیں:',
  roman: '**Main aap ki mehfooz madad karna chahta hoon**\n\nRehnumai ke liye mere paas abhi kaafi maloomat nahin hain. Barah-e-karam batayein:',
};

const DETERMINISTIC_CLARIFY_FOOTER: Record<Lang, string> = {
  en: 'Call 1122 (Rescue) right away if there is chest pain, trouble breathing, heavy bleeding, a seizure, or someone cannot be woken.',
  ur: 'اگر سینے میں درد، سانس لینے میں مشکل، بھاری خون بہنا، دورہ، یا کسی کو جگایا نہ جا سکے — فوراً 1122 (ریسکیو) پر کال کریں۔',
  roman: 'Agar seene mein dard, saans lene mein mushkil, bhaari khoon behna, dora, ya kisi ko jagaya na ja sake — fori tor par 1122 (Rescue) par call karein.',
};

export function buildDeterministicAnswer(
  hits: Array<{ item: (typeof CORPUS)[number]; score: number }>,
  lang: Lang = 'en',
  noteKind: 'connection' | 'unverifiable' = 'connection',
): { content: string; citations: Citation[] } {
  const top = (hits || []).filter((h) => h && h.score > 0).slice(0, 2);
  const lines: string[] = [];
  lines.push(
    noteKind === 'connection'
      ? DETERMINISTIC_FALLBACK_NOTE[lang] || DETERMINISTIC_FALLBACK_NOTE.en
      : DETERMINISTIC_UNVERIFIABLE_NOTE[lang] || DETERMINISTIC_UNVERIFIABLE_NOTE.en,
  );

  if (top.length > 0) {
    lines.push('');
    for (const hit of top) {
      if (hit.item?.title?.[lang]) {
        lines.push(`**${hit.item.title[lang]}**`);
        lines.push('');
        lines.push(hit.item.content[lang] || '');
        lines.push('');
      }
    }
  }

  const citations: Citation[] = top.map((h) => ({
    id: h.item.id,
    title: h.item.source.title,
    publisher: h.item.source.publisher,
    url: h.item.source.url,
    license: h.item.source.license,
    verifiedAt: h.item.source.verifiedAt,
  }));

  return { content: lines.join('\n').trim(), citations };
}

export function buildMedicationRefusal(
  drugs: string[] = [],
  lang: Lang = 'en',
  hits: RetrievalHit[] = [],
): { content: string; citations: Citation[] } {
  const cleaned = drugs.filter((d) => d && d !== 'generic-medicine');
  const refusalFn = DETERMINISTIC_MED_REFUSAL[lang] || DETERMINISTIC_MED_REFUSAL.en;
  const hasAntibioticHit = hits.some((h) => h.item?.id === 'antibiotic-awareness' || (h as any).id === 'antibiotic-awareness');
  const item = hasAntibioticHit ? CORPUS.find((c) => c.id === 'antibiotic-awareness') : null;
  const citations: Citation[] = item
    ? [
        {
          id: item.id,
          title: item.source.title,
          publisher: item.source.publisher,
          url: item.source.url,
          license: item.source.license,
          verifiedAt: item.source.verifiedAt,
        },
      ]
    : [];
  return { content: refusalFn(cleaned), citations };
}

export function buildClarificationAnswer(reasons: string[] = [], lang: Lang = 'en'): string {
  const lines: string[] = [DETERMINISTIC_CLARIFY_NOTE[lang] || DETERMINISTIC_CLARIFY_NOTE.en, ''];
  const seen = new Set<string>();
  for (const reason of reasons) {
    const qs = (CLARIFICATION_QUESTIONS as Record<string, Array<Record<Lang, string>>>)[reason];
    if (!qs) continue;
    for (const q of qs) {
      const qText = q[lang] || q.en;
      if (seen.has(qText)) continue;
      seen.add(qText);
      lines.push(`• ${qText}`);
    }
  }
  lines.push('');
  lines.push(DETERMINISTIC_CLARIFY_FOOTER[lang] || DETERMINISTIC_CLARIFY_FOOTER.en);
  return lines.join('\n');
}
