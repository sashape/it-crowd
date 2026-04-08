import { useEffect, useRef } from 'react';
import {
  Application,
  Container,
  Graphics,
  SCALE_MODES,
  Sprite,
  Text,
  TextStyle,
  Texture,
  type FederatedPointerEvent,
} from 'pixi.js';
import type { Agent } from '../../types/domain';
import { buildWaypointPath, DESK_POINTS, getZoneTarget, OFFICE_WORLD_SIZE, type Point } from './office-layout';
import { createOfficeTextures, type OfficeTextures } from './pixel-assets';
import type { AgentPresence } from './presence';

interface OfficeSceneProps {
  agents: Agent[];
  presenceByAgent: Record<string, AgentPresence>;
  bubbleTextByAgent: Record<string, string | null>;
  selectedAgentId: string | null;
  onAgentSelect: (agentId: string) => void;
}

interface AgentRuntime {
  id: string;
  role: Agent['role'];
  container: Container;
  sprite: Sprite;
  shadow: Graphics;
  label: Text;
  bubbleContainer: Container;
  bubbleBackground: Graphics;
  bubbleText: Text;
  position: Point;
  zone: AgentPresence['zone'];
  path: Point[];
  idlePhase: number;
}

const FONT_TITLE = new TextStyle({
  fontFamily: '"VT323", monospace',
  fontSize: 28,
  fill: 0xe9c39d,
  letterSpacing: 1.5,
});

const FONT_LABEL = new TextStyle({
  fontFamily: '"VT323", monospace',
  fontSize: 20,
  fill: 0xf5e5d2,
  letterSpacing: 1,
  stroke: 0x1a1210,
  strokeThickness: 3,
});

const FONT_BUBBLE = new TextStyle({
  fontFamily: '"Chakra Petch", sans-serif',
  fontSize: 12,
  fill: 0xfff6eb,
  wordWrap: true,
  wordWrapWidth: 160,
  breakWords: true,
});

const ROLE_ORDER: Agent['role'][] = ['pm', 'tl', 'be', 'fe', 'qa'];

function stablePhaseFromId(agentId: string): number {
  let hash = 0;
  for (let index = 0; index < agentId.length; index += 1) {
    hash = (hash * 31 + agentId.charCodeAt(index)) >>> 0;
  }

  return (hash % 628) / 100;
}

function truncateBubbleText(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= 90) {
    return normalized;
  }

  return `${normalized.slice(0, 89).trimEnd()}...`;
}

