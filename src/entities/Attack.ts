import Phaser from 'phaser';
import Entity from './Entity';

const ATTACK_SPEED = 500;
const ATTACK_SIZE = 24;
const CLEANUP_PADDING = 64; // padding before off-screen deletion

export type AttackOperation =
  | { type: 'add'; value: 1 }
  | { type: 'subtract'; value: 1 };

/**
 * Dumb projectile attack
 * Carries an operation payload
 * Future enemy/math systems should interpret `operation` when this projectile hits.
 */
export default class Attack extends Entity {
  readonly operation: AttackOperation;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    targetX: number,
    targetY: number,
    operation: AttackOperation = { type: 'add', value: 1 },
  ) {
    super(scene, x, y, 'attack');

    this.operation = operation;

    this.setDisplaySize(ATTACK_SIZE, ATTACK_SIZE);
    this.setOrigin(0.5);

    const body = this.body as Phaser.Physics.Arcade.Body;

    body.setAllowGravity(false);
    body.setEnable(true);

    const dx = targetX - x;
    const dy = targetY - y;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len === 0) {
      this.destroy();
      return;
    }

    body.setVelocity(
      (dx / len) * ATTACK_SPEED,
      (dy / len) * ATTACK_SPEED
    );
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    const view = this.scene.cameras.main.worldView;

    if (
      this.x < view.left - CLEANUP_PADDING ||
      this.x > view.right + CLEANUP_PADDING ||
      this.y < view.top - CLEANUP_PADDING ||
      this.y > view.bottom + CLEANUP_PADDING
    ) {
      this.destroy();
    }
  }
}