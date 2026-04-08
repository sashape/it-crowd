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

export const DESK_POINTS: Record<Agent['role'], Point> = {
  pm: { x: 150, y: 170 },
  tl: { x: 290, y: 162 },
  be: { x: 450, y: 162 },
  fe: { x: 610, y: 165 },
  qa: { x: 770, y: 170 },
};

export const LOUNGE_POINTS: Record<Agent['role'], Point> = {
  pm: { x: 166, y: 420 },
  tl: { x: 216, y: 420 },
  be: { x: 266, y: 420 },
  fe: { x: 316, y: 420 },
  qa: { x: 366, y: 420 },
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
