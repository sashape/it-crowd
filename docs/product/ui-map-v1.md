# IT-CROWD UI Map v1

## 1. Goal
Make the frontend clear, controllable, and visually expressive: a dashboard-first product with a live pixel-office scene as a native part of operations, not a decorative add-on.

## 2. Product principles
- Scene-first feeling, operator-grade control.
- One source of truth for entities across all screens.
- Same actions available from multiple entry points (dashboard, table, scene, chat).
- Fast daily workflow for founder: see state -> decide -> act in 1-2 clicks.
- Warm retro-future pixel style without sacrificing readability.

## 3. Global navigation and shell

### Desktop shell
- Left rail menu (persistent):
  - `Control Center`
  - `Office Live`
  - `Work`
  - `Agents`
  - `Comms`
  - `Runs & Approvals`
  - `Events & Audit`
  - `Settings`
- Top bar:
  - global search
  - project/sprint filter
  - live status (`ws`, `api`, `queue`)
  - quick actions (`New Task`, `Message`, `Approve`, `Run`)
- Main area:
  - active screen content
- Right inspector panel (contextual):
  - selected entity details + actions
- Bottom inbox strip:
  - urgent mentions, blockages, approvals requiring founder decision

### Mobile shell
- Top compact header + status pills.
- Bottom tab bar:
  - `Dashboard`, `Work`, `Comms`, `Office`, `More`
- Inspector opens as bottom sheet.

## 4. Screen map

### 4.1 Bootstrap
Purpose:
- Initial company setup on first launch.

Must show:
- company profile
- operating mode
- initial agent pack
- first backlog seeds

Actions:
- create company
- create first tasks
- enter main app

### 4.2 Control Center (main home)
Purpose:
- Founder command center with drag-and-drop widgets.

Must show:
- KPI row: in-progress, blocked, approvals pending, lead time, active agents
- active blockers widget
- approvals queue widget
- mini kanban widget
- live chats widget
- agent load heatmap widget
- office mini-map widget

Actions:
- rearrange and resize widgets
- open entity in right inspector
- quick actions from widget headers

### 4.3 Office Live
Purpose:
- Real-time visual state of agents in office zones.

Must show:
- desk zone per agent (with computer)
- lounge/sofa zone for idle agents
- discussion/signal zone for blocked/approval states
- speech bubbles over agents

Actions:
- click agent -> open agent card in inspector
- send quick message
- open related task/chat
- toggle split mode (`50/50`, `focus scene`, `focus panels`)

### 4.4 Work
Purpose:
- Shared execution board for all participants.

Must show:
- kanban columns (`backlog`, `todo`, `in_progress`, `review`, `done`)
- swimlanes (optional): by project or priority
- blocked marker and dependencies

Actions:
- drag task between columns
- assign by drag to agent
- create/edit task inline
- open full task detail in inspector

### 4.5 Agents
Purpose:
- Full control of each agent's behavior and limits.

Must show:
- agent roster
- current load and health indicators
- role/seniority/capability cards

Actions:
- edit agent profile and operating parameters
- adjust WIP limits
- tune autonomy and escalation behavior
- review performance history

### 4.6 Comms
Purpose:
- Unified communication hub.

Must show:
- channels list
- direct messages list
- thread timeline
- mentions and unread filters

Actions:
- write to any agent/channel
- reply in thread
- pin message to task/run
- escalate to founder

### 4.7 Runs & Approvals
Purpose:
- Observe and control orchestrations and manual decisions.

Must show:
- active runs
- run stages and outcomes
- pending approvals with risk context

Actions:
- approve/reject/request changes
- restart/retry safe runs
- inspect run logs

### 4.8 Events & Audit
Purpose:
- Explainability and chronological trace.

Must show:
- event stream with filters
- who/what/when linkage to entities
- important domain transitions

Actions:
- filter by entity/type/severity
- jump from event to task/chat/run/agent

### 4.9 Settings
Purpose:
- System and visual configuration.

Must show:
- company settings
- integrations and provider config
- orchestration and policy flags
- theme and layout presets

