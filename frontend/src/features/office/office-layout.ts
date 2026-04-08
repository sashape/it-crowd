import type { Agent } from '../../types/domain';
import type { OfficeZone } from './presence';

export interface Point {
  x: number;
  y: number;
}

export const OFFICE_WORLD_SIZE = {
  width: 960,
  height: 540,
};

const HUB_POINT: Point = { x: 470, y: 270 };

const DESK_POINTS: Record<Agent['role'], Point> = {
  pm: { x: 160, y: 140 },
  tl: { x: 300, y: 130 },
  be: { x: 470, y: 135 },
  fe: { x: 640, y: 140 },
  qa: { x: 790, y: 145 },
};

const LOUNGE_POINTS: Record<Agent['role'], Point> = {
  pm: { x: 180, y: 390 },
  tl: { x: 260, y: 390 },
  be: { x: 340, y: 390 },
  fe: { x: 420, y: 390 },
  qa: { x: 500, y: 390 },
};

const DISCUSSION_POINTS: Record<Agent['role'], Point> = {
  pm: { x: 580, y: 300 },
  tl: { x: 640, y: 280 },
  be: { x: 700, y: 300 },
  fe: { x: 640, y: 335 },
  qa: { x: 580, y: 335 },
};

export function getZoneTarget(zone: OfficeZone, role: Agent['role']): Point {
  if (zone === 'desk') {
    return DESK_POINTS[role];
  }

  if (zone === 'discussion') {
    return DISCUSSION_POINTS[role];
  }

  return LOUNGE_POINTS[role];
}

export function buildWaypointPath(current: Point, target: Point): Point[] {
  const deltaX = Math.abs(current.x - target.x);
  const deltaY = Math.abs(current.y - target.y);

  if (deltaX < 20 && deltaY < 20) {
    return [target];
  }

  const path: Point[] = [];
  const shouldPassHub = deltaX + deltaY > 160;
  if (shouldPassHub) {
    path.push(HUB_POINT);
  }

  path.push(target);
  return path;
}
