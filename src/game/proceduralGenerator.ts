import {
  CircleId,
  CrumblingTileState,
  DANTE_CIRCLES,
  DoorState,
  ExitPortal,
  HazardOrb,
  LevelData,
  LeverState,
  MovingPlatform,
  PressurePlateState,
  PushBlock,
  SoulKey,
  SoulWisp,
  TileType,
} from '../types';

export const LEVEL_WIDTH = 32;
export const LEVEL_HEIGHT = 20;
export const TILE_SIZE = 24;

export type ArchetypeId =
  | 'SWITCHBACK_ASCENT'
  | 'TWIN_SPIRES'
  | 'FLOATING_ARCHIPELAGO'
  | 'CASCADING_TERRACES'
  | 'CENTRAL_CITADEL';

const ARCHETYPE_NAMES: Record<ArchetypeId, string> = {
  SWITCHBACK_ASCENT: 'Winding Switchback',
  TWIN_SPIRES: 'Spires of the Abyss',
  FLOATING_ARCHIPELAGO: 'Floating Archipelago',
  CASCADING_TERRACES: 'Cascading Terraces',
  CENTRAL_CITADEL: 'Citadel Summit',
};

const ARCHETYPES: ArchetypeId[] = [
  'SWITCHBACK_ASCENT',
  'TWIN_SPIRES',
  'FLOATING_ARCHIPELAGO',
  'CASCADING_TERRACES',
  'CENTRAL_CITADEL',
];

// Simple deterministic PRNG for reproducible seeds when needed, or pseudo-random
function createRng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface PlatformDef {
  startX: number;
  endX: number;
  y: number;
  tileType?: TileType;
}

