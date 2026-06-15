import type { WaveConfig } from '../systems/EnemySpawner';

export interface LevelConfig {
  levelId: number;
  waves: WaveConfig[];
  completionSlides: string[];
  nextLevelId: number | null;
}

const LEVEL_1: LevelConfig = {
  levelId: 1,
  completionSlides: ['l2_1', 'l2_2', 'l2_3', 'l2_4'],
  nextLevelId: 2,
  waves: [
    {
      enemies: [
        { value: "x" },
      ],
    },
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
  completionSlides: ['karl'],
  nextLevelId: null,
  waves: [
    {
      minEnemiesPerSpawn: 1,
      maxEnemiesPerSpawn: 2,
      minSpawnDelayMs: 700,
      maxSpawnDelayMs: 1800,
      enemies: [
        { value: 12, speed: 120 },
        { value: -8, speed: 125 },
        { value: 14, speed: 130 },
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
        { value: -12, speed: 145 },
        { value: 18, speed: 150 },
        { value: 20, speed: 155 },
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
    default:
      throw new Error(`Unknown level requested: ${levelId}`);
  }
}