function createBackdrop(world: Container, textures: OfficeTextures): Graphics {
  const floor = new Graphics();
  floor.beginFill(0x2b1d1a);
  floor.drawRect(0, 0, OFFICE_WORLD_SIZE.width, OFFICE_WORLD_SIZE.height);
  floor.endFill();

  floor.beginFill(0x201613);
  floor.drawRect(0, 0, OFFICE_WORLD_SIZE.width, 68);
  floor.endFill();

  floor.beginFill(0x251a17);
  floor.drawRect(0, 68, OFFICE_WORLD_SIZE.width, 10);
  floor.endFill();

  for (let x = 0; x < OFFICE_WORLD_SIZE.width; x += 24) {
    floor.lineStyle({ color: 0x3c2a25, width: 1, alpha: 0.45 });
    floor.moveTo(x, 80);
    floor.lineTo(x, OFFICE_WORLD_SIZE.height);
  }

  for (let y = 80; y < OFFICE_WORLD_SIZE.height; y += 24) {
    floor.lineStyle({ color: 0x3c2a25, width: 1, alpha: 0.4 });
    floor.moveTo(0, y);
    floor.lineTo(OFFICE_WORLD_SIZE.width, y);
  }

  world.addChild(floor);

  const zoneBands = new Graphics();
  zoneBands.beginFill(0x3a2a22, 0.24);
  zoneBands.drawRoundedRect(56, 92, 848, 124, 10);
  zoneBands.endFill();

  zoneBands.beginFill(0x2a202a, 0.23);
  zoneBands.drawRoundedRect(520, 240, 248, 126, 10);
  zoneBands.endFill();

  zoneBands.beginFill(0x332722, 0.28);
  zoneBands.drawRoundedRect(72, 346, 476, 126, 10);
  zoneBands.endFill();
  world.addChild(zoneBands);

  const title = new Text('IT-CROWD OPERATIONS', FONT_TITLE);
  title.position.set(24, 16);
  world.addChild(title);

  for (const role of ROLE_ORDER) {
    const point = DESK_POINTS[role];

    const station = new Sprite(textures.workstation);
    station.position.set(point.x - 30, point.y - 66);
    station.zIndex = 30;
    world.addChild(station);

    const monitorGlow = new Sprite(textures.monitorGlow);
    monitorGlow.position.set(point.x - 22, point.y - 70);
    monitorGlow.alpha = 0.21;
    monitorGlow.scale.set(0.8, 0.7);
    monitorGlow.zIndex = 29;
    world.addChild(monitorGlow);
  }

  const sofa = new Sprite(textures.sofa);
  sofa.position.set(95, 355);
  sofa.scale.set(1.9, 1.1);
  sofa.zIndex = 20;
  world.addChild(sofa);

  const plant = new Sprite(textures.plant);
  plant.position.set(860, 350);
  plant.zIndex = 20;
  world.addChild(plant);

  const scanline = new Graphics();
  for (let y = 0; y < OFFICE_WORLD_SIZE.height; y += 4) {
    scanline.beginFill(0x140f0d, 0.06);
    scanline.drawRect(0, y, OFFICE_WORLD_SIZE.width, 2);
    scanline.endFill();
  }
  scanline.zIndex = 900;
  world.addChild(scanline);

  return scanline;
}
function setBubble(runtime: AgentRuntime, value: string | null): void {
  const message = value ? truncateBubbleText(value) : '';
  if (!message) {
    runtime.bubbleContainer.visible = false;
    return;
  }

  runtime.bubbleText.text = message;
  runtime.bubbleText.position.set(0, -56);
  runtime.bubbleText.anchor.set(0.5, 1);

  const bubbleWidth = Math.max(96, runtime.bubbleText.width + 22);
  const bubbleHeight = Math.max(30, runtime.bubbleText.height + 16);

  runtime.bubbleBackground.clear();
  runtime.bubbleBackground.beginFill(0x180f0d, 0.92);
  runtime.bubbleBackground.lineStyle({ color: 0xc59465, width: 2, alpha: 1 });
  runtime.bubbleBackground.drawRoundedRect(-bubbleWidth / 2, -bubbleHeight - 62, bubbleWidth, bubbleHeight, 6);
  runtime.bubbleBackground.drawPolygon([
    -6,
    -62,
    0,
    -52,
    6,
    -62,
    -6,
    -62,
  ]);
  runtime.bubbleBackground.endFill();

  runtime.bubbleContainer.visible = true;
}

function applyMoodTint(runtime: AgentRuntime, mood: AgentPresence['mood']): void {
  if (mood === 'blocked') {
    runtime.sprite.tint = 0xffcfbf;
    return;
  }

  if (mood === 'active') {
    runtime.sprite.tint = 0xfff2db;
    return;
  }

  runtime.sprite.tint = 0xded4ca;
}