export function generateLevel(
  circleId: CircleId,
  levelNumber: number,
  customSeed?: number
): LevelData {
  // Generate or use seed
  const seed = customSeed !== undefined ? customSeed : Math.floor(Math.random() * 1000000) + 1;
  const rng = createRng(seed);

  // Initialize empty grid
  const tiles: TileType[][] = Array.from({ length: LEVEL_HEIGHT }, () =>
    Array.from({ length: LEVEL_WIDTH }, () => TileType.EMPTY)
  );

  // 1. Bedrock Boundaries
  for (let x = 0; x < LEVEL_WIDTH; x++) {
    tiles[0][x] = TileType.SOLID;
    tiles[LEVEL_HEIGHT - 1][x] = TileType.SOLID;
  }
  for (let y = 0; y < LEVEL_HEIGHT; y++) {
    tiles[y][0] = TileType.SOLID;
    tiles[y][LEVEL_WIDTH - 1] = TileType.SOLID;
  }

  // Pick an archetype based on seed + levelNumber + circleId
  const archetypeIndex = Math.floor(rng() * ARCHETYPES.length);
  const archetype = ARCHETYPES[archetypeIndex];

  const keys: SoulKey[] = [];
  const wisps: SoulWisp[] = [];
  const pushBlocks: PushBlock[] = [];
  const movingPlatforms: MovingPlatform[] = [];
  const hazardOrbs: HazardOrb[] = [];
  const crumblingTiles: CrumblingTileState[] = [];
  const levers: LeverState[] = [];
  const pressurePlates: PressurePlateState[] = [];
  const doors: DoorState[] = [];

  // Puzzle type: Greed (Circle 4) is always boulder switch; otherwise alternate/randomize
  const puzzleType: 'key' | 'switch' =
    circleId === 4 ? 'switch' : rng() > 0.5 ? 'key' : 'switch';

  // State populated by archetype builder
  let spawnTileX = 3;
  let spawnTileY = 17;
  let exitTileX = 27;
  let exitTileY = 4;
  let exitLedgeY = 5;

  const platforms: PlatformDef[] = [];

  // Build the layout archetype
  switch (archetype) {
    case 'SWITCHBACK_ASCENT':
      buildSwitchback(
        rng,
        circleId,
        platforms,
        movingPlatforms,
        (sx, sy) => { spawnTileX = sx; spawnTileY = sy; },
        (ex, ey, ly) => { exitTileX = ex; exitTileY = ey; exitLedgeY = ly; }
      );
      break;

    case 'TWIN_SPIRES':
      buildTwinSpires(
        rng,
        circleId,
        platforms,
        movingPlatforms,
        (sx, sy) => { spawnTileX = sx; spawnTileY = sy; },
        (ex, ey, ly) => { exitTileX = ex; exitTileY = ey; exitLedgeY = ly; }
      );
      break;

    case 'FLOATING_ARCHIPELAGO':
      buildArchipelago(
        rng,
        circleId,
        platforms,
        movingPlatforms,
        (sx, sy) => { spawnTileX = sx; spawnTileY = sy; },
        (ex, ey, ly) => { exitTileX = ex; exitTileY = ey; exitLedgeY = ly; }
      );
      break;

    case 'CASCADING_TERRACES':
      buildCascadingTerraces(
        rng,
        circleId,
        platforms,
        movingPlatforms,
        (sx, sy) => { spawnTileX = sx; spawnTileY = sy; },
        (ex, ey, ly) => { exitTileX = ex; exitTileY = ey; exitLedgeY = ly; }
      );
      break;

    case 'CENTRAL_CITADEL':
    default:
      buildCentralCitadel(
        rng,
        circleId,
        platforms,
        movingPlatforms,
        (sx, sy) => { spawnTileX = sx; spawnTileY = sy; },
        (ex, ey, ly) => { exitTileX = ex; exitTileY = ey; exitLedgeY = ly; }
      );
      break;
  }

  // 2. Render Platforms to Tile Grid with Headroom Protection
  for (const plat of platforms) {
    const sX = Math.max(1, Math.min(LEVEL_WIDTH - 2, plat.startX));
    const eX = Math.max(1, Math.min(LEVEL_WIDTH - 2, plat.endX));
    const pY = plat.y;

    if (pY < 2 || pY >= LEVEL_HEIGHT - 1) continue;

    for (let x = sX; x <= eX; x++) {
      let tType = plat.tileType ?? TileType.SOLID;

      // Thematic tile overrides
      if (circleId === 9 && tType === TileType.SOLID) {
        // Cocytus permafrost ice
        tType = rng() < 0.65 ? TileType.ICE : TileType.SOLID;
      } else if (circleId === 8 && tType === TileType.CRUMBLING) {
        crumblingTiles.push({
          x,
          y: pY,
          originalTile: TileType.CRUMBLING,
          steppedTimer: 0,
          respawnTimer: 0,
          state: 'idle',
        });
      }

      tiles[pY][x] = tType;

      // Ensure 3 tiles of headroom above platform so jumps never bonk ceiling
      for (let headY = pY - 1; headY >= Math.max(1, pY - 3); headY--) {
        if (tiles[headY][x] === TileType.SOLID || tiles[headY][x] === TileType.ICE) {
          tiles[headY][x] = TileType.EMPTY;
        }
      }
    }
  }

  // 3. Safe Spawn Ledge Construction
  const spawnX = spawnTileX * TILE_SIZE;
  const spawnY = spawnTileY * TILE_SIZE;
  const spawnGroundY = spawnTileY + 1;

  for (let x = Math.max(1, spawnTileX - 1); x <= Math.min(LEVEL_WIDTH - 2, spawnTileX + 3); x++) {
    tiles[spawnGroundY][x] = TileType.SOLID;
    // Clear headroom
    tiles[spawnTileY][x] = TileType.EMPTY;
    tiles[spawnTileY - 1][x] = TileType.EMPTY;
    tiles[spawnTileY - 2][x] = TileType.EMPTY;
  }

  // 4. Exit Portal & Secure Ledge Construction
  const exitPortal: ExitPortal = {
    x: exitTileX * TILE_SIZE,
    y: exitTileY * TILE_SIZE,
    width: TILE_SIZE * 1.5,
    height: TILE_SIZE * 2,
    isUnlocked: false,
  };

  // Secure exit ledge
  for (let x = Math.max(1, exitTileX - 2); x <= Math.min(LEVEL_WIDTH - 2, exitTileX + 3); x++) {
    tiles[exitLedgeY][x] = TileType.SOLID;
    // Clear exit gate space
    tiles[exitTileY][x] = TileType.EMPTY;
    tiles[exitTileY + 1][x] = TileType.EMPTY;
  }

  // Locked gate blocking exit portal
  const doorX = exitTileX > 16 ? exitTileX - 2 : exitTileX + 3;
  const doorY = exitTileY;
  doors.push({ x: doorX, y: doorY, isOpen: false });

  // 5. Floor Hazard Pits (Spikes)
  for (let x = 1; x < LEVEL_WIDTH - 1; x++) {
    // Leave safe zones directly below spawn and landing
    const isSpawnCol = x >= spawnTileX - 2 && x <= spawnTileX + 4;
    const isExitCol = x >= exitTileX - 3 && x <= exitTileX + 3;

    if (!isSpawnCol && !isExitCol && tiles[LEVEL_HEIGHT - 2][x] === TileType.EMPTY) {
      if (rng() < 0.65 || circleId === 7) {
        tiles[LEVEL_HEIGHT - 2][x] = TileType.SPIKE_UP;
      }
    }
  }

  // 6. Puzzle Objective Placement (Soul Key, Lever Switch, or Boulder Push Block)
  placePuzzleObjective(
    circleId,
    puzzleType,
    platforms,
    tiles,
    keys,
    levers,
    pressurePlates,
    pushBlocks,
    rng
  );

  // 7. Circle Thematic Hazards & Boosters
  applyCircleThematics(
    circleId,
    tiles,
    hazardOrbs,
    crumblingTiles,
    platforms,
    rng
  );

  // 8. Distribute Soul Wisps along reachable platforms and hidden nooks
  distributeWispsGeneratively(tiles, platforms, wisps, rng);

  // 9. Seal door tiles
  doors.forEach((door) => {
    tiles[door.y][door.x] = TileType.DOOR_LOCKED;
    tiles[door.y + 1][door.x] = TileType.DOOR_LOCKED;
  });

  return {
    circleId,
    widthInTiles: LEVEL_WIDTH,
    heightInTiles: LEVEL_HEIGHT,
    tileSize: TILE_SIZE,
    tiles,
    spawnX,
    spawnY,
    exitPortal,
    keys,
    wisps,
    pushBlocks,
    movingPlatforms,
    hazardOrbs,
    crumblingTiles,
    levers,
    pressurePlates,
    doors,
    levelNumber,
    archetype: ARCHETYPE_NAMES[archetype],
    generationSeed: seed,
  };
}

