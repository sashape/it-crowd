import { describe, expect, it } from 'vitest';
import { enqueueBubble, getCurrentBubble, pruneBubbles } from '../bubble-queue';

describe('bubble queue', () => {
  it('keeps ordered queue and returns current visible bubble', () => {
    let queue = enqueueBubble([], 'First update', 1_000, { ttlMs: 3_000 });
    queue = enqueueBubble(queue, 'Second update', 2_000, { ttlMs: 4_000 });

    expect(queue).toHaveLength(2);
    expect(getCurrentBubble(queue, 2_100)?.text).toBe('First update');
  });

  it('prunes expired bubbles', () => {
    let queue = enqueueBubble([], 'First', 1_000, { ttlMs: 1_000 });
    queue = enqueueBubble(queue, 'Second', 1_500, { ttlMs: 4_000 });

    const pruned = pruneBubbles(queue, 2_100);
    expect(pruned).toHaveLength(1);
    expect(pruned[0].text).toBe('Second');
    expect(getCurrentBubble(pruned, 2_100)?.text).toBe('Second');
  });
});
