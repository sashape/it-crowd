import { describe, expect, it } from 'vitest';
import { TaskArtifactSchema } from '../../src/domain/schemas.js';

describe('TaskArtifactSchema', () => {
  it('validates minimal artifact contract', () => {
    const parsed = TaskArtifactSchema.parse({
      artifact_type: 'runtime_output',
      title: 'Execution output',
      uri_or_inline: 'inline://result',
      produced_by_agent_id: '2f7f9b38-3663-4ce9-aebd-2678f4db6634',
      task_id: 'e99668a8-c9cb-4b0a-9b4d-f82a69497f15',
      created_at: '2026-04-06T10:00:00Z',
    });

    expect(parsed.artifact_type).toBe('runtime_output');
  });

  it('rejects malformed artifact payload', () => {
    const result = TaskArtifactSchema.safeParse({
      artifact_type: 'runtime_output',
    });

    expect(result.success).toBe(false);
  });
});