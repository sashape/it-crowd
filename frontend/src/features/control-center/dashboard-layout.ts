export type DashboardScreen = 'dashboard' | 'work' | 'agents' | 'comms' | 'runs' | 'events';

export type DashboardWidgetId = 'kpi' | 'blockers' | 'approvals' | 'kanban' | 'chats' | 'load' | 'office';
export type DashboardWidgetSize = 's' | 'm' | 'l' | 'xl';

export interface DashboardLayoutState {
  order: DashboardWidgetId[];
  sizes: Record<DashboardWidgetId, DashboardWidgetSize>;
}

const STORAGE_KEY = 'it-crowd.dashboard-layout.v1';

export const DASHBOARD_WIDGET_ORDER: DashboardWidgetId[] = ['kpi', 'blockers', 'approvals', 'kanban', 'chats', 'load', 'office'];

export const DASHBOARD_WIDGET_SIZES: Record<DashboardWidgetId, DashboardWidgetSize> = {
  kpi: 'xl',
  blockers: 'm',
  approvals: 'm',
  kanban: 'l',
  chats: 'l',
  load: 'm',
  office: 'm',
};

const sizeCycle: DashboardWidgetSize[] = ['s', 'm', 'l', 'xl'];

export function createDefaultDashboardLayout(): DashboardLayoutState {
  return {
    order: [...DASHBOARD_WIDGET_ORDER],
    sizes: { ...DASHBOARD_WIDGET_SIZES },
  };
}

function isWidgetId(value: unknown): value is DashboardWidgetId {
  return typeof value === 'string' && DASHBOARD_WIDGET_ORDER.includes(value as DashboardWidgetId);
}

function isWidgetSize(value: unknown): value is DashboardWidgetSize {
  return typeof value === 'string' && sizeCycle.includes(value as DashboardWidgetSize);
}

function normalizeOrder(order: unknown): DashboardWidgetId[] {
  if (!Array.isArray(order)) {
    return [...DASHBOARD_WIDGET_ORDER];
  }

  const filtered: DashboardWidgetId[] = [];
  for (const item of order) {
    if (!isWidgetId(item)) {
      continue;
    }

    if (!filtered.includes(item)) {
      filtered.push(item);
    }
  }

  for (const widgetId of DASHBOARD_WIDGET_ORDER) {
    if (!filtered.includes(widgetId)) {
      filtered.push(widgetId);
    }
  }

  return filtered;
}

function normalizeSizes(sizes: unknown): Record<DashboardWidgetId, DashboardWidgetSize> {
  const result = { ...DASHBOARD_WIDGET_SIZES };
  if (!sizes || typeof sizes !== 'object' || Array.isArray(sizes)) {
    return result;
  }

  for (const widgetId of DASHBOARD_WIDGET_ORDER) {
    const candidate = (sizes as Record<string, unknown>)[widgetId];
    if (isWidgetSize(candidate)) {
      result[widgetId] = candidate;
    }
  }

  return result;
}

export function parseDashboardLayout(raw: string | null): DashboardLayoutState {
  if (!raw) {
    return createDefaultDashboardLayout();
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return createDefaultDashboardLayout();
    }

    const source = parsed as { order?: unknown; sizes?: unknown };
    return {
      order: normalizeOrder(source.order),
      sizes: normalizeSizes(source.sizes),
    };
  } catch {
    return createDefaultDashboardLayout();
  }
}

export function loadDashboardLayout(storage: Pick<Storage, 'getItem'>): DashboardLayoutState {
  return parseDashboardLayout(storage.getItem(STORAGE_KEY));
}

export function saveDashboardLayout(storage: Pick<Storage, 'setItem'>, layout: DashboardLayoutState): void {
  storage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      order: normalizeOrder(layout.order),
      sizes: normalizeSizes(layout.sizes),
    }),
  );
}

export function reorderWidgets(
  order: DashboardWidgetId[],
  draggedId: DashboardWidgetId,
  targetId: DashboardWidgetId,
): DashboardWidgetId[] {
  if (draggedId === targetId) {
    return order;
  }

  const next = [...order];
  const from = next.indexOf(draggedId);
  const to = next.indexOf(targetId);
  if (from < 0 || to < 0) {
    return next;
  }

  next.splice(from, 1);
  next.splice(to, 0, draggedId);
  return next;
}

export function getNextWidgetSize(size: DashboardWidgetSize): DashboardWidgetSize {
  const index = sizeCycle.indexOf(size);
  if (index < 0) {
    return 'm';
  }

  return sizeCycle[(index + 1) % sizeCycle.length];
}