// --------------------------------------------------------------------------
// ARCHETYPE BUILDERS (Challenging platform spacing, float chasms & dash leaps)
// --------------------------------------------------------------------------

function buildSwitchback(
  rng: () => number,
  circleId: CircleId,
  platforms: PlatformDef[],
  movingPlatforms: MovingPlatform[],
  setSpawn: (x: number, y: number) => void,
  setExit: (x: number, y: number, ledgeY: number) => void
) {
  // Start on Low West (ledge at y=18)
  setSpawn(3, 17);
  // Exit on High East (ledge at y=5)
  setExit(26, 3, 5);

  const j = () => Math.floor(rng() * 2); // 0 or 1 micro variation

  // 1. Warmup Step (gap 2 from spawn x=5, up 2 to y=16)
  platforms.push({ startX: 7 + j(), endX: 9 + j(), y: 16 });

  // 2. Precision Leap ("Barely make it" flat jump: gap 5 empty tiles from x=10 to x=15)
  platforms.push({ startX: 15 + j(), endX: 17 + j(), y: 15 });

  // 3. Float Abyss (Gap 6 empty tiles horizontally & 2 up: standard jump drops short, player benefits heavily from hold-to-float or dash!)
  platforms.push({ startX: 23 + j(), endX: 25 + j(), y: 13 });

  // Moving Platform ferry assisting the lower abyss (x: 17 -> 22 at y=14)
  movingPlatforms.push({
    id: `mp-sw-${Math.floor(rng() * 9999)}`,
    x: 18 * TILE_SIZE,
    y: 14 * TILE_SIZE,
    width: TILE_SIZE * 2.5,
    height: TILE_SIZE * 0.7,
    startX: 17 * TILE_SIZE,
    startY: 14 * TILE_SIZE,
    targetX: 22 * TILE_SIZE,
    targetY: 14 * TILE_SIZE,
    speed: 1.15,
    currentT: 0,
    direction: 1,
    isVertical: false,
  });

  // 4. Switchback Mid Pivot (Westward jump: gap 5 tiles, up 2)
  platforms.push({ startX: 15 + j(), endX: 17 + j(), y: 11 });

  // 5. Puzzle Wing / Western Balcony (Gap 5 tiles Westward across the chasm: float glide feels exhilarating)
  platforms.push({ startX: 7 + j(), endX: 10 + j(), y: 9 });

  // 6. High Precarious Stepping Stones (Crumbling in Circle 8, tight 2-tile perches elsewhere)
  const isMalebolge = circleId === 8;
  platforms.push({
    startX: 13 + j(),
    endX: 14 + j(),
    y: 7,
    tileType: isMalebolge ? TileType.CRUMBLING : TileType.SOLID,
  });
  platforms.push({
    startX: 18 + j(),
    endX: 19 + j(),
    y: 6,
    tileType: isMalebolge ? TileType.CRUMBLING : TileType.SOLID,
  });

  // 7. High East Exit Threshold (Gap 5 tiles across high void)
  platforms.push({ startX: 24, endX: 28, y: 5 });
}

