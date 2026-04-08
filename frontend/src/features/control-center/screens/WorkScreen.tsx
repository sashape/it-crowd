import { WORK_COLUMNS } from '../control-center-config';
import type { Agent, Task } from '../../../types/domain';

interface WorkScreenProps {
  taskTitle: string;
  taskDescription: string;
  taskPriority: 'low' | 'medium' | 'high' | 'urgent';
  taskKind: 'analysis' | 'implementation' | 'review' | 'communication' | 'deployment' | 'external_action';
  taskRisk: 'low' | 'medium' | 'high' | 'critical';
  isCreatingTask: boolean;
  updatingTaskId: string | null;
  draggedTaskId: string | null;
  tasksByColumn: Map<Task['status'], Task[]>;
  agentsById: Map<string, Agent>;
  onTaskTitleChange: (value: string) => void;
  onTaskDescriptionChange: (value: string) => void;
  onTaskPriorityChange: (value: WorkScreenProps['taskPriority']) => void;
  onTaskKindChange: (value: WorkScreenProps['taskKind']) => void;
  onTaskRiskChange: (value: WorkScreenProps['taskRisk']) => void;
  onCreateTask: () => Promise<void>;
  onTaskDragStart: (taskId: string) => void;
  onTaskDropToStatus: (status: Task['status']) => Promise<void>;
  onTaskStatusUpdate: (taskId: string, status: Task['status']) => Promise<void>;
}

export function WorkScreen({
  agentsById,
  draggedTaskId,
  isCreatingTask,
  onCreateTask,
  onTaskDescriptionChange,
  onTaskDragStart,
  onTaskDropToStatus,
  onTaskKindChange,
  onTaskPriorityChange,
  onTaskRiskChange,
  onTaskStatusUpdate,
  onTaskTitleChange,
  taskDescription,
  taskKind,
  taskPriority,
  taskRisk,
  taskTitle,
  tasksByColumn,
  updatingTaskId,
}: WorkScreenProps): JSX.Element {
  return (
    <section className="control-pane">
      <div className="control-task-form">
        <h4>Top Task</h4>
        <p className="pane-subtitle">Set main goal and let team decompose and execute.</p>

        <input placeholder="Title" value={taskTitle} onChange={(event) => onTaskTitleChange(event.target.value)} />
        <textarea
          rows={3}
          placeholder="Description"
          value={taskDescription}
          onChange={(event) => onTaskDescriptionChange(event.target.value)}
        />

        <div className="control-inline-grid">
          <label>
            Priority
            <select value={taskPriority} onChange={(event) => onTaskPriorityChange(event.target.value as WorkScreenProps['taskPriority'])}>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="urgent">urgent</option>
            </select>
          </label>

          <label>
            Kind
            <select value={taskKind} onChange={(event) => onTaskKindChange(event.target.value as WorkScreenProps['taskKind'])}>
              <option value="analysis">analysis</option>
              <option value="implementation">implementation</option>
              <option value="review">review</option>
              <option value="communication">communication</option>
              <option value="deployment">deployment</option>
              <option value="external_action">external_action</option>
            </select>
          </label>

          <label>
            Risk
            <select value={taskRisk} onChange={(event) => onTaskRiskChange(event.target.value as WorkScreenProps['taskRisk'])}>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="critical">critical</option>
            </select>
          </label>
        </div>

        <button type="button" className="control-primary" disabled={isCreatingTask} onClick={() => void onCreateTask()}>
          {isCreatingTask ? 'Creating...' : 'Create Main Task'}
        </button>
      </div>

      <div className="kanban-grid">
        {WORK_COLUMNS.map((column) => (
          <article
            key={column.status}
            className="kanban-column"
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (!draggedTaskId) {
                return;
              }
              void onTaskDropToStatus(column.status);
            }}
          >
            <h4>{column.title}</h4>
            <ul>
              {(tasksByColumn.get(column.status) ?? []).map((task) => (
                <li key={task.id} draggable onDragStart={() => onTaskDragStart(task.id)}>
                  <p>{task.title}</p>
                  <small>{task.currentPhase}</small>
                  <small>owner: {agentsById.get(task.ownerAgentId ?? '')?.name ?? 'unassigned'}</small>

                  <label>
                    Move to
                    <select
                      value={task.status}
                      disabled={updatingTaskId === task.id}
                      onChange={(event) => void onTaskStatusUpdate(task.id, event.target.value as Task['status'])}
                    >
                      <option value="todo">todo</option>
                      <option value="in_progress">in_progress</option>
                      <option value="review">review</option>
                      <option value="blocked">blocked</option>
                      <option value="done">done</option>
                    </select>
                  </label>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

