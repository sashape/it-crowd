import { Graphics, SCALE_MODES, type Application, type Texture } from 'pixi.js';
import type { Agent } from '../../types/domain';

interface SpritePattern {
  pixelSize: number;
  palette: Record<string, number>;
  rows: string[];
}

export interface OfficeTextures {
  agents: Record<Agent['role'], Texture>;
  workstation: Texture;
  sofa: Texture;
  plant: Texture;
  monitorGlow: Texture;
}

const BASE_AGENT_PATTERN: Omit<SpritePattern, 'palette'> = {
  pixelSize: 3,
  rows: [
    '................',
    '......cc........',
    '.....cccc.......',
    '....cssssc......',
    '....cssssc......',
    '....cbbbbc......',
    '....cbbbbc......',
    '....cbbbbc......',
    '....cttttc......',
    '....cttttc......',
    '.....tttt.......',
    '.....t..t.......',
    '....k....k......',
    '....k....k......',
    '................',
    '................',
  ],
};

const ROLE_PALETTES: Record<Agent['role'], Record<string, number>> = {
  pm: { '.': 0x000000, c: 0xf1d7bb, s: 0xb16f4f, b: 0x5a3f32, t: 0x8cc7b7, k: 0x3a2c23 },
  tl: { '.': 0x000000, c: 0xf1d7bb, s: 0x7c5a4f, b: 0x3f2d28, t: 0xe4a768, k: 0x3a2c23 },
  be: { '.': 0x000000, c: 0xf1d7bb, s: 0x3f4d64, b: 0x2b3346, t: 0x78c0e0, k: 0x29211d },
  fe: { '.': 0x000000, c: 0xf1d7bb, s: 0x6e4558, b: 0x4f2f3f, t: 0xe9b07e, k: 0x29211d },
  qa: { '.': 0x000000, c: 0xf1d7bb, s: 0x4f6a58, b: 0x2f4739, t: 0xbbd38a, k: 0x29211d },
};

const WORKSTATION_PATTERN: SpritePattern = {
  pixelSize: 3,
  palette: {
    '.': 0x000000,
    b: 0x4b3127,
    p: 0x7f5642,
    d: 0x6b4736,
    c: 0x2a201d,
    k: 0x211a18,
    m: 0x85d5c5,
    s: 0x2a272d,
    g: 0x9de5d8,
    t: 0x191b20,
  },
  rows: [
    '....................',
    '....................',
    '....ssssssss........',
    '....smmggmms........',
    '....smmmmms.........',
    '....ssssssss........',
    '..bbbbbbbbbbbbbb....',
    '..bppppppppppppb....',
    '..bddddddddddddb....',
    '..bkkkkcckkkkkkb....',
    '..bb..........bb....',
    '..bb..........bb....',
    '..bb..........bb....',
    '....................',
    '....................',
    '....................',
  ],
};

const SOFA_PATTERN: SpritePattern = {
  pixelSize: 3,
  palette: {
    '.': 0x000000,
    b: 0x4a3235,
    c: 0x704b4a,
    s: 0x261a1c,
  },
  rows: [
    '................................................',
    '..bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb....',
    '..bcccccccccccccccccccccccccccccccccccccccb....',
    '..bcccccccccccccccccccccccccccccccccccccccb....',
    '..bccccccssccccccssccccccssccccccsscccccccb....',
    '..bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb....',
    '..bssssssssssssssssssssssssssssssssssssssssb....',
    '..bssssssssssssssssssssssssssssssssssssssssb....',
    '..bb....................................bb....',
    '..bb....................................bb....',
    '................................................',
    '................................................',
  ],
};

const PLANT_PATTERN: SpritePattern = {
  pixelSize: 3,
  palette: {
    '.': 0x000000,
    p: 0x3d7d5b,
    q: 0x7fb180,
    v: 0x3f2b25,
  },
  rows: [
    '................',
    '......pp........',
    '.....pppp.......',
    '....ppqqpp......',
    '....pqqqqp......',
    '.....pppp.......',
    '......pp........',
    '.....vvvv.......',
    '.....vvvv.......',
    '................',
  ],
};

const GLOW_PATTERN: SpritePattern = {
  pixelSize: 3,
  palette: {
    '.': 0x000000,
    g: 0x65d1c4,
    h: 0x9de5d8,
  },
  rows: [
    '....................',
    '.....gggggggggg.....',
    '...gghhhhhhhhhhgg...',
    '..gghhhhhhhhhhhhgg..',
    '..gghhhhhhhhhhhhgg..',
    '...gghhhhhhhhhhgg...',
    '.....gggggggggg.....',
    '....................',
  ],
};

function buildTexture(app: Application, pattern: SpritePattern): Texture {
  const graphics = new Graphics();

  for (let y = 0; y < pattern.rows.length; y += 1) {
    const row = pattern.rows[y];
    for (let x = 0; x < row.length; x += 1) {
      const key = row[x];
      if (key === '.' || !(key in pattern.palette)) {
        continue;
      }

      graphics.beginFill(pattern.palette[key]);
      graphics.drawRect(x * pattern.pixelSize, y * pattern.pixelSize, pattern.pixelSize, pattern.pixelSize);
      graphics.endFill();
    }
  }

  const texture = app.renderer.generateTexture(graphics, {
    scaleMode: SCALE_MODES.NEAREST,
    resolution: 1,
  });
  texture.baseTexture.scaleMode = SCALE_MODES.NEAREST;
  graphics.destroy();
  return texture;
}

export function createOfficeTextures(app: Application): OfficeTextures {
  return {
    agents: {
      pm: buildTexture(app, { ...BASE_AGENT_PATTERN, palette: ROLE_PALETTES.pm }),
      tl: buildTexture(app, { ...BASE_AGENT_PATTERN, palette: ROLE_PALETTES.tl }),
      be: buildTexture(app, { ...BASE_AGENT_PATTERN, palette: ROLE_PALETTES.be }),
      fe: buildTexture(app, { ...BASE_AGENT_PATTERN, palette: ROLE_PALETTES.fe }),
      qa: buildTexture(app, { ...BASE_AGENT_PATTERN, palette: ROLE_PALETTES.qa }),
    },
    workstation: buildTexture(app, WORKSTATION_PATTERN),
    sofa: buildTexture(app, SOFA_PATTERN),
    plant: buildTexture(app, PLANT_PATTERN),
    monitorGlow: buildTexture(app, GLOW_PATTERN),
  };
}