function buildTwinSpires(
  rng: () => number,
  circleId: CircleId,
  platforms: PlatformDef[],
  movingPlatforms: MovingPlatform[],
  setSpawn: (x: number, y: number) => void,
  setExit: (x: number, y: number, ledgeY: number) => void
) {
  setSpawn(3, 17);
  setExit(26, 3, 5);

  const j = () => Math.floor(rng() * 2);

  // WEST SPIRE (Ascent with tight vertical leaps)
  platforms.push({ startX: 2, endX: 5, y: 18 }); // Base
  platforms.push({ startX: 7 + j(), endX: 9 + j(), y: 16 }); // West Perch 1 (gap 2, up 2)
  platforms.push({ startX: 2 + j(), endX: 4 + j(), y: 13 }); // West Perch 2 (turnback: gap 3, up 3)
  platforms.push({ startX: 7 + j(), endX: 9 + j(), y: 10 }); // West Perch 3 / Puzzle (gap 3, up 3)
  platforms.push({ startX: 3 + j(), endX: 5 + j(), y: 7 }); // West Pinnacle

  // THE GREAT CHASM (Spire to Spire crossing: gap 6 empty tiles between x=9 and x=15)
  // Mid-air Pedestal (Floating island suspended in the middle of the spires)
  platforms.push({
    startX: 15 + j(),
    endX: 17 + j(),
    y: 9,
    tileType: circleId === 8 ? TileType.CRUMBLING : TileType.ONE_WAY,
  });

  // Low-to-Mid Chasm moving ferry for alternative traversal
  movingPlatforms.push({
    id: `mp-ts-${Math.floor(rng() * 9999)}`,
    x: 10 * TILE_SIZE,
    y: 12 * TILE_SIZE,
    width: TILE_SIZE * 2.5,
    height: TILE_SIZE * 0.7,
    startX: 9 * TILE_SIZE,
    startY: 12 * TILE_SIZE,
    targetX: 21 * TILE_SIZE,
    targetY: 12 * TILE_SIZE,
    speed: 1.25,
    currentT: 0,
    direction: 1,
    isVertical: false,
  });

  // EAST SPIRE (Precision climb to the exit)
  platforms.push({ startX: 23 + j(), endX: 25 + j(), y: 12 }); // East Perch 1
  platforms.push({ startX: 26 + j(), endX: 28, y: 9 }); // East Perch 2 (gap 4 from pedestal x=17, up 3)
  platforms.push({ startX: 20 + j(), endX: 22 + j(), y: 7 }); // East High Step (turnback: gap 4, up 2)
  platforms.push({ startX: 24, endX: 28, y: 5 }); // East Pinnacle (Exit Sanctuary)
}

