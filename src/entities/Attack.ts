import Phaser from 'phaser';
import Entity from './Entity';

const ATTACK_SPEED = 500;
const ATTACK_SIZE = 24;
const CLEANUP_PADDING = 64; // padding before off-screen deletion
const DEFAULT_ATTACK_TEXTURE = 'attack';
const TEXT_ATTACK_FONT_SIZE = '20px';

export type AttackOperation =
  | { type: 'add'; value: 1 }
  | { type: 'subtract'; value: 1 }
  | { type: 'derivative' };

export type AttackVisual =
  | { type: 'image'; textureKey: string }
  | { type: 'text'; text: string };

/**
 * Dumb projectile attack
 * Carries an operation payload
 * Future enemy/math systems should interpret `operation` when this projectile hits.
 */
export default class Attack extends Entity {
  readonly operation: AttackOperation;
  readonly rootValue?: number;
  private textVisual?: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    operation: AttackOperation = { type: 'add', value: 1 },
    visual: AttackVisual = { type: 'image', textureKey: DEFAULT_ATTACK_TEXTURE },
    rootValue?: number,
  ) {
    super(
      scene,
      x,
      y,
      visual.type === 'image' ? visual.textureKey : DEFAULT_ATTACK_TEXTURE,
    );

    this.operation = operation;
    this.rootValue = rootValue;

    this.setOrigin(0.5);

    const body = this.body as Phaser.Physics.Arcade.Body;

    body.setAllowGravity(false);
    body.setEnable(true);

    if (visual.type === 'image') {
      this.setDisplaySize(ATTACK_SIZE, ATTACK_SIZE);
      return;
    }

    this.setVisible(false);

    this.textVisual = scene.add.text(x, y, visual.text, {
      color: '#000000',
      fontFamily: 'Arial, sans-serif',
      fontSize: TEXT_ATTACK_FONT_SIZE,
      stroke: '#00aaff',
      strokeThickness: 3,
    });
    this.textVisual.setOrigin(0.5);

    this.configureTextBody(body, this.textVisual);
  }

  fireTowards(targetX: number, targetY: number): void {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len === 0) {
      this.destroy();
      return;
    }

    this.setVelocity(
      (dx / len) * ATTACK_SPEED,
      (dy / len) * ATTACK_SPEED
    );
  }

  setPosition(x?: number, y?: number, z?: number, w?: number): this {
    super.setPosition(x, y, z, w);
    this.syncTextVisual();

    return this;
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    this.syncTextVisual();

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

  destroy(fromScene?: boolean): void {
    if (this.textVisual !== undefined) {
      this.textVisual.destroy(fromScene);
      this.textVisual = undefined;
    }

    super.destroy(fromScene);
  }

  private configureTextBody(
    body: Phaser.Physics.Arcade.Body,
    textVisual: Phaser.GameObjects.Text,
  ): void {
    const bounds = textVisual.getBounds();
    const width = Math.max(1, Math.ceil(bounds.width));
    const height = Math.max(1, Math.ceil(bounds.height));

    this.setDisplaySize(width, height);
    body.setSize(width / this.scaleX, height / this.scaleY, true);
  }

  private syncTextVisual(): void {
    if (this.textVisual === undefined) return;

    this.textVisual.setPosition(this.x, this.y);
  }
}
