import type { DomainEvent } from '../../../types/domain';
import { formatDateTime, formatEventTitle } from '../control-center-utils';

interface EventsScreenProps {
  recentEvents: DomainEvent[];
}

export function EventsScreen({ recentEvents }: EventsScreenProps): JSX.Element {
  return (
    <section className="control-pane">
      <h4>Events and Audit</h4>
      <p className="pane-subtitle">Chronological explainability feed.</p>
      <ul className="dashboard-list">
        {recentEvents.length === 0 ? <li>No events yet.</li> : null}
        {recentEvents.map((event) => (
          <li key={event.eventId}>
            <p>{formatEventTitle(event)}</p>
            <small>
              {formatDateTime(event.ts)} · caused by {event.causedByType}:{event.causedById}
            </small>
          </li>
        ))}
      </ul>
    </section>
  );
}

