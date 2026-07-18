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

/** Direct Anthropic fallback when CLI unavailable (same prompts) */
export async function runAnthropicPrompt(
  prompt: string,
  timeoutMs = 120_000,
): Promise<string> {
  const apiKey = loadHermesAnthropicKey();
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set (Hermes .env or process env)');

  const model = process.env.HERMES_INFERENCE_MODEL || 'claude-sonnet-4-20250514';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const oauth = isOAuthAnthropicKey(apiKey);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
  };
  if (oauth) {
    headers.Authorization = `Bearer ${apiKey}`;
    headers['anthropic-beta'] = 'prompt-caching-2024-07-31';
  } else {
    headers['x-api-key'] = apiKey;
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });
    const json = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
      error?: { message?: string };
    };
    if (!res.ok) throw new Error(json.error?.message || `Anthropic ${res.status}`);
    const text = json.content?.find((c) => c.type === 'text')?.text ?? '';
    if (!text) throw new Error('Empty Anthropic response');
    return text;
  } finally {
    clearTimeout(timer);
  }
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
