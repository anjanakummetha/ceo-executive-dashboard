/** Extract first JSON object or array from model output */
export function extractJson<T>(text: string): T {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const block = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (block?.[1]) return JSON.parse(block[1].trim()) as T;
    const startObj = trimmed.indexOf('{');
    const startArr = trimmed.indexOf('[');
    const start =
      startObj === -1 ? startArr : startArr === -1 ? startObj : Math.min(startObj, startArr);
    if (start === -1) throw new Error('No JSON in Hermes response');
    const opener = trimmed[start];
    const closer = opener === '{' ? '}' : ']';
    let depth = 0;
    for (let i = start; i < trimmed.length; i++) {
      if (trimmed[i] === opener) depth++;
      if (trimmed[i] === closer) depth--;
      if (depth === 0) return JSON.parse(trimmed.slice(start, i + 1)) as T;
    }
    throw new Error('Unbalanced JSON in Hermes response');
  }
}
