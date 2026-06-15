import Phaser from 'phaser';

const EXPLOSION_DURATION_MS = 240;
const START_RADIUS = 3;
const END_RADIUS = 32;
const SHARD_COUNT_MIN = 6;
const SHARD_COUNT_MAX = 10;
const SHARD_START_RADIUS = 8;
const SHARD_END_RADIUS = 34;
const SHARD_LENGTH = 10;
const SHARD_JITTER = 0.22;
const EXPLOSION_COLORS = [
  '#FFFFFF',
  '#FFF7C7',
  '#FFE08A',
  '#FFC45E',
  '#FFAA3D',
] as const;

interface ExplosionTweenState {
  t: number;
}

interface ExplosionShard {
  angle: number;
  distance: number;
  length: number;
  color: number;
}

export function spawnExplosion(scene: Phaser.Scene, x: number, y: number): void {
  const graphics = scene.add.graphics();
  const state: ExplosionTweenState = { t: 0 };
  const shards = createShards();
  const circleColor = getRandomExplosionColor();

  graphics.setDepth(75);

  const drawExplosion = (): void => {
    const progress = Phaser.Math.Clamp(state.t, 0, 1);
    const alpha = 1 - progress;
    const radius = Phaser.Math.Linear(START_RADIUS, END_RADIUS, progress);

    graphics.clear();
    graphics.fillStyle(circleColor, alpha * 0.18);
    graphics.fillCircle(x, y, radius);
    graphics.lineStyle(2, circleColor, alpha);
    graphics.strokeCircle(x, y, radius);

    for (const shard of shards) {
      const startDistance = Phaser.Math.Linear(
        SHARD_START_RADIUS,
        shard.distance,
        progress,
      );
      const endDistance = startDistance + shard.length * (1 - progress * 0.25);
      const startX = x + Math.cos(shard.angle) * startDistance;
      const startY = y + Math.sin(shard.angle) * startDistance;
      const endX = x + Math.cos(shard.angle) * endDistance;
      const endY = y + Math.sin(shard.angle) * endDistance;

      graphics.lineStyle(2, shard.color, alpha);
      graphics.lineBetween(startX, startY, endX, endY);
    }
  };

  drawExplosion();

  scene.tweens.add({
    targets: state,
    t: 1,
    duration: EXPLOSION_DURATION_MS,
    ease: 'Cubic.easeOut',
    onUpdate: drawExplosion,
    onComplete: () => {
      graphics.destroy();
    },
  });
}

function createShards(): ExplosionShard[] {
  const count = Phaser.Math.Between(SHARD_COUNT_MIN, SHARD_COUNT_MAX);
  const angleStep = Phaser.Math.PI2 / count;
  const shards: ExplosionShard[] = [];

  for (let i = 0; i < count; i += 1) {
    shards.push({
      angle: i * angleStep + Phaser.Math.FloatBetween(-SHARD_JITTER, SHARD_JITTER),
      distance: Phaser.Math.Between(SHARD_END_RADIUS - 6, SHARD_END_RADIUS + 4),
      length: Phaser.Math.Between(SHARD_LENGTH - 3, SHARD_LENGTH + 4),
      color: getRandomExplosionColor(),
    });
  }

  return shards;
}

function getRandomExplosionColor(): number {
  return Phaser.Display.Color.HexStringToColor(
    Phaser.Utils.Array.GetRandom(EXPLOSION_COLORS),
  ).color;
}
