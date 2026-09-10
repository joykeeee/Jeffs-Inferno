export type CircleId = 9 | 8 | 7 | 6 | 5 | 4 | 3 | 2 | 1 | 0;

export interface DanteCircleInfo {
  id: CircleId;
  name: string;
  subtitle: string;
  themeColor: string;
  secondaryColor: string;
  bgGradient: [string, string];
  quote: string;
  obstacleDescription: string;
  ambientEffect: 'snow' | 'sparks' | 'fog' | 'gold_dust' | 'wind' | 'rain' | 'stars';
}

export const DANTE_CIRCLES: Record<CircleId, DanteCircleInfo> = {
  9: {
    id: 9,
    name: "Circle IX: Cocytus",
    subtitle: "The Frozen Lake of Treachery",
    themeColor: "#67e8f9", // Cyan
    secondaryColor: "#0891b2",
    bgGradient: ["#082f49", "#020617"],
    quote: "A lake so bound with ice it seemed of glass, not water.",
    obstacleDescription: "Slippery permafrost & falling icicle stalactites",
    ambientEffect: 'snow',
  },
  8: {
    id: 8,
    name: "Circle VIII: Malebolge",
    subtitle: "The Fractured Chasms of Fraud",
    themeColor: "#c084fc", // Purple
    secondaryColor: "#7e22ce",
    bgGradient: ["#2e1065", "#09090b"],
    quote: "There is a place in Hell called Malebolge, wholly fashioned of stone.",
    obstacleDescription: "Crumbling stone bridges & locked runic gates",
    ambientEffect: 'sparks',
  },
  7: {
    id: 7,
    name: "Circle VII: Phlegethon",
    subtitle: "The Scorched Bounds of Violence",
    themeColor: "#f87171", // Soft Crimson / Amber (clean sparks, no blood)
    secondaryColor: "#b91c1c",
    bgGradient: ["#450a0a", "#0c0a09"],
    quote: "A river of glowing cinder, where fiery embers drift on burning wind.",
    obstacleDescription: "Floating spark sentinels & thermal updrafts",
    ambientEffect: 'sparks',
  },
  6: {
    id: 6,
    name: "Circle VI: City of Dis",
    subtitle: "The Iron Sepulchres of Heresy",
    themeColor: "#fb923c", // Amber / Bronze
    secondaryColor: "#c2410c",
    bgGradient: ["#3b1806", "#09090b"],
    quote: "The city that is called Dis, with heavy citizens, with solemn throng.",
    obstacleDescription: "Flaming tombs & timed flame pillars",
    ambientEffect: 'sparks',
  },
  5: {
    id: 5,
    name: "Circle V: River Styx",
    subtitle: "The Murky Waters of Wrath",
    themeColor: "#4ade80", // Murky Emerald
    secondaryColor: "#15803d",
    bgGradient: ["#052e16", "#022c22"],
    quote: "A swamp that bears the name of Styx, muddy and dreary.",
    obstacleDescription: "Drifting platforms across murky marsh vapors",
    ambientEffect: 'fog',
  },
  4: {
    id: 4,
    name: "Circle IV: The Hoarders",
    subtitle: "The Clashing Weights of Greed",
    themeColor: "#facc15", // Gold
    secondaryColor: "#a16207",
    bgGradient: ["#362505", "#09090b"],
    quote: "They strained their chests against huge weights, rolling them forward.",
    obstacleDescription: "Heavy pushable boulder weights & gold pressure plates",
    ambientEffect: 'gold_dust',
  },
  3: {
    id: 3,
    name: "Circle III: The Sleet",
    subtitle: "The Eternal Rain of Gluttony",
    themeColor: "#a3e635", // Lime
    secondaryColor: "#4d7c0f",
    bgGradient: ["#1a2e05", "#09090b"],
    quote: "A heavy, endless rain of heavy sleet and murky water falls.",
    obstacleDescription: "Bouncy spongy mushrooms & downpour squalls",
    ambientEffect: 'rain',
  },
  2: {
    id: 2,
    name: "Circle II: The Tempest",
    subtitle: "The Ceaseless Whirlwind of Lust",
    themeColor: "#a855f7", // Violet
    secondaryColor: "#6b21a8",
    bgGradient: ["#1e1b4b", "#030712"],
    quote: "The infernal storm that never rests hurts the spirits in its rapine.",
    obstacleDescription: "Whirlwind vortex currents that propel Jeff skyward",
    ambientEffect: 'wind',
  },
  1: {
    id: 1,
    name: "Circle I: Limbo",
    subtitle: "The Peaceful Meadow of Philosophers",
    themeColor: "#38bdf8", // Sky blue
    secondaryColor: "#0284c7",
    bgGradient: ["#083344", "#042f2e"],
    quote: "No tears were heard there, only sighings that made the eternal air tremble.",
    obstacleDescription: "Quiet marble spires & intricate spectral switches",
    ambientEffect: 'fog',
  },
  0: {
    id: 0,
    name: "Ascent to the Stars",
    subtitle: "E quindi uscimmo a riveder le stelle",
    themeColor: "#f43f5e",
    secondaryColor: "#9333ea",
    bgGradient: ["#0f172a", "#020617"],
    quote: "And thence we came out to see once more the stars.",
    obstacleDescription: "The Final Ascent into Celestial Light",
    ambientEffect: 'stars',
  }
};

