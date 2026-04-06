import type { DomainEvent } from '~/domain/models.js';
import type { EventLogRepository } from '~/infrastructure/repositories/event-log-repository.js';

type EventSubscriber = (event: DomainEvent) => void;

export class EventBus {
  private readonly subscribers = new Set<EventSubscriber>();

  public constructor(private readonly eventLogRepository: EventLogRepository) {}

  public subscribe(subscriber: EventSubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  public async publish(event: DomainEvent): Promise<void> {
    await this.eventLogRepository.append(event);
    for (const subscriber of this.subscribers) {
      subscriber(event);
    }
  }
}