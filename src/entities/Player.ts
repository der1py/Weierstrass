import Phaser from 'phaser';
import Entity from './Entity';

/** Max speed the player can reach (px/s). */
const PLAYER_SPEED = 300;

/** How quickly the player reaches max speed (px/s^2). */
const ACCELERATION = 1600;

/** How quickly the player stops when no input is given (px/s^2). */
const DECELERATION = 1800;

/**
 * Player - The player-controlled entity.
 *
 * Uses WASD input with normalized velocity steering for smooth,
 * shooter-style movement. Diagonal input is normalized so the
 * player moves at the same speed in all directions.
 */
export default class Player extends Entity {
  private keys!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private speed: number;
  private accel: number;
  private decel: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Use the generated 'player' texture (created in GameScene.preload)
    super(scene, x, y, 'player');

    this.speed = PLAYER_SPEED;
    this.accel = ACCELERATION;
    this.decel = DECELERATION;

    // Keep the player inside the world bounds
    this.setCollideWorldBounds(true);

    /*
    Cap velocity as a physics safety net. Movement below is velocity-driven:
    Arcade acceleration + drag can feel inconsistent during direction changes
    because old velocity bleeds into the new direction. Steering velocity toward
    a normalized target is the standard top-down shooter approach: responsive,
    frame-rate independent, and no diagonal speed advantage.
    */
    this.setMaxVelocity(this.speed);
    this.setAcceleration(0, 0);
    this.setDrag(0);

    // Bind WASD keys
    this.keys = scene.input.keyboard!.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  }

  /** Called every frame by the scene's update loop. */
  update(): void {
    this.handleMovement(this.scene.game.loop.delta / 1000);
  }

  handleMovement(deltaSeconds: number): void {
    // Build a raw input direction vector.
    let dirX = 0;
    let dirY = 0;

    if (this.keys.A.isDown) dirX -= 1;
    if (this.keys.D.isDown) dirX += 1;
    if (this.keys.W.isDown) dirY -= 1;
    if (this.keys.S.isDown) dirY += 1;

    // Normalize so diagonal movement has the same final speed as cardinal movement.
    const len = Math.sqrt(dirX * dirX + dirY * dirY);
    const hasInput = len > 0;
    const targetVelocityX = hasInput ? (dirX / len) * this.speed : 0;
    const targetVelocityY = hasInput ? (dirY / len) * this.speed : 0;
    const rate = hasInput ? this.accel : this.decel;

    this.steerVelocityToward(targetVelocityX, targetVelocityY, rate * deltaSeconds);
  }

  private steerVelocityToward(targetX: number, targetY: number, maxChange: number): void {
    const currentX = this.body!.velocity.x;
    const currentY = this.body!.velocity.y;
    const deltaX = targetX - currentX;
    const deltaY = targetY - currentY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance <= maxChange || distance === 0) {
      this.setVelocity(targetX, targetY);
      return;
    }

    const scale = maxChange / distance;
    this.setVelocity(currentX + deltaX * scale, currentY + deltaY * scale);
  }
}