export enum TileType {
  EMPTY = 0,
  SOLID = 1,
  ONE_WAY = 2,
  CRUMBLING = 3,
  ICE = 4,
  SPIKE_UP = 5,
  SPIKE_DOWN = 6,
  SPIKE_LEFT = 7,
  SPIKE_RIGHT = 8,
  PRESSURE_PLATE = 9,
  DOOR_LOCKED = 10,
  LEVER = 11,
  WIND_UP = 12,
  BOUNCER = 13,
}

export interface PushBlock {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
}

export interface MovingPlatform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  speed: number;
  currentT: number;
  direction: 1 | -1;
  isVertical: boolean;
}

export interface SoulKey {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
  color: string;
}

export interface SoulWisp {
  id: string;
  x: number;
  y: number;
  value: number;
  collected: boolean;
  floatOffset: number;
}

export interface HazardOrb {
  id: string;
  centerX: number;
  centerY: number;
  radius: number;
  angle: number;
  speed: number;
  currentX: number;
  currentY: number;
  size: number;
}

export interface ExitPortal {
  x: number;
  y: number;
  width: number;
  height: number;
  isUnlocked: boolean;
}

export interface CrumblingTileState {
  x: number;
  y: number;
  originalTile: TileType;
  steppedTimer: number;
  respawnTimer: number;
  state: 'idle' | 'crumbling' | 'broken';
}

export interface LeverState {
  x: number;
  y: number;
  isActive: boolean;
}

export interface PressurePlateState {
  x: number;
  y: number;
  isPressed: boolean;
}

export interface DoorState {
  x: number;
  y: number;
  isOpen: boolean;
}

export interface LevelData {
  circleId: CircleId;
  widthInTiles: number;
  heightInTiles: number;
  tileSize: number;
  tiles: TileType[][];
  spawnX: number;
  spawnY: number;
  exitPortal: ExitPortal;
  keys: SoulKey[];
  wisps: SoulWisp[];
  pushBlocks: PushBlock[];
  movingPlatforms: MovingPlatform[];
  hazardOrbs: HazardOrb[];
  crumblingTiles: CrumblingTileState[];
  levers: LeverState[];
  pressurePlates: PressurePlateState[];
  doors: DoorState[];
  levelNumber: number;
  archetype?: string;
  generationSeed?: number;
}

export interface Relic {
  id: string;
  name: string;
  icon: string;
  description: string;
  tier: 'common' | 'rare' | 'legendary';
}

export interface PlayerStats {
  ectoplasm: number;
  maxEctoplasm: number;
  soulWisps: number;
  moveSpeedMultiplier: number;
  jumpForceMultiplier: number;
  floatDurationMultiplier: number;
  hasPhantomDash: boolean;
  dashCooldownDuration: number;
  soulMagnetRange: number;
  hasSecondBreath: boolean;
  secondBreathUsed: boolean;
  relics: Relic[];
}

export interface GhostSkin {
  id: string;
  name: string;
  unlocked: boolean;
  cost: number;
  mainColor: string;
  glowColor: string;
  eyeColor: string;
}

export interface GameSaveData {
  highScoreWisps: number;
  highestCircleReached: CircleId;
  totalRunsStarted: number;
  totalEscapes: number;
  unlockedSkinId: string;
  unlockedSkins: string[];
  totalLifetimeWisps: number;
}
