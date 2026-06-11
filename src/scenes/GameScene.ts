import Phaser from 'phaser';
import Player from '../entities/Player';
import Hotbar, { type HotbarItem } from '../ui/Hotbar';
import backgroundUrl from '../../assets/background.png';
import karlUrl from '../../assets/karl.png';
import plusAttackUrl from '../../assets/plus.jpg';
import minusAttackUrl from '../../assets/minus.jpeg';

const PROJECTILE_SPAWN_PADDING = 4;

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
    this.load.image('plusAttack', plusAttackUrl);
    this.load.image('minusAttack', minusAttackUrl);
    this.load.image('background', backgroundUrl);

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

    this.setupBackground();

    // Spawn the player at the center of the world
    this.player = new Player(this, width / 2, height / 2);
    this.player.setDisplaySize(64, 64);

    // Placeholder projectile group for future attack/enemy overlap wiring.
    this.attacks = this.physics.add.group();
    new Hotbar(this, this.player, this.handleUseHotbarItem);
  }

  setupBackground(): void {
    const bg = this.add.image(0, 0, 'background');
    bg.setOrigin(0);

    const scale = Math.max(
      this.scale.width / bg.width,
      this.scale.height / bg.height,
    );

    bg.setScale(scale);
  }

  update(): void {
    // Delegate per-frame logic to the player
    this.player.update();
  }

  private handleUseHotbarItem = (item: HotbarItem, pointer: Phaser.Input.Pointer): void => {
    const aimX = pointer.worldX - this.player.x;
    const aimY = pointer.worldY - this.player.y;
    const aimLength = Math.sqrt(aimX * aimX + aimY * aimY);

    const attack = item.createAttack(
      this,
      this.player.x,
      this.player.y,
    );

    if (!attack.active) return;

    if (aimLength > 0) {
      const directionX = aimX / aimLength;
      const directionY = aimY / aimLength;
      const spawnOffset =
        this.player.displayWidth / 2 + attack.displayWidth / 2 + PROJECTILE_SPAWN_PADDING;

      attack.setPosition(
        this.player.x + directionX * spawnOffset,
        this.player.y + directionY * spawnOffset,
      );
    }

    this.attacks.add(attack);

    attack.fireTowards(pointer.worldX, pointer.worldY); // fire afterwards so physics works properly
  };

  // Future expansion:
  // this.physics.add.overlap(this.attacks, enemies, (attack, enemy) => {
  //   (attack as Attack).onHit(enemy);
  // });
}
