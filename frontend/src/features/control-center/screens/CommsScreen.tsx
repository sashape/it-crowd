import type { Agent, Message } from '../../../types/domain';
import { formatDateTime, formatSender } from '../control-center-utils';

interface CommsScreenProps {
  agents: Agent[];
  agentsById: Map<string, Agent>;
  messageFeed: Message[];
  chatRecipientId: string;
  chatText: string;
  isSendingMessage: boolean;
  onRecipientChange: (value: string) => void;
  onChatTextChange: (value: string) => void;
  onSendMessage: () => Promise<void>;
}

export function CommsScreen({
  agents,
  agentsById,
  chatRecipientId,
  chatText,
  isSendingMessage,
  messageFeed,
  onChatTextChange,
  onRecipientChange,
  onSendMessage,
}: CommsScreenProps): JSX.Element {
  return (
    <section className="control-pane">
      <div className="chat-composer">
        <h4>Founder Message</h4>
        <p className="pane-subtitle">Write directly to any agent and keep all chat history visible.</p>
        <label>
          Recipient
          <select value={chatRecipientId} onChange={(event) => onRecipientChange(event.target.value)}>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} ({agent.role.toUpperCase()})
              </option>
            ))}
          </select>
        </label>

        <textarea rows={3} placeholder="Write message to selected agent" value={chatText} onChange={(event) => onChatTextChange(event.target.value)} />

        <button type="button" className="control-primary" disabled={isSendingMessage} onClick={() => void onSendMessage()}>
          {isSendingMessage ? 'Sending...' : 'Send Message'}
        </button>
      </div>

      <div className="chat-feed">
        <h4>Team Chat Feed</h4>
        <ul>
          {messageFeed.map((message) => (
            <li key={message.id} className={message.senderType === 'agent' ? 'agent-message' : 'founder-message'}>
              <p>
                <strong>{formatSender(message, agentsById)}</strong>
                <span>{formatDateTime(message.createdAt)}</span>
              </p>
              <small>{message.threadId}</small>
              <p>{message.content}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