function buildArchipelago(
  rng: () => number,
  circleId: CircleId,
  platforms: PlatformDef[],
  movingPlatforms: MovingPlatform[],
  setSpawn: (x: number, y: number) => void,
  setExit: (x: number, y: number, ledgeY: number) => void
) {
  setSpawn(3, 17);
  setExit(26, 3, 5);

  const j = () => Math.floor(rng() * 2);

  // Staggered floating stepping stones with precision gaps and float chasms
  // Island 1: Lower West (gap 2 from spawn)
  platforms.push({ startX: 6 + j(), endX: 8 + j(), y: 16 });

  // Island 2: "Barely make it" leap (gap 5 tiles from x=8 to x=13, up 1)
  platforms.push({ startX: 13 + j(), endX: 15 + j(), y: 15 });

  // Island 3: Float Abyss (gap 6 tiles horizontally & 2 up: regular jump fails, holding float easily carries player!)
  platforms.push({ startX: 21 + j(), endX: 23 + j(), y: 13 });

  // Island 4: East High Lookout
  platforms.push({ startX: 26 + j(), endX: 28, y: 11 });

  // Island 5: Upper Traverse West (gap 5 tiles Westward)
  platforms.push({ startX: 19 + j(), endX: 21 + j(), y: 9 });

  // Island 6: Central Void Stepping Stone (gap 5 tiles across mid-air)
  platforms.push({
    startX: 12 + j(),
    endX: 14 + j(),
    y: 8,
    tileType: circleId === 8 ? TileType.CRUMBLING : TileType.SOLID,
  });

  // Island 7: West High Sanctuary with Puzzle (gap 6 tiles: float or dash across the sky!)
  platforms.push({ startX: 4 + j(), endX: 6 + j(), y: 7 });

  // Island 8: High Sky Perch
  platforms.push({ startX: 12 + j(), endX: 14 + j(), y: 5 });

  // Exit Island: High East
  platforms.push({ startX: 23, endX: 28, y: 5 });

  // Ferry connecting Island 8 to Exit Island across the massive upper gulf
  movingPlatforms.push({
    id: `mp-arch-top-${Math.floor(rng() * 9999)}`,
    x: 16 * TILE_SIZE,
    y: 5 * TILE_SIZE,
    width: TILE_SIZE * 2.5,
    height: TILE_SIZE * 0.7,
    startX: 15 * TILE_SIZE,
    startY: 5 * TILE_SIZE,
    targetX: 22 * TILE_SIZE,
    targetY: 5 * TILE_SIZE,
    speed: 1.1,
    currentT: 0,
    direction: 1,
    isVertical: false,
  });
}

function buildCascadingTerraces(
  rng: () => number,
  circleId: CircleId,
  platforms: PlatformDef[],
  movingPlatforms: MovingPlatform[],
  setSpawn: (x: number, y: number) => void,
  setExit: (x: number, y: number, ledgeY: number) => void
) {
  const mirror = rng() > 0.5;

  if (!mirror) {
    setSpawn(3, 17);
    setExit(26, 3, 5);
  } else {
    setSpawn(27, 17);
    setExit(4, 3, 5);
  }

  const j = () => Math.floor(rng() * 2);

  if (!mirror) {
    // Left-to-Right ascending cascade with calibrated gaps
    platforms.push({ startX: 7 + j(), endX: 9 + j(), y: 16 });
    platforms.push({ startX: 14 + j(), endX: 16 + j(), y: 14 }); // gap 5, up 2 (precision jump)
    platforms.push({ startX: 22 + j(), endX: 24 + j(), y: 12 }); // gap 6, up 2 (float chasm)

    // Reversal terrace
    platforms.push({ startX: 15 + j(), endX: 17 + j(), y: 10 }); // gap 5 Westward, up 2
    platforms.push({ startX: 7 + j(), endX: 10 + j(), y: 8 }); // West Puzzle (gap 5)
    platforms.push({
      startX: 15 + j(),
      endX: 17 + j(),
      y: 7,
      tileType: circleId === 8 ? TileType.CRUMBLING : TileType.SOLID,
    });
    platforms.push({ startX: 23, endX: 28, y: 5 }); // Exit
  } else {
    // Right-to-Left ascending cascade
    platforms.push({ startX: 21 + j(), endX: 23 + j(), y: 16 });
    platforms.push({ startX: 14 + j(), endX: 16 + j(), y: 14 }); // gap 5, up 2
    platforms.push({ startX: 6 + j(), endX: 8 + j(), y: 12 }); // gap 6, up 2 (float chasm)

    // Reversal terrace
    platforms.push({ startX: 13 + j(), endX: 15 + j(), y: 10 });
    platforms.push({ startX: 20 + j(), endX: 23 + j(), y: 8 }); // East Puzzle
    platforms.push({
      startX: 13 + j(),
      endX: 15 + j(),
      y: 7,
      tileType: circleId === 8 ? TileType.CRUMBLING : TileType.SOLID,
    });
    platforms.push({ startX: 2, endX: 7, y: 5 }); // Exit on West
  }

  // Connecting moving platform for mid-tier
  movingPlatforms.push({
    id: `mp-casc-${Math.floor(rng() * 9999)}`,
    x: 13 * TILE_SIZE,
    y: 11 * TILE_SIZE,
    width: TILE_SIZE * 2.5,
    height: TILE_SIZE * 0.7,
    startX: 11 * TILE_SIZE,
    startY: 11 * TILE_SIZE,
    targetX: 19 * TILE_SIZE,
    targetY: 11 * TILE_SIZE,
    speed: 1.2,
    currentT: 0,
    direction: 1,
    isVertical: false,
  });
}

