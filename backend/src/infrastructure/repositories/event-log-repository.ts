import type { DomainEvent } from '../../domain/models.js';
import type { DatabaseClient } from '../db/pool.js';

interface EventRow {
  event_id: string;
  event_type: DomainEvent['eventType'];
  company_id: string;
  run_id: string;
  trace_id: string;
  entity_type: string;
  entity_id: string;
  caused_by_type: DomainEvent['causedByType'];
  caused_by_id: string;
  ts: string;
  payload: Record<string, unknown>;
}

function mapEvent(row: EventRow): DomainEvent {
  return {
    eventId: row.event_id,
    eventType: row.event_type,
    companyId: row.company_id,
    runId: row.run_id,
    traceId: row.trace_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    causedByType: row.caused_by_type,
    causedById: row.caused_by_id,
    ts: row.ts,
    payload: row.payload,
  };
}

export class EventLogRepository {
  public constructor(private readonly database: DatabaseClient) {}

  public async append(event: DomainEvent): Promise<void> {
    await this.database.query(
      `INSERT INTO event_log (
        event_id, company_id, run_id, trace_id, event_type, entity_type,
        entity_id, caused_by_type, caused_by_id, payload, ts
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10::jsonb, $11
      )`,
      [
        event.eventId,
        event.companyId,
        event.runId,
        event.traceId,
        event.eventType,
        event.entityType,
        event.entityId,
        event.causedByType,
        event.causedById,
        JSON.stringify(event.payload),
        event.ts,
      ],
    );
  }

  public async listByCompany(companyId: string, limit = 300): Promise<DomainEvent[]> {
    const result = await this.database.query<EventRow>(
      `SELECT event_id, event_type, company_id, run_id, trace_id, entity_type,
              entity_id, caused_by_type, caused_by_id, ts, payload
       FROM event_log
       WHERE company_id = $1
       ORDER BY ts DESC
       LIMIT $2`,
      [companyId, limit],
    );

    return result.rows.map(mapEvent);
  }
}