import Phaser from 'phaser';
import Entity from './Entity';
import { type AttackOperation } from './Attack';
import type Player from './Player';
import {
  addToExpression,
  differentiate,
  evaluateExpression,
  isConstantExpressionValue,
  parseExpression,
  type ParsedExpression,
} from '../math/Expression';

const ENEMY_TEXTURE_KEY = 'enemy-collision-placeholder';
const ENEMY_BODY_SIZE = 32;
const ENEMY_SPEED = 100;

function ensureEnemyTexture(scene: Phaser.Scene): string {
  if (!scene.textures.exists(ENEMY_TEXTURE_KEY)) {
    const graphics = scene.add.graphics();

    graphics.fillStyle(0xffffff, 0);
    graphics.fillRect(0, 0, ENEMY_BODY_SIZE, ENEMY_BODY_SIZE);
    graphics.generateTexture(ENEMY_TEXTURE_KEY, ENEMY_BODY_SIZE, ENEMY_BODY_SIZE);
    graphics.destroy();
  }

  return ENEMY_TEXTURE_KEY;
}

/**
 * Function enemy that moves toward the player and changes expression when attacked.
 */
export default class Enemy extends Entity {
  readonly kind = 'number';
  expr: string;

  private readonly player: Player;
  private readonly speed: number;
  private readonly valueText: Phaser.GameObjects.Text;
  private expression: ParsedExpression;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    value: number | string,
    player: Player,
    speed: number = ENEMY_SPEED,
  ) {
    super(scene, x, y, ensureEnemyTexture(scene));

    this.player = player;
    this.speed = speed;
    this.expression = parseExpression(value);
    this.expr = this.expression.expr;

    this.setOrigin(0.5);
    this.setDisplaySize(ENEMY_BODY_SIZE, ENEMY_BODY_SIZE);
    this.setVisible(false);

    const body = this.body as Phaser.Physics.Arcade.Body;

    body.setAllowGravity(false);
    body.setEnable(true);
    body.setSize(ENEMY_BODY_SIZE, ENEMY_BODY_SIZE, true);

    this.valueText = scene.add.text(this.x, this.y, this.getDisplayValue(), {
      color: '#000000',
      fontSize: '24px',
      stroke: '#ff0000',
      strokeThickness: 4,
    });
    this.valueText.setOrigin(0.5);
  }

  get value(): number {
    return this.evaluate(0);
  }

  evaluate(x: number): number {
    return evaluateExpression(this.expression, x);
  }

  /** Called every frame by the scene's update loop. */
  update(): void {
    this.moveTowardPlayer();
    this.syncTextPosition();
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    // this.syncTextPosition(); // avoid redundancy with sync in update
  }

  /**
   * Applies a math attack operation to this enemy's expression.
   */
  applyAttack(operation: AttackOperation): boolean {
    switch (operation.type) {
      case 'add':
        this.setExpression(addToExpression(this.expression, operation.value));
        return true;
      case 'subtract':
        this.setExpression(addToExpression(this.expression, -operation.value));
        return true;
      case 'derivative':
        return this.applyDerivativeAttack();
    }
  }

  destroy(fromScene?: boolean): void {
    if (this.valueText.active) {
      this.valueText.destroy(fromScene);
    }

    super.destroy(fromScene);
  }

  private moveTowardPlayer(): void {
    const directionX = this.player.x - this.x;
    const directionY = this.player.y - this.y;
    const distance = Math.sqrt(directionX * directionX + directionY * directionY);

    if (distance === 0) {
      this.setVelocity(0, 0);
      return;
    }

    this.setVelocity(
      (directionX / distance) * this.speed,
      (directionY / distance) * this.speed,
    );
  }

  private setExpression(expression: ParsedExpression): void {
    this.expression = expression;
    this.expr = expression.expr;
    this.refreshText();
    this.destroyIfExpressionIsZero();
  }

  private applyDerivativeAttack(): boolean {
    const derivative = differentiate(this.expr);

    if (!derivative.valid) {
      return false;
    }

    this.setExpression(parseExpression(derivative.expr));
    return true;
  }

  private refreshText(): void {
    this.valueText.setText(this.getDisplayValue());
    this.syncTextPosition();
  }

  private syncTextPosition(): void {
    this.valueText.setPosition(this.x, this.y);
  }

  private getDisplayValue(): string {
    return this.expr;
  }

  private destroyIfExpressionIsZero(): void {
    if (isConstantExpressionValue(this.expression, 0)) {
      this.destroy();
    }
  }
}