function buildCentralCitadel(
  rng: () => number,
  circleId: CircleId,
  platforms: PlatformDef[],
  movingPlatforms: MovingPlatform[],
  setSpawn: (x: number, y: number) => void,
  setExit: (x: number, y: number, ledgeY: number) => void
) {
  setSpawn(3, 17);
  setExit(26, 3, 5);

  const j = () => Math.floor(rng() * 2);

  // 1. West Moat Crossing (Spawn x: 2..5, y=18. Gap across the spiked moat to x=11 is 6 tiles! Requires float or dash to cross)
  platforms.push({ startX: 11 + j(), endX: 13 + j(), y: 16 });

  // 2. Citadel Stair Tier 1 (gap 4, up 2)
  platforms.push({ startX: 17 + j(), endX: 19 + j(), y: 14 });

  // 3. Citadel East Outpost (gap 4, up 2)
  platforms.push({ startX: 23 + j(), endX: 25 + j(), y: 12 });

  // 4. Citadel Inner Core / Puzzle (gap 6 Westward: float glide across inner courtyard)
  platforms.push({
    startX: 14 + j(),
    endX: 17 + j(),
    y: 10,
    tileType: circleId === 8 ? TileType.CRUMBLING : TileType.SOLID,
  });

  // 5. Citadel West High Rampart (gap 5 Westward)
  platforms.push({ startX: 7 + j(), endX: 9 + j(), y: 8 });

  // 6. Citadel Summit (gap 5, up 2)
  platforms.push({ startX: 14 + j(), endX: 16 + j(), y: 6 });

  // 7. Exit Watchtower (East)
  platforms.push({ startX: 23, endX: 28, y: 5 });

  // Moving platform connecting Citadel Summit to Exit Watchtower
  movingPlatforms.push({
    id: `mp-cit-${Math.floor(rng() * 9999)}`,
    x: 18 * TILE_SIZE,
    y: 6 * TILE_SIZE,
    width: TILE_SIZE * 2.5,
    height: TILE_SIZE * 0.7,
    startX: 17 * TILE_SIZE,
    startY: 6 * TILE_SIZE,
    targetX: 22 * TILE_SIZE,
    targetY: 6 * TILE_SIZE,
    speed: 1.15,
    currentT: 0,
    direction: 1,
    isVertical: false,
  });
}

// --------------------------------------------------------------------------
// PUZZLE OBJECTIVE PLACEMENT
// --------------------------------------------------------------------------

