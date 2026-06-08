import OpenAI from 'openai';
import { BrowserWindow } from 'electron';

const BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const API_KEY = process.env.OPENAI_API_KEY || '';
const TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || '60000'); // default 60s
const MODEL = process.env.OPENAI_MODEL || 'deepseek-r1-distill-qwen-1.5b';
const DEBUG = process.env.DEBUG_CHAT === 'true' || process.env.NODE_ENV !== 'production';
const TEMP = Number(process.env.OPENAI_TEMP) || 0.7;
const MAX_TOKENS = Number(process.env.OPENAI_MAX_TOKENS) || 1024;

if (!API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable — required in production');
}

const client = new OpenAI({
  baseURL: BASE_URL,
  apiKey: API_KEY,
  timeout: TIMEOUT_MS,
});

const controllers = new Map<string, AbortController>();

/**
 * 尝试把 AI 返回的文本提取为干净的 JSON 字符串。
 * 说明：对复杂或非平衡大括号的场景不保证 100% 正确，生产环境下应再做 JSON.parse 验证。
 */
function cleanAIResponse(rawContent: string) {
  let cleaned = rawContent.replace(/<\/?think>/g, '');
  cleaned = cleaned.replace(/^[\s\S]*?(\{[\s\S]*\})[\s\S]*$/, '$1');
  // 移除不可见控制字符（0-31, 127-159）并去除首尾空白
  const filtered = cleaned
    .split('')
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return !((code >= 0 && code <= 31) || (code >= 127 && code <= 159));
    })
    .join('');
  return filtered.trim();
}

export async function startChat(requestId: string, message: string, window: BrowserWindow | null) {
  const controller = new AbortController();
  controllers.set(requestId, controller);
  const timeout = setTimeout(() => {
    controller.abort();
    controllers.delete(requestId);
    if (window && !window.isDestroyed()) {
      window.webContents.send('chat-error', { requestId, error: 'Timeout: Proses terlalu lama' });
    }
  }, TIMEOUT_MS);

  try {
    const completion = await client.chat.completions.create(
      {
        model: MODEL,
        messages: [
          { role: 'system', content: `test system` },
          { role: 'user', content: message },
        ],
        temperature: TEMP,
        max_tokens: MAX_TOKENS,
        stream: false,
      },
      { signal: controller.signal },
    );

    const rawContent = completion.choices[0]?.message?.content || '';
    if (DEBUG) {
      console.debug(`[chat:${requestId}] raw response length=${rawContent.length}`);
    }

    const cleanedContent = cleanAIResponse(rawContent);

    if (DEBUG) {
      console.debug(`[chat:${requestId}] cleaned response length=${cleanedContent.length}`);
    }

    if (window && !window.isDestroyed()) {
      window.webContents.send('chat-update', { requestId, data: cleanedContent });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (DEBUG) {
      console.error(`[chat:${requestId}] error:`, err);
    }
    if (window && !window.isDestroyed()) {
      window.webContents.send('chat-error', { requestId, error: message });
    }
  } finally {
    clearTimeout(timeout);
    controllers.delete(requestId);
  }
}

export function cancelChat(requestId: string) {
  const c = controllers.get(requestId);
  if (c) {
    c.abort();
    controllers.delete(requestId);
  }
}
