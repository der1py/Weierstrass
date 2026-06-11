import Phaser from 'phaser';
import Player from '../entities/Player';
import Hotbar, { type HotbarItem } from '../ui/Hotbar';
import karlUrl from '../../assets/karl.png';

/**
 * GameScene — The main gameplay scene.
 *
 * Creates a Player and wires up WASD movement.
 * Intentionally empty otherwise — ready for future systems.
 */
export default class GameScene extends Phaser.Scene {
  private player!: Player;
  private attacks!: Phaser.Physics.Arcade.Group;

  constructor() {
    super({ key: 'GameScene' });
  }

  /** Generate a simple colored-rectangle texture for the player. */
  preload(): void {
    // load sprites
    this.load.image('player', karlUrl);
    this.load.image('attack', karlUrl);

    // Only generate the texture once
    // if (!this.textures.exists('player')) {
    //   const gfx = this.add.graphics();
    //   gfx.fillStyle(0x4488ff, 1); // blue rectangle
    //   gfx.fillRect(0, 0, 32, 32);
    //   gfx.generateTexture('player', 32, 32);
    //   gfx.destroy();
    // }
  }

  create(): void {
    const { width, height } = this.scale;

    // Spawn the player at the center of the world
    this.player = new Player(this, width / 2, height / 2);
    this.player.setDisplaySize(64, 64);

    // Placeholder projectile group for future attack/enemy overlap wiring.
    this.attacks = this.physics.add.group();
    new Hotbar(this, this.player, this.handleUseHotbarItem);
  }

  update(): void {
    // Delegate per-frame logic to the player
    this.player.update();
  }

  private handleUseHotbarItem = (item: HotbarItem, pointer: Phaser.Input.Pointer): void => {
    const attack = item.createAttack(
      this,
      this.player.x,
      this.player.y,
      pointer.worldX,
      pointer.worldY,
    );

    if (!attack.active) return;

    this.attacks.add(attack);
  };

  // Future expansion:
  // this.physics.add.overlap(this.attacks, enemies, (attack, enemy) => {
  //   (attack as Attack).onHit(enemy);
  // });
}