function placePuzzleObjective(
  circleId: CircleId,
  puzzleType: 'key' | 'switch',
  platforms: PlatformDef[],
  tiles: TileType[][],
  keys: SoulKey[],
  levers: LeverState[],
  pressurePlates: PressurePlateState[],
  pushBlocks: PushBlock[],
  rng: () => number
) {
  // Find a good puzzle platform (prefer mid-height platforms at y around 7..12)
  const candidatePlatforms = platforms.filter(
    (p) => p.y >= 7 && p.y <= 12 && p.endX - p.startX >= 2
  );
  const targetPlat =
    candidatePlatforms.length > 0
      ? candidatePlatforms[Math.floor(rng() * candidatePlatforms.length)]
      : platforms[Math.floor(platforms.length / 2)];

  if (circleId === 4) {
    // GREED: Boulder Push-Block + Pressure Plate
    // Ensure the platform has a continuous solid runway of at least 6 tiles
    const runY = targetPlat.y;
    const startX = Math.max(3, targetPlat.startX);
    const endX = Math.min(LEVEL_WIDTH - 4, startX + 7);

    for (let x = startX; x <= endX; x++) {
      tiles[runY][x] = TileType.SOLID;
      // Keep runway headroom completely empty
      tiles[runY - 1][x] = TileType.EMPTY;
      tiles[runY - 2][x] = TileType.EMPTY;
      tiles[runY - 3][x] = TileType.EMPTY;
    }

    // Boulder at startX + 1
    pushBlocks.push({
      id: `block-greed-${Math.floor(rng() * 9999)}`,
      x: (startX + 1) * TILE_SIZE,
      y: (runY - 1) * TILE_SIZE,
      vx: 0,
      vy: 0,
      width: TILE_SIZE,
      height: TILE_SIZE,
      isGrounded: true,
    });

    // Golden Pressure Plate at endX - 1
    const plateX = endX - 1;
    const plateY = runY - 1;
    pressurePlates.push({
      x: plateX,
      y: plateY,
      isPressed: false,
    });
    tiles[plateY][plateX] = TileType.PRESSURE_PLATE;
  } else if (puzzleType === 'key') {
    // Soul Key hovering gracefully over the target platform
    const keyX = Math.floor((targetPlat.startX + targetPlat.endX) / 2);
    const keyY = targetPlat.y - 2;

    keys.push({
      id: `soul-key-${circleId}`,
      x: keyX * TILE_SIZE + 4,
      y: keyY * TILE_SIZE + 4,
      width: 16,
      height: 16,
      collected: false,
      color: DANTE_CIRCLES[circleId].themeColor,
    });
  } else {
    // Lever Switch installed on top of the target platform
    const leverX = Math.floor((targetPlat.startX + targetPlat.endX) / 2);
    const leverY = targetPlat.y - 1;

    levers.push({
      x: leverX,
      y: leverY,
      isActive: false,
    });
    tiles[leverY][leverX] = TileType.LEVER;
  }
}

// --------------------------------------------------------------------------
// THEMATIC HAZARDS & BOOSTERS
// --------------------------------------------------------------------------

