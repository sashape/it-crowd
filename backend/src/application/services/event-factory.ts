import type { DomainEvent } from '~/domain/models.js';
import { createId, nowIso } from '~/application/services/utils.js';

export function createDomainEvent(input: Omit<DomainEvent, 'eventId' | 'ts'>): DomainEvent {
  return {
    ...input,
    eventId: createId(),
    ts: nowIso(),
  };
}