export function OfficeScene({ agents, presenceByAgent, bubbleTextByAgent, selectedAgentId, onAgentSelect }: OfficeSceneProps): JSX.Element {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const worldRef = useRef<Container | null>(null);
  const runtimesRef = useRef<Map<string, AgentRuntime>>(new Map());

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return undefined;
    }

    const app = new Application({
      antialias: false,
      autoDensity: true,
      backgroundAlpha: 0,
      resolution: window.devicePixelRatio || 1,
      resizeTo: host,
    });
    app.stage.sortableChildren = true;

    host.appendChild(app.view as HTMLCanvasElement);
    appRef.current = app;

    const world = new Container();
    world.sortableChildren = true;
    app.stage.addChild(world);
    worldRef.current = world;

    const textures = createOfficeTextures(app);
    const scanline = createBackdrop(world, textures);

    const resizeWorld = (): void => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      const scale = Math.min(width / OFFICE_WORLD_SIZE.width, height / OFFICE_WORLD_SIZE.height);
      world.scale.set(scale);
      world.position.set((width - OFFICE_WORLD_SIZE.width * scale) / 2, (height - OFFICE_WORLD_SIZE.height * scale) / 2);
    };

    const observer = new ResizeObserver(resizeWorld);
    observer.observe(host);
    resizeWorld();

    for (const agent of agents) {
      const basePoint = getZoneTarget('lounge', agent.role);

      const container = new Container();
      container.sortableChildren = true;
      container.position.set(basePoint.x, basePoint.y);
      container.eventMode = 'static';
      container.cursor = 'pointer';
      container.on('pointertap', (_event: FederatedPointerEvent) => {
        onAgentSelect(agent.id);
      });

      const shadow = new Graphics();
      shadow.beginFill(0x0f0a09, 0.45);
      shadow.drawEllipse(0, 0, 16, 6);
      shadow.endFill();
      shadow.y = -2;
      container.addChild(shadow);

      const sprite = new Sprite(textures.agents[agent.role]);
      sprite.anchor.set(0.5, 1);
      sprite.position.set(0, 2);
      sprite.texture.baseTexture.scaleMode = SCALE_MODES.NEAREST;
      container.addChild(sprite);

      const label = new Text(agent.name.toUpperCase(), FONT_LABEL);
      label.anchor.set(0.5, 0);
      label.position.set(0, 8);
      label.zIndex = 50;
      container.addChild(label);

      const bubbleContainer = new Container();
      bubbleContainer.zIndex = 70;

      const bubbleBackground = new Graphics();
      bubbleContainer.addChild(bubbleBackground);

      const bubbleText = new Text('', FONT_BUBBLE);
      bubbleText.anchor.set(0.5, 1);
      bubbleContainer.addChild(bubbleText);
      bubbleContainer.visible = false;
      container.addChild(bubbleContainer);

      world.addChild(container);

      runtimesRef.current.set(agent.id, {
        id: agent.id,
        role: agent.role,
        container,
        sprite,
        shadow,
        label,
        bubbleContainer,
        bubbleBackground,
        bubbleText,
        position: basePoint,
        zone: 'lounge',
        path: [],
        idlePhase: stablePhaseFromId(agent.id),
      });
    }

    app.ticker.add((delta) => {
      const deltaSeconds = delta / 60;
      const speed = 92;

      for (const runtime of runtimesRef.current.values()) {
        if (runtime.path.length > 0) {
          const waypoint = runtime.path[0];
          const dx = waypoint.x - runtime.position.x;
          const dy = waypoint.y - runtime.position.y;
          const distance = Math.hypot(dx, dy);
          const step = speed * deltaSeconds;

          if (distance <= step || distance < 1) {
            runtime.position = { x: waypoint.x, y: waypoint.y };
            runtime.path.shift();
          } else {
            runtime.position = {
              x: runtime.position.x + (dx / distance) * step,
              y: runtime.position.y + (dy / distance) * step,
            };
          }
        }

        runtime.idlePhase += deltaSeconds * 2.4;
        const isLounging = runtime.zone === 'lounge' && runtime.path.length === 0;
        const bob = Math.sin(runtime.idlePhase) * (isLounging ? 0.25 : 1.2);
        runtime.container.position.set(runtime.position.x, runtime.position.y + bob);
        runtime.container.zIndex = Math.round(runtime.position.y);
        runtime.shadow.scale.x = isLounging ? 1.22 : 0.96 + Math.abs(bob) * 0.02;
        runtime.shadow.scale.y = isLounging ? 1.12 : 1;
        runtime.sprite.position.y = isLounging ? 10 : 2;
      }

      scanline.y = (scanline.y + 0.05 * delta) % 3;
      scanline.alpha = 0.26 + Math.sin(performance.now() / 900) * 0.04;
    });

    return () => {
      observer.disconnect();
      runtimesRef.current.clear();
      worldRef.current = null;
      appRef.current = null;
      app.destroy(true, {
        children: true,
        texture: true,
        baseTexture: true,
      });
    };
  }, [agents, onAgentSelect]);

  useEffect(() => {
    for (const agent of agents) {
      const runtime = runtimesRef.current.get(agent.id);
      if (!runtime) {
        continue;
      }

      const presence = presenceByAgent[agent.id];
      const nextZone = presence?.zone ?? 'lounge';
      const target = getZoneTarget(nextZone, agent.role);
      const distance = Math.hypot(runtime.position.x - target.x, runtime.position.y - target.y);

      if (runtime.zone !== nextZone || (runtime.path.length === 0 && distance > 8)) {
        runtime.path = buildWaypointPath(runtime.position, target);
        runtime.zone = nextZone;
      }

      applyMoodTint(runtime, presence?.mood ?? 'idle');

      const bubbleText = bubbleTextByAgent[agent.id] ?? presence?.headline ?? null;
      setBubble(runtime, bubbleText);

      if (selectedAgentId === agent.id) {
        runtime.sprite.scale.set(1.08, 1.08);
        runtime.label.tint = 0xffcc99;
      } else {
        runtime.sprite.scale.set(1, 1);
        runtime.label.tint = 0xf5e5d2;
      }
    }
  }, [agents, bubbleTextByAgent, presenceByAgent, selectedAgentId]);

  return <div className="office-scene-canvas" ref={hostRef} />;
}