function applyCircleThematics(
  circleId: CircleId,
  tiles: TileType[][],
  hazardOrbs: HazardOrb[],
  crumblingTiles: CrumblingTileState[],
  platforms: PlatformDef[],
  rng: () => number
) {
  switch (circleId) {
    case 9: // Cocytus - Ice & Ceiling Stalactites over pits
      for (let x = 6; x < LEVEL_WIDTH - 6; x += 4) {
        if (tiles[1][x] === TileType.EMPTY && rng() < 0.7) {
          tiles[1][x] = TileType.SPIKE_DOWN;
        }
      }
      break;

    case 8: // Malebolge - Extra crumbling stepping stones
      for (const p of platforms) {
        if (p.tileType === TileType.CRUMBLING) {
          for (let x = p.startX; x <= p.endX; x++) {
            if (!crumblingTiles.some((c) => c.x === x && c.y === p.y)) {
              crumblingTiles.push({
                x,
                y: p.y,
                originalTile: TileType.CRUMBLING,
                steppedTimer: 0,
                respawnTimer: 0,
                state: 'idle',
              });
            }
          }
        }
      }
      break;

    case 7: // Phlegethon - Orbiting spark sentinels
      hazardOrbs.push({
        id: 'orb-phleg-1',
        centerX: 16 * TILE_SIZE,
        centerY: 12 * TILE_SIZE,
        radius: 36,
        angle: 0,
        speed: 0.03,
        currentX: 16 * TILE_SIZE,
        currentY: 12 * TILE_SIZE,
        size: 14,
      });
      hazardOrbs.push({
        id: 'orb-phleg-2',
        centerX: 13 * TILE_SIZE,
        centerY: 8 * TILE_SIZE,
        radius: 38,
        angle: Math.PI,
        speed: -0.025,
        currentX: 13 * TILE_SIZE,
        currentY: 8 * TILE_SIZE,
        size: 14,
      });
      break;

    case 6: // City of Dis - Tombs & timed spark hazards
      hazardOrbs.push({
        id: 'orb-dis-1',
        centerX: 15 * TILE_SIZE,
        centerY: 11 * TILE_SIZE,
        radius: 40,
        angle: 0,
        speed: 0.035,
        currentX: 15 * TILE_SIZE,
        currentY: 11 * TILE_SIZE,
        size: 15,
      });
      break;

    case 5: // River Styx - Marsh updraft vents
      tiles[17][12] = TileType.WIND_UP;
      tiles[16][12] = TileType.WIND_UP;
      tiles[15][12] = TileType.WIND_UP;
      tiles[14][12] = TileType.WIND_UP;
      break;

    case 3: // Gluttony - Spongy bouncy mushrooms
      // Pick two platforms to place bouncers on
      if (platforms.length >= 2) {
        const p1 = platforms[1];
        const p2 = platforms[platforms.length - 2];
        const b1X = Math.floor((p1.startX + p1.endX) / 2);
        const b2X = Math.floor((p2.startX + p2.endX) / 2);
        if (p1.y - 1 > 1) tiles[p1.y - 1][b1X] = TileType.BOUNCER;
        if (p2.y - 1 > 1) tiles[p2.y - 1][b2X] = TileType.BOUNCER;
      }
      break;

    case 2: // Lust - Tempest Whirlwinds
      tiles[16][9] = TileType.WIND_UP;
      tiles[15][9] = TileType.WIND_UP;
      tiles[14][9] = TileType.WIND_UP;
      tiles[13][9] = TileType.WIND_UP;

      tiles[13][21] = TileType.WIND_UP;
      tiles[12][21] = TileType.WIND_UP;
      tiles[11][21] = TileType.WIND_UP;
      tiles[10][21] = TileType.WIND_UP;
      break;

    case 1: // Limbo - Classical Marble Columns
      for (let y = 8; y <= 13; y++) {
        tiles[y][15] = TileType.SOLID;
      }
      tiles[10][14] = TileType.ONE_WAY;
      tiles[10][16] = TileType.ONE_WAY;
      break;

    case 0: // Celestial Ascent
      tiles[9][11] = TileType.ONE_WAY;
      tiles[7][16] = TileType.ONE_WAY;
      tiles[5][21] = TileType.ONE_WAY;
      break;
  }
}

// --------------------------------------------------------------------------
// SOUL WISPS DISTRIBUTION
// --------------------------------------------------------------------------

function distributeWispsGeneratively(
  tiles: TileType[][],
  platforms: PlatformDef[],
  wisps: SoulWisp[],
  rng: () => number
) {
  let count = 0;

  // Place 3 wisps safely along generated platforms
  for (const p of platforms) {
    if (count >= 5) break;
    const midX = Math.floor((p.startX + p.endX) / 2);
    const midY = p.y - 1;

    if (
      midX < LEVEL_WIDTH - 2 &&
      midY > 1 &&
      tiles[midY][midX] === TileType.EMPTY &&
      !wisps.some((w) => Math.abs(w.x - midX * TILE_SIZE) < 32 && Math.abs(w.y - midY * TILE_SIZE) < 32)
    ) {
      wisps.push({
        id: `wisp-${count}`,
        x: midX * TILE_SIZE + 4,
        y: midY * TILE_SIZE + 4,
        value: 1,
        collected: false,
        floatOffset: rng() * Math.PI * 2,
      });
      count++;
    }
  }

  // Place 2 bonus wisps in elevated or air spots
  const bonusCandidateY = [5, 7, 9, 11];
  for (const by of bonusCandidateY) {
    if (count >= 5) break;
    const bx = Math.floor(5 + rng() * (LEVEL_WIDTH - 10));
    if (tiles[by][bx] === TileType.EMPTY && !wisps.some((w) => Math.abs(w.x - bx * TILE_SIZE) < 40)) {
      wisps.push({
        id: `wisp-${count}`,
        x: bx * TILE_SIZE + 4,
        y: by * TILE_SIZE + 4,
        value: 1,
        collected: false,
        floatOffset: rng() * Math.PI * 2,
      });
      count++;
    }
  }
}
