import Phaser from 'phaser';
import Player from '../entities/Player';

/**
 * GameScene — The main gameplay scene.
 *
 * Creates a Player and wires up WASD movement.
 * Intentionally empty otherwise — ready for future systems.
 */
export default class GameScene extends Phaser.Scene {
  private player!: Player;

  constructor() {
    super({ key: 'GameScene' });
  }

  /** Generate a simple colored-rectangle texture for the player. */
  preload(): void {
    // Only generate the texture once
    if (!this.textures.exists('player')) {
      const gfx = this.add.graphics();
      gfx.fillStyle(0x4488ff, 1); // blue rectangle
      gfx.fillRect(0, 0, 32, 32);
      gfx.generateTexture('player', 32, 32);
      gfx.destroy();
    }
  }

  create(): void {
    const { width, height } = this.scale;

    // Spawn the player at the center of the world
    this.player = new Player(this, width / 2, height / 2);
  }

  update(): void {
    // Delegate per-frame logic to the player
    this.player.update();
  }
}
