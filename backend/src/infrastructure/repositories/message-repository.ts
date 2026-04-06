import type { Message } from '../../domain/models.js';
import type { DatabaseClient } from '../db/pool.js';

interface MessageRow {
  id: string;
  company_id: string;
  run_id: string | null;
  task_id: string | null;
  thread_id: string;
  message_type: Message['messageType'];
  message_schema_version: 1;
  sender_type: Message['senderType'];
  sender_agent_id: string | null;
  content: string;
  payload: Record<string, unknown>;
  mentioned_agent_id: string | null;
  requires_response: boolean;
  created_at: string;
}

function mapMessage(row: MessageRow): Message {
  return {
    id: row.id,
    companyId: row.company_id,
    runId: row.run_id,
    taskId: row.task_id,
    threadId: row.thread_id,
    messageType: row.message_type,
    messageSchemaVersion: row.message_schema_version,
    senderType: row.sender_type,
    senderAgentId: row.sender_agent_id,
    content: row.content,
    payload: row.payload,
    mentionedAgentId: row.mentioned_agent_id,
    requiresResponse: row.requires_response,
    createdAt: row.created_at,
  };
}

export class MessageRepository {
  public constructor(private readonly database: DatabaseClient) {}

  public async create(message: Message): Promise<void> {
    await this.database.query(
      `INSERT INTO messages (
        id, company_id, run_id, task_id, thread_id, message_type, message_schema_version,
        sender_type, sender_agent_id, content, payload, mentioned_agent_id, requires_response, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11::jsonb, $12, $13, $14
      )`,
      [
        message.id,
        message.companyId,
        message.runId,
        message.taskId,
        message.threadId,
        message.messageType,
        message.messageSchemaVersion,
        message.senderType,
        message.senderAgentId,
        message.content,
        JSON.stringify(message.payload),
        message.mentionedAgentId,
        message.requiresResponse,
        message.createdAt,
      ],
    );
  }

  public async countAgentMessagesByRunTask(runId: string, taskId: string): Promise<number> {
    const result = await this.database.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM messages
       WHERE run_id = $1
       AND task_id = $2
       AND sender_type = 'agent'`,
      [runId, taskId],
    );

    return Number(result.rows[0]?.count ?? '0');
  }

  public async listByCompany(companyId: string, limit = 200): Promise<Message[]> {
    const result = await this.database.query<MessageRow>(
      `SELECT id, company_id, run_id, task_id, thread_id, message_type, message_schema_version,
              sender_type, sender_agent_id, content, payload, mentioned_agent_id, requires_response, created_at
       FROM messages
       WHERE company_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [companyId, limit],
    );

    return result.rows.map(mapMessage);
  }
}