import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

type ClaudeCreds = { accessToken?: string; refreshToken?: string; expiresAt?: number };

function loadClaudeCodeOAuthToken(): string | undefined {
  const credPath = join(homedir(), '.claude', '.credentials.json');
  if (!existsSync(credPath)) return undefined;
  try {
    const raw = JSON.parse(readFileSync(credPath, 'utf8')) as {
      claudeAiOauth?: ClaudeCreds;
    };
    const oauth = raw.claudeAiOauth;
    if (!oauth?.accessToken) return undefined;
    const expiresAt = oauth.expiresAt ?? 0;
    if (expiresAt > 0 && Date.now() > expiresAt) return undefined;
    return oauth.accessToken;
  } catch {
    return undefined;
  }
}

function loadHermesAnthropicKey(): string | undefined {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  if (process.env.ANTHROPIC_TOKEN) return process.env.ANTHROPIC_TOKEN;
  // In production the VPS service account must depend only on the env key —
  // never a developer's OAuth credential file or a stray ~/.hermes/.env.
  if (process.env.NODE_ENV === 'production') return undefined;
  const claude = loadClaudeCodeOAuthToken();
  if (claude) return claude;
  const envPath = join(homedir(), '.hermes', '.env');
  if (!existsSync(envPath)) return undefined;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^ANTHROPIC_(?:API_KEY|TOKEN)=(.+)$/);
    if (m) return m[1].trim();
  }
  return undefined;
}

// Current default model for the dashboard's summarization calls. Override with
// HERMES_INFERENCE_MODEL (e.g. a Haiku-tier model to cut cost).
const DEFAULT_INFERENCE_MODEL = 'claude-sonnet-5';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isOAuthAnthropicKey(key: string): boolean {
  if (key.startsWith('sk-ant-api')) return false;
  if (key.startsWith('sk-ant-')) return true;
  if (key.startsWith('eyJ') || key.startsWith('cc-')) return true;
  return false;
}

/** Run Hermes one-shot (`hermes -z`) — uses Composio MCP + configured model */
export async function runHermesPrompt(
  prompt: string,
  timeoutMs = Number(process.env.HERMES_TIMEOUT_MS) || 180_000,
): Promise<string> {
  const bin = process.env.HERMES_CLI_PATH || 'hermes';
  const pathEnv = `${process.env.HOME}/.local/bin:${process.env.PATH || ''}`;

  return new Promise((resolve, reject) => {
    const child = spawn(bin, ['-z', prompt, '--yolo'], {
      env: { ...process.env, PATH: pathEnv },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (c) => {
      stdout += c.toString();
    });
    child.stderr.on('data', (c) => {
      stderr += c.toString();
    });
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`Hermes timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.on('close', (code) => {
      clearTimeout(timer);
      const out = stdout.trim() || stderr.trim();
      if (code !== 0 && !stdout.trim()) {
        reject(new Error(out || `Hermes exited ${code}`));
        return;
      }
      resolve(out);
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

/** Direct Anthropic fallback when CLI unavailable (same prompts).
 * Retries once on transient (429/529/5xx) errors, and once more with a doubled
 * output cap if the model truncates (stop_reason=max_tokens). */
export async function runAnthropicPrompt(
  prompt: string,
  timeoutMs = 120_000,
  maxTokens = 8192,
): Promise<string> {
  const apiKey = loadHermesAnthropicKey();
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set (env, or dev credential files)');

  const model = process.env.HERMES_INFERENCE_MODEL || DEFAULT_INFERENCE_MODEL;
  const oauth = isOAuthAnthropicKey(apiKey);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
  };
  if (oauth) {
    headers.Authorization = `Bearer ${apiKey}`;
    headers['anthropic-beta'] = 'oauth-2025-04-20';
  } else {
    headers['x-api-key'] = apiKey;
  }

  const body = JSON.stringify({
    model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });

  // Up to 2 attempts on transient failures with backoff honoring retry-after.
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });
      if (!res.ok) {
        const retryable = res.status === 429 || res.status === 529 || res.status >= 500;
        const errJson = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        if (retryable && attempt === 0) {
          const retryAfter = Number(res.headers.get('retry-after')) || 0;
          await sleep(retryAfter > 0 ? retryAfter * 1000 : 500 + Math.random() * 500);
          lastErr = new Error(errJson.error?.message || `Anthropic ${res.status}`);
          continue;
        }
        throw new Error(errJson.error?.message || `Anthropic ${res.status}`);
      }
      const json = (await res.json()) as {
        content?: Array<{ type: string; text?: string }>;
        stop_reason?: string;
      };
      const text = json.content?.find((c) => c.type === 'text')?.text ?? '';
      if (!text) throw new Error('Empty Anthropic response');
      // Truncated JSON would break extractJson — retry once with a bigger cap.
      if (json.stop_reason === 'max_tokens' && maxTokens < 32768) {
        return runAnthropicPrompt(prompt, timeoutMs, maxTokens * 2);
      }
      return text;
    } catch (e) {
      lastErr = e as Error;
      if (attempt === 1) throw lastErr;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr ?? new Error('Anthropic request failed');
}

export async function runHermesCompletion(prompt: string): Promise<string> {
  if (process.env.HERMES_DISABLE_CLI === 'true') {
    return runAnthropicPrompt(prompt);
  }
  try {
    return await runHermesPrompt(prompt);
  } catch (e) {
    console.warn('[hermes] CLI failed, trying Anthropic fallback:', e);
    return runAnthropicPrompt(prompt);
  }
}

/**
 * Anthropic completion with server-side web search enabled — for grounded research
 * (e.g. attendee pre-meeting briefs). Anthropic runs the searches and returns the
 * final answer in one response; we join its text blocks. Read-only / outbound only.
 */
export async function runAnthropicResearch(
  prompt: string,
  timeoutMs = 150_000,
  maxTokens = 8192,
  maxSearches = 4,
): Promise<string> {
  const apiKey = loadHermesAnthropicKey();
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
  const model = process.env.HERMES_INFERENCE_MODEL || DEFAULT_INFERENCE_MODEL;
  const oauth = isOAuthAnthropicKey(apiKey);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
  };
  if (oauth) {
    headers.Authorization = `Bearer ${apiKey}`;
    headers['anthropic-beta'] = 'oauth-2025-04-20';
  } else {
    headers['x-api-key'] = apiKey;
  }
  const body = JSON.stringify({
    model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: maxSearches }],
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    });
    if (!res.ok) {
      const errJson = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      throw new Error(errJson.error?.message || `Anthropic ${res.status}`);
    }
    const json = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = (json.content ?? [])
      .filter((c) => c.type === 'text')
      .map((c) => c.text ?? '')
      .join('\n')
      .trim();
    if (!text) throw new Error('Empty research response');
    return text;
  } finally {
    clearTimeout(timer);
  }
}

/** Research-grade completion with graceful fallback to no-search if web search is unavailable. */
export async function runHermesResearch(prompt: string): Promise<string> {
  try {
    return await runAnthropicResearch(prompt);
  } catch (e) {
    console.warn('[hermes] web research failed, falling back to no-search:', e);
    return runAnthropicPrompt(prompt);
  }
}
