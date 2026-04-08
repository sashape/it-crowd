import type { Agent } from '../../../types/domain';
import type { AgentDraft } from '../control-center-config';

interface AgentsScreenProps {
  agents: Agent[];
  selectedAgent: Agent | null;
  agentDraft: AgentDraft | null;
  isSavingAgent: boolean;
  onAgentSelect: (agentId: string) => void;
  onAgentDraftChange: (nextDraft: AgentDraft) => void;
  onSaveAgent: () => Promise<void>;
}

export function AgentsScreen({
  agentDraft,
  agents,
  isSavingAgent,
  onAgentDraftChange,
  onAgentSelect,
  onSaveAgent,
  selectedAgent,
}: AgentsScreenProps): JSX.Element {
  if (!selectedAgent || !agentDraft) {
    return (
      <section className="control-pane">
        <h4>Agents</h4>
        <p className="pane-subtitle">No agents available.</p>
      </section>
    );
  }

  return (
    <section className="control-pane">
      <h4>Agent Management</h4>
      <p className="pane-subtitle">Tune role, runtime, delegation, and behavior policy for each agent.</p>

      <div className="control-agent-list">
        {agents.map((agent) => (
          <button key={agent.id} type="button" className={agent.id === selectedAgent.id ? 'is-active' : ''} onClick={() => onAgentSelect(agent.id)}>
            {agent.name} ({agent.role.toUpperCase()})
          </button>
        ))}
      </div>

      <div className="control-form-grid">
        <label>
          Name
          <input value={agentDraft.name} onChange={(event) => onAgentDraftChange({ ...agentDraft, name: event.target.value })} />
        </label>

        <label>
          Role
          <select value={agentDraft.role} onChange={(event) => onAgentDraftChange({ ...agentDraft, role: event.target.value as Agent['role'] })}>
            <option value="pm">PM</option>
            <option value="tl">TL</option>
            <option value="be">BE</option>
            <option value="fe">FE</option>
            <option value="qa">QA</option>
          </select>
        </label>

        <label>
          Status
          <select
            value={agentDraft.status}
            onChange={(event) => onAgentDraftChange({ ...agentDraft, status: event.target.value as Agent['status'] })}
          >
            <option value="idle">idle</option>
            <option value="busy">busy</option>
            <option value="blocked">blocked</option>
            <option value="offline">offline</option>
          </select>
        </label>

        <label>
          Manager
          <select
            value={agentDraft.manager_agent_id ?? ''}
            onChange={(event) => onAgentDraftChange({ ...agentDraft, manager_agent_id: event.target.value || null })}
          >
            <option value="">none</option>
            {agents
              .filter((agent) => agent.id !== selectedAgent.id)
              .map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
          </select>
        </label>

        <label>
          Model Profile
          <input value={agentDraft.model_profile} onChange={(event) => onAgentDraftChange({ ...agentDraft, model_profile: event.target.value })} />
        </label>

        <label>
          Runtime Kind
          <select
            value={agentDraft.runtime_kind}
            onChange={(event) => onAgentDraftChange({ ...agentDraft, runtime_kind: event.target.value as Agent['runtimeKind'] })}
          >
            <option value="mock_runtime">mock_runtime</option>
            <option value="openclaw">openclaw</option>
          </select>
        </label>

        <label>
          Delegation Limit
          <input
            type="number"
            min={0}
            max={20}
            value={agentDraft.delegation_limit}
            onChange={(event) =>
              onAgentDraftChange({
                ...agentDraft,
                delegation_limit: Number.isFinite(Number(event.target.value)) ? Number(event.target.value) : 0,
              })
            }
          />
        </label>

        <label className="control-field-wide">
          Specialization Hint
          <input
            value={agentDraft.specialization_hint}
            onChange={(event) => onAgentDraftChange({ ...agentDraft, specialization_hint: event.target.value })}
          />
        </label>

        <label className="control-field-wide">
          Responsibilities (one per line)
          <textarea
            rows={4}
            value={agentDraft.responsibilities_text}
            onChange={(event) => onAgentDraftChange({ ...agentDraft, responsibilities_text: event.target.value })}
          />
        </label>

        <label className="control-field-wide">
          Tool Policy (JSON)
          <textarea
            rows={6}
            value={agentDraft.tool_policy_text}
            onChange={(event) => onAgentDraftChange({ ...agentDraft, tool_policy_text: event.target.value })}
          />
        </label>
      </div>

      <button type="button" className="control-primary" disabled={isSavingAgent} onClick={() => void onSaveAgent()}>
        {isSavingAgent ? 'Saving...' : 'Save Agent Settings'}
      </button>
    </section>
  );
}

