# IT-CROWD v1 Low-fi Wireframes

## Purpose
Give a concrete structural reference for the first dashboard-driven UI pass before full visual polishing.

## 1. Control Center wireframe

```text
+----------------------------------------------------------------------------------+
| Top Bar: Search | Project Filter | WS/API status | +Task +Message +Approve +Run |
+--------------------------+-------------------------------------------------------+
| Left Menu                | Main Dashboard (drag-drop grid)                      |
| - Control Center         | +------------------+ +------------------+            |
| - Office Live            | | KPI row          | | Approvals queue  |            |
| - Work                   | +------------------+ +------------------+            |
| - Agents                 | +------------------+ +------------------+            |
| - Comms                  | | Mini Kanban      | | Active Chats     |            |
| - Runs & Approvals       | +------------------+ +------------------+            |
| - Events & Audit         | +---------------------------------------+            |
| - Settings               | | Agent Load + Office Mini-map          |            |
|                          | +---------------------------------------+            |
+--------------------------+---------------------------+---------------------------+
| Bottom Inbox Strip: urgent mentions | blockers | pending founder decisions      |
+----------------------------------------------------------------------------------+
```

## 2. Work wireframe (shared Kanban)

```text
+----------------------------------------------------------------------------------+
| Work Header: Sprint filter | Assignee filter | + New Task                        |
+----------------------------------------------------------------------------------+
| Backlog      | Todo         | In Progress   | Review       | Done               |
|--------------|--------------|---------------|--------------|--------------------|
| [task card]  | [task card]  | [task card]   | [task card]  | [task card]        |
| [task card]  | [task card]  | [task card]   | [task card]  | [task card]        |
|              |              | [blocked tag] |              |                    |
+----------------------------------------------------------------------------------+
| Inspector (right): selected task details, comments, dependencies, actions        |
+----------------------------------------------------------------------------------+
```

## 3. Comms wireframe

```text
+----------------------------------------------------------------------------------+
| Comms Header: Channel/DM filter | Search | Unread only                           |
+----------------------+-----------------------------------------------------------+
| Threads list         | Message Timeline                                          |
| - #general           | Founder: top priority bug                                 |
| - #release           | TL: assigning FE + QA                                     |
| - DM: PM             | QA: blocked by missing fixture                            |
| - Task thread #42    | ...                                                       |
|                      | [composer input.....................................][Send]|
+----------------------+-----------------------------------------------------------+
| Context Links: open related task | open related run | pin to dashboard            |
+----------------------------------------------------------------------------------+
```

## 4. Interaction notes
- Widgets in Control Center are draggable and reorderable.
- Tasks are draggable across columns in Work.
- Clicking a scene bubble in Office opens related chat thread in Comms.
- Founder inbox links to exact entity requiring action.

