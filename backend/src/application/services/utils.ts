import { createHash } from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';

export function createId(): string {
  return uuidv4();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function hashPayload(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export function stableNumberFromString(input: string): number {
  const hash = createHash('sha256').update(input).digest('hex').slice(0, 8);
  return parseInt(hash, 16);
}