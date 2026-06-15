import Phaser from 'phaser';
import Enemy from '../entities/Enemy';
import type Player from '../entities/Player';

const DEFAULT_MIN_ENEMIES_PER_SPAWN = 1;
const DEFAULT_MAX_ENEMIES_PER_SPAWN = 3;
const DEFAULT_MIN_SPAWN_DELAY_MS = 1000;
const DEFAULT_MAX_SPAWN_DELAY_MS = 3000;
const SPAWN_PADDING = 32;

export interface EnemySpawnConfig {
  value: number | string;
  speed?: number;
}

export interface WaveConfig {
  enemies: EnemySpawnConfig[];
  minEnemiesPerSpawn?: number;
  maxEnemiesPerSpawn?: number;
  minSpawnDelayMs?: number;
  maxSpawnDelayMs?: number;
}

interface ResolvedWaveConfig {
  enemies: EnemySpawnConfig[];
  minEnemiesPerSpawn: number;
  maxEnemiesPerSpawn: number;
  minSpawnDelayMs: number;
  maxSpawnDelayMs: number;
}

interface EnemySpawnerCallbacks {
  onWaveStarted?: (waveIndex: number) => void;
  onAllWavesCleared?: () => void;
  onEnemyHoverStart?: (value: string) => void;
  onEnemyHoverEnd?: () => void;
}

/**
 * Owns ordered enemy wave spawning and active enemy updates.
 */
export default class EnemySpawner {
  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemyGroup: Phaser.Physics.Arcade.Group;
  private readonly waves: ResolvedWaveConfig[];
  private readonly callbacks: EnemySpawnerCallbacks;
  private currentWaveIndex = 0;
  private nextEnemyIndex = 0;
  private nextSpawnTimeMs = 0;
  private hasClearedAllWaves = false;

  constructor(
    scene: Phaser.Scene,
    player: Player,
    enemyGroup: Phaser.Physics.Arcade.Group,
    waves: WaveConfig[],
    callbacks: EnemySpawnerCallbacks = {},
  ) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.waves = waves.map((wave) => this.resolveWaveConfig(wave));
    this.callbacks = callbacks;

    if (this.waves.length > 0) {
      this.callbacks.onWaveStarted?.(this.currentWaveIndex);
    }
  }

  update(timeMs: number): void {
    this.updateActiveEnemies();
    this.updateWaveState(timeMs);
  }

  private updateActiveEnemies(): void {
    for (const child of this.enemyGroup.getChildren()) {
      if (child instanceof Enemy && child.active) {
        child.update();
      }
    }
  }

  private updateWaveState(timeMs: number): void {
    if (this.hasClearedAllWaves) return;

    const wave = this.getCurrentWave();

    if (!wave) return;

    if (this.hasSpawnedCurrentWave(wave)) {
      this.startNextWaveWhenClear();
      return;
    }

    if (timeMs < this.nextSpawnTimeMs) return;

    this.spawnNextBatch(wave);
    this.nextSpawnTimeMs = timeMs + this.getRandomDelayMs(wave);
  }

  private startNextWaveWhenClear(): void {
    if (this.enemyGroup.countActive(true) > 0) return;

    this.currentWaveIndex += 1;
    this.nextEnemyIndex = 0;
    this.nextSpawnTimeMs = 0;

    if (!this.getCurrentWave()) {
      this.hasClearedAllWaves = true;
      this.callbacks.onAllWavesCleared?.();
      return;
    }

    this.callbacks.onWaveStarted?.(this.currentWaveIndex);
  }

  private spawnNextBatch(wave: ResolvedWaveConfig): void {
    const remainingEnemies = wave.enemies.length - this.nextEnemyIndex;
    const batchSize = Math.min(
      remainingEnemies,
      Phaser.Math.Between(wave.minEnemiesPerSpawn, wave.maxEnemiesPerSpawn),
    );

    for (let index = 0; index < batchSize; index += 1) {
      this.spawnEnemy(wave.enemies[this.nextEnemyIndex]);
      this.nextEnemyIndex += 1;
    }
  }

  private spawnEnemy(config: EnemySpawnConfig): void {
    const spawnPosition = this.getRandomOffscreenPosition();
    const enemy = new Enemy(
      this.scene,
      spawnPosition.x,
      spawnPosition.y,
      config.value,
      this.player,
      config.speed,
      {
        onHoverStart: this.callbacks.onEnemyHoverStart,
        onHoverEnd: this.callbacks.onEnemyHoverEnd,
      },
    );

    this.enemyGroup.add(enemy);
  }

  private getRandomOffscreenPosition(): Phaser.Math.Vector2 {
    const view = this.scene.cameras.main.worldView;
    const edge = Phaser.Math.Between(0, 3);

    switch (edge) {
      case 0:
        return new Phaser.Math.Vector2(
          Phaser.Math.Between(view.left, view.right),
          view.top - SPAWN_PADDING,
        );
      case 1:
        return new Phaser.Math.Vector2(
          view.right + SPAWN_PADDING,
          Phaser.Math.Between(view.top, view.bottom),
        );
      case 2:
        return new Phaser.Math.Vector2(
          Phaser.Math.Between(view.left, view.right),
          view.bottom + SPAWN_PADDING,
        );
      default:
        return new Phaser.Math.Vector2(
          view.left - SPAWN_PADDING,
          Phaser.Math.Between(view.top, view.bottom),
        );
    }
  }

  private getCurrentWave(): ResolvedWaveConfig | undefined {
    return this.waves[this.currentWaveIndex];
  }

  private hasSpawnedCurrentWave(wave: ResolvedWaveConfig): boolean {
    return this.nextEnemyIndex >= wave.enemies.length;
  }

  private getRandomDelayMs(wave: ResolvedWaveConfig): number {
    return Phaser.Math.Between(wave.minSpawnDelayMs, wave.maxSpawnDelayMs);
  }

  private resolveWaveConfig(wave: WaveConfig): ResolvedWaveConfig {
    const minEnemiesPerSpawn = Math.max(
      1,
      wave.minEnemiesPerSpawn ?? DEFAULT_MIN_ENEMIES_PER_SPAWN,
    );
    const maxEnemiesPerSpawn = Math.max(
      1,
      wave.maxEnemiesPerSpawn ?? DEFAULT_MAX_ENEMIES_PER_SPAWN,
    );
    const minSpawnDelayMs = Math.max(
      0,
      wave.minSpawnDelayMs ?? DEFAULT_MIN_SPAWN_DELAY_MS,
    );
    const maxSpawnDelayMs = Math.max(
      0,
      wave.maxSpawnDelayMs ?? DEFAULT_MAX_SPAWN_DELAY_MS,
    );

    return {
      enemies: wave.enemies,
      minEnemiesPerSpawn: Math.min(minEnemiesPerSpawn, maxEnemiesPerSpawn),
      maxEnemiesPerSpawn: Math.max(minEnemiesPerSpawn, maxEnemiesPerSpawn),
      minSpawnDelayMs: Math.min(minSpawnDelayMs, maxSpawnDelayMs),
      maxSpawnDelayMs: Math.max(minSpawnDelayMs, maxSpawnDelayMs),
    };
  }
}
