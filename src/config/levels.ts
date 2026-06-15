import type { WaveConfig } from '../systems/EnemySpawner';

export interface LevelConfig {
  levelId: number;
  waves: WaveConfig[];
  startSlides: string[];
  nextLevelId: number | null;
}

const LEVEL_1: LevelConfig = {
  levelId: 1,
  startSlides: ['slide_1', 'slide_2', 'slide_3'],
  nextLevelId: 2,
  waves: [
    {
      enemies: [
        { value: 5 },
        { value: -5 },
      ],
    },
    {
      enemies: [
        { value: 10 },
        { value: -35 },
        { value: 3 },
        { value: 4 },
        { value: 5 },
        { value: 6 },
      ],
    },
    {
      minEnemiesPerSpawn: 2,
      maxEnemiesPerSpawn: 4,
      minSpawnDelayMs: 800,
      maxSpawnDelayMs: 2200,
      enemies: [
        { value: 3, speed: 110 },
        { value: 4, speed: 110 },
        { value: 5, speed: 120 },
        { value: 6, speed: 120 },
        { value: 7, speed: 130 },
        { value: 8, speed: 130 },
        { value: 9, speed: 140 },
        { value: 10, speed: 140 },
      ],
    },
    {
      minEnemiesPerSpawn: 1,
      maxEnemiesPerSpawn: 2,
      minSpawnDelayMs: 700,
      maxSpawnDelayMs: 1800,
      enemies: [
        { value: 12, speed: 120 },
        { value: 1, speed: 250 },
        { value: -8, speed: 125 },
        { value: -2, speed: 250 },
        { value: 14, speed: 160 },
        { value: -1, speed: 280 },
        { value: -10, speed: 135 },
      ],
    },
    {
      minEnemiesPerSpawn: 2,
      maxEnemiesPerSpawn: 3,
      minSpawnDelayMs: 600,
      maxSpawnDelayMs: 1600,
      enemies: [
        { value: 15, speed: 135 },
        { value: 16, speed: 140 },
        { value: 3, speed: 300 },
        { value: 2, speed: 300 },
        { value: -12, speed: 145 },
        { value: 18, speed: 150 },
        { value: -5, speed: 250 },
        { value: 20, speed: 155 },
      ],
    },
  ],
};

const LEVEL_2: LevelConfig = {
  levelId: 2,
  startSlides: ['l2_1', 'l2_2', 'l2_3', 'l2_4'],
  nextLevelId: 3,
  waves: [
    {
      enemies: [
        { value: "x" },
        { value: "x^2 + 5" },
        { value: "(x + 6)(x - 7)" },
      ],
    },
    {
      // Wave 2: polynomial-only wave (no constants, more structure)
      minEnemiesPerSpawn: 1,
      maxEnemiesPerSpawn: 2,
      minSpawnDelayMs: 700,
      maxSpawnDelayMs: 1800,
      enemies: [
        { value: "x^2 + 4x + 4", speed: 144 },
        { value: "x^2 - 3x + 2", speed: 120 },
        { value: "-6", speed: 200 },
        { value: "(x + 3)(x - 1)", speed: 130 },
      ],
    },
    {
      // Wave 2: polynomial-only wave (no constants, more structure)
      minEnemiesPerSpawn: 1,
      maxEnemiesPerSpawn: 2,
      minSpawnDelayMs: 1000,
      maxSpawnDelayMs: 1800,
      enemies: [
        { value: "x^3 - 6x^2 + 9x", speed: 140 },
        { value: "8", speed: 220 },
        { value: "2(x + 2)^2", speed: 150 },
        { value: "(x^2 - 1)(x + 1)", speed: 175 },
      ],
    },
  ],
};

const LEVEL_3: LevelConfig = {
  levelId: 3,
  startSlides: ['l3_1'],
  nextLevelId: null,
  waves: [
      {
      // Wave 1: warm-up factoring (common x^2 + bx + c)
      minEnemiesPerSpawn: 1,
      maxEnemiesPerSpawn: 1,
      minSpawnDelayMs: 2500,
      maxSpawnDelayMs: 4400,
      enemies: [
        { value: "x^2 + 5x + 6", speed: 250 },
        { value: "(x + 2)(x + 4)", speed: 300 },
      ],
    },

    {
      // Wave 2: slightly tighter coefficients
      minEnemiesPerSpawn: 1,
      maxEnemiesPerSpawn: 1,
      minSpawnDelayMs: 4850,
      maxSpawnDelayMs: 5300,
      enemies: [
        { value: "x^2 + 9x + 20", speed: 220 },
        { value: "x^2 + 4x + 5", speed: 180 },
        { value: "(x + 3)(x + 5)", speed: 310 },
      ],
    },

    {
      // Wave 3
      minEnemiesPerSpawn: 1,
      maxEnemiesPerSpawn: 1,
      minSpawnDelayMs: 3950,
      maxSpawnDelayMs: 4500,
      enemies: [
        { value: "(x + 1)^3", speed: 220 },
        { value: "67676767", speed: 390 },
        { value: "(x - 67)(x + 67)", speed: 310 },
      ],
    },

  ],
};

export function getLevelConfig(levelId: number): LevelConfig {
  switch (levelId) {
    case 1:
      return LEVEL_1;
    case 2:
      return LEVEL_2;
    case 3:
      return LEVEL_3;
    default:
      throw new Error(`Unknown level requested: ${levelId}`);
  }
}
