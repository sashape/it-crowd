import { describe, expect, it } from 'vitest';
import {
  createDefaultDashboardLayout,
  getNextWidgetSize,
  parseDashboardLayout,
  reorderWidgets,
} from './dashboard-layout';

describe('dashboard layout helpers', () => {
  it('parses valid custom order and keeps missing widgets appended', () => {
    const parsed = parseDashboardLayout(
      JSON.stringify({
        order: ['approvals', 'kpi', 'chats'],
        sizes: { kpi: 'xl', chats: 's' },
      }),
    );

    expect(parsed.order[0]).toBe('approvals');
    expect(parsed.order[1]).toBe('kpi');
    expect(parsed.order).toContain('kanban');
    expect(parsed.sizes.kpi).toBe('xl');
    expect(parsed.sizes.chats).toBe('s');
  });

  it('falls back to defaults for malformed input', () => {
    expect(parseDashboardLayout('{not json')).toEqual(createDefaultDashboardLayout());
    expect(parseDashboardLayout(JSON.stringify({ order: ['unknown'] }))).toEqual(createDefaultDashboardLayout());
  });

  it('reorders widgets deterministically', () => {
    const next = reorderWidgets(['kpi', 'blockers', 'approvals', 'kanban', 'chats', 'load', 'office'], 'office', 'blockers');
    expect(next).toEqual(['kpi', 'office', 'blockers', 'approvals', 'kanban', 'chats', 'load']);
  });

  it('cycles widget size in expected sequence', () => {
    expect(getNextWidgetSize('s')).toBe('m');
    expect(getNextWidgetSize('m')).toBe('l');
    expect(getNextWidgetSize('l')).toBe('xl');
    expect(getNextWidgetSize('xl')).toBe('s');
  });
});

