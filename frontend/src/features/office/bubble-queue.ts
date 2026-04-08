export interface BubbleEntry {
  id: string;
  text: string;
  expiresAt: number;
}

function normalizeBubbleText(input: string): string {
  const normalized = input.replace(/\s+/g, ' ').trim();
  if (normalized.length <= 72) {
    return normalized;
  }

  return `${normalized.slice(0, 71).trimEnd()}…`;
}

export function enqueueBubble(
  queue: BubbleEntry[],
  text: string,
  now: number,
  options: { ttlMs?: number; maxSize?: number } = {},
): BubbleEntry[] {
  const cleaned = normalizeBubbleText(text);
  if (!cleaned) {
    return queue;
  }

  const ttlMs = options.ttlMs ?? 6_000;
  const maxSize = options.maxSize ?? 4;
  const nextQueue = [...queue, { id: `${now}-${queue.length}`, text: cleaned, expiresAt: now + ttlMs }];
  return nextQueue.slice(-maxSize);
}

export function pruneBubbles(queue: BubbleEntry[], now: number): BubbleEntry[] {
  return queue.filter((item) => item.expiresAt > now);
}

export function getCurrentBubble(queue: BubbleEntry[], now: number): BubbleEntry | null {
  const alive = pruneBubbles(queue, now);
  if (alive.length === 0) {
    return null;
  }

  return alive[0];
}