Actions:
- save presets
- switch density/motion level
- backup/export settings

## 5. Entity management model

### Company
- `name`
- `description`
- `timezone`
- `working_hours`
- `default_priorities`
- `escalation_rules`
- `orchestration_limits`
- `ui_layout_preset`

### Agent
- `id`
- `name`
- `role` (`pm`, `tl`, `be`, `fe`, `qa`, ...)
- `seniority`
- `skills[]`
- `active`
- `max_wip`
- `autonomy_level`
- `approval_required_for[]`
- `communication_style`
- `work_schedule`
- `current_status`
- `current_task_id`

### Task
- `id`
- `title`
- `description`
- `status`
- `priority`
- `assignee_id`
- `watcher_ids[]`
- `estimate`
- `due_at`
- `blocked_by[]`
- `labels[]`
- `acceptance_criteria[]`
- `related_chat_thread_id`

### Chat / Message
- `chat_id`
- `type` (`channel`, `dm`, `task_thread`)
- `participants[]`
- `last_message_at`
- `message.id`
- `message.author_id`
- `message.content`
- `message.content_excerpt`
- `message.related_entity`

### Run / Approval / Event
- `run.id`
- `run.type`
- `run.status`
- `run.started_at`
- `run.finished_at`
- `approval.id`
- `approval.status`
- `approval.risk_level`
- `approval.expires_at`
- `event.id`
- `event.type`
- `event.payload`
- `event.created_at`

## 6. Communication UX
- All users have access to shared kanban and project channels.
- Founder can message any agent directly.
- Lead/main agent can escalate critical decisions to founder.
- Speech bubbles in `Office Live` are short, ephemeral, and always link to full thread.
- DM and task threads share one message composer model.

## 7. Drag-and-drop dashboard model

### Draggable objects
- Widgets in `Control Center`
- Tasks in `Work`
- Agent assignment chips onto task cards
- Pins (chat/thread/run) into dashboard slots

### Grid and constraints
- 12-column desktop grid, 4-column mobile grid.
- Widget sizes:
  - `S` (3x2)
  - `M` (6x2)
  - `L` (6x4)
  - `XL` (12x4)
- Hard constraints:
  - prevent overlap
  - snap-to-grid
  - keep at least one critical widget visible (`Approvals` or `Blockers`)

### Persistency and safety
- Save layout per user and preset.
- Provide `Reset layout` and `Restore last stable`.
- Keyboard fallback for accessibility (`move widget` controls).

## 8. Visual direction (warm retro-future pixel)
- Palette:
  - base warm dark (`#140f0d`, `#211815`)
  - copper/amber highlights (`#d39a6a`)
  - tech mint accents (`#8ec8ba`)
  - alert salmon (`#f3a889`)
- Typography:
  - display pixel headline
  - readable UI sans for controls and forms
- Style rules:
  - pixel-art scene assets with nearest-neighbor scaling
  - clean panel surfaces with high contrast text
  - no overloaded neon; max 2 accent colors per screen context
- Motion:
  - meaningful transitions only (agent movement, status changes, new events)
  - optional reduced-motion mode

## 9. Default layout behavior
- Default split for `Office Live`: `50/50`.
- User toggles:
  - `Focus Scene` (65/35)
  - `Balanced` (50/50)
  - `Focus Panels` (35/65)
- Remember last selected split per user.

## 10. Delivery stages
1. IA and wireframe pass (`Control Center`, `Work`, `Comms`).
2. Dashboard grid + widget framework with persistence.
3. Unified inspector and entity detail drawers.
4. Task drag-and-drop and agent assignment interactions.
5. Comms unification (channel/DM/thread composer model).
6. Office Live polish + split presets + final visual pass.

## 11. Acceptance checklist
- Interface is understandable without onboarding call.
- Founder can manage all core entities from visible UI surfaces.
- All critical decisions are reachable in <=2 interactions.
- Drag-and-drop feels stable and reversible.
- Pixel style enhances identity but does not reduce readability.
- Mobile layout preserves core workflows.

