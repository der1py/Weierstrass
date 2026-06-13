import Phaser from 'phaser';
import Player from '../entities/Player';
import { getLevelConfig, type LevelConfig } from '../config/levels';
import EnemySpawner from '../systems/EnemySpawner';
import Hotbar, { type HotbarItem } from '../ui/Hotbar';
import backgroundUrl from '../../assets/background.png';
import karlUrl from '../../assets/karl.png';
import plusAttackUrl from '../../assets/plus.jpg';
import minusAttackUrl from '../../assets/minus.jpeg';

const PROJECTILE_SPAWN_PADDING = 4;

interface GameSceneData {
  levelId?: number;
}

/**
 * GameScene — The main gameplay scene.
 *
 * Creates core gameplay entities and delegates system behavior.
 */
export default class GameScene extends Phaser.Scene {
  private player!: Player;
  private attacks!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private enemySpawner!: EnemySpawner;
  private levelConfig!: LevelConfig;
  private hpText!: Phaser.GameObjects.Text;
  private isGameOver = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameSceneData = {}): void {
    this.levelConfig = getLevelConfig(data.levelId ?? 1);
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

    this.isGameOver = false;
    this.setupBackground();

    // Spawn the player at the center of the world
    this.player = new Player(this, width / 2, height / 2);
    this.player.setDisplaySize(64, 64);
    this.createHpText();

    // Arcade groups stay scene-owned while systems control their behavior.
    this.attacks = this.physics.add.group();
    this.enemies = this.physics.add.group();
    this.enemySpawner = new EnemySpawner(
      this,
      this.player,
      this.enemies,
      this.levelConfig.waves,
    );
    this.physics.add.overlap(
      this.attacks,
      this.enemies,
      this.handleAttackEnemyOverlap,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.handlePlayerEnemyOverlap,
      undefined,
      this,
    );

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

  update(time: number): void {
    if (this.isGameOver) return;

    // Delegate per-frame logic to the player
    this.player.update();
    this.enemySpawner.update(time);
  }

  private createHpText(): void {
    this.hpText = this.add
      .text(16, 16, this.getHpText(), {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setScrollFactor(0)
      .setDepth(100);
  }

  private updateHpText(): void {
    this.hpText.setText(this.getHpText());
  }

  private getHpText(): string {
    return `Level ${this.levelConfig.levelId}\nHP: ${this.player.hp}/${this.player.maxHp}`;
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

  private handlePlayerEnemyOverlap(): void {
    if (this.isGameOver) return;

    const wasDamaged = this.player.takeDamage(1);

    if (!wasDamaged) return;

    this.updateHpText();

    if (this.player.isDead()) {
      this.startGameOver();
    }
  }

  private startGameOver(): void {
    if (this.isGameOver) return;

    this.isGameOver = true;
    this.scene.start('GameOverScene');
  }

  handleAttackEnemyOverlap(
    attackObj:
      | Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody
      | Phaser.Tilemaps.Tile,
    enemyObj:
      | Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody
      | Phaser.Tilemaps.Tile,
  ): void {
    console.log('Attack hit enemy!');
    type AttackOperation = { type: 'add' | 'subtract'; value: 1 };
    type AttackProjectile = Phaser.GameObjects.GameObject & {
      active: boolean;
      operation: AttackOperation;
      destroy(fromScene?: boolean): void;
    };
    type AttackableEnemy = Phaser.GameObjects.GameObject & {
      active: boolean;
      applyAttack(operation: AttackOperation): void;
    };

    const isRecord = (value: unknown): value is Record<string, unknown> =>
      typeof value === 'object' && value !== null;

    const isAttackOperation = (value: unknown): value is AttackOperation =>
      isRecord(value) &&
      (value.type === 'add' || value.type === 'subtract') &&
      value.value === 1;

    const isAttackProjectile = (value: unknown): value is AttackProjectile =>
      isRecord(value) &&
      value.active === true &&
      isAttackOperation(value.operation) &&
      typeof value.destroy === 'function';

    const isAttackableEnemy = (value: unknown): value is AttackableEnemy =>
      isRecord(value) &&
      value.active === true &&
      typeof value.applyAttack === 'function';

    if (!isAttackProjectile(attackObj) || !isAttackableEnemy(enemyObj)) {
      return;
    }

    enemyObj.applyAttack(attackObj.operation);
    attackObj.destroy();
  }
}
