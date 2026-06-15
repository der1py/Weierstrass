import Phaser from 'phaser';
import Player from '../entities/Player';
import { getLevelConfig, type LevelConfig } from '../config/levels';
import EnemySpawner from '../systems/EnemySpawner';
import Hotbar, { type HotbarItem } from '../ui/Hotbar';
import RootShotPrompt from '../ui/RootShotPrompt';
import { spawnExplosion } from '../effects/spawnExplosion';
import type { AttackOperation } from '../entities/Attack';
import type Attack from '../entities/Attack';
import { startLevel } from '../flow/startLevel';
import type { SlideshowSceneData } from './SlideshowScene';
import backgroundUrl from '../../assets/background.png';
import karlUrl from '../../assets/karl.png';

const PROJECTILE_SPAWN_PADDING = 4;
const HUD_X = 16;
const HUD_Y = 16;
const HUD_LINE_HEIGHT = 30;
const ENEMY_HOVER_MARGIN = 16;
const WIN_SLIDES = ['win'];

interface GameSceneData {
  level?: number;
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
  private levelText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private hpText!: Phaser.GameObjects.Text;
  private enemyHoverText!: Phaser.GameObjects.Text;
  private rootShotPrompt!: RootShotPrompt;
  private hotbar!: Hotbar;
  private isGameOver = false;
  private isLevelComplete = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameSceneData = {}): void {
    this.levelConfig = getLevelConfig(data.level ?? data.levelId ?? 1);
  }

  /** Generate a simple colored-rectangle texture for the player. */
  preload(): void {
    // load sprites
    this.load.image('player', karlUrl);
    this.load.image('attack', karlUrl);
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
    this.isLevelComplete = false;
    this.setupBackground();

    // Spawn the player at the center of the world
    this.player = new Player(this, width / 2, height / 2);
    this.player.setDisplaySize(64, 64);
    this.createHud();

    // Arcade groups stay scene-owned while systems control their behavior.
    this.attacks = this.physics.add.group();
    this.enemies = this.physics.add.group();
    this.enemySpawner = new EnemySpawner(
      this,
      this.player,
      this.enemies,
      this.levelConfig.waves,
      {
        onWaveStarted: this.handleWaveStarted,
        onAllWavesCleared: this.handleAllWavesCleared,
        onEnemyHoverStart: this.showEnemyHoverText,
        onEnemyHoverEnd: this.hideEnemyHoverText,
      },
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

    this.rootShotPrompt = new RootShotPrompt(this);
    this.hotbar = new Hotbar(this, this.player, this.handleUseHotbarItem, {
      levelId: this.levelConfig.levelId,
    });
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
    if (this.isGameOver || this.isLevelComplete) return;

    // Delegate per-frame logic to the player
    this.player.update();
    this.enemySpawner.update(time);
  }

  private createHud(): void {
    this.levelText = this.createHudText(HUD_X, HUD_Y, '');
    this.waveText = this.createHudText(
      HUD_X,
      HUD_Y + HUD_LINE_HEIGHT,
      '',
    );
    this.hpText = this.createHudText(
      HUD_X,
      HUD_Y + HUD_LINE_HEIGHT * 2,
      '',
    );
    this.enemyHoverText = this.createHudText(0, 0, '');
    this.enemyHoverText.setOrigin(1, 1);
    this.enemyHoverText.setVisible(false);
    this.positionEnemyHoverText();
    this.scale.on('resize', this.positionEnemyHoverText, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.unbindHudEvents, this);

    this.updateLevelText();
    this.updateWaveText(0);
    this.updateHpText();
  }

  private createHudText(x: number, y: number, text: string): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, text, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setScrollFactor(0)
      .setDepth(100);
  }

  private updateLevelText(): void {
    this.levelText.setText(this.getLevelText());
  }

  private updateWaveText(waveIndex: number): void {
    this.waveText.setText(this.getWaveText(waveIndex));
  }

  private updateHpText(): void {
    this.hpText.setText(this.getHpText());
  }

  private showEnemyHoverText = (value: string): void => {
    this.enemyHoverText.setText(value);
    this.enemyHoverText.setVisible(true);
    this.positionEnemyHoverText();
  };

  private hideEnemyHoverText = (): void => {
    this.enemyHoverText.setVisible(false);
  };

  private positionEnemyHoverText = (): void => {
    const { width, height } = this.scale;

    this.enemyHoverText.setPosition(
      width - ENEMY_HOVER_MARGIN,
      height - ENEMY_HOVER_MARGIN,
    );
  };

  private unbindHudEvents = (): void => {
    this.scale.off('resize', this.positionEnemyHoverText, this);
  };

  private getLevelText(): string {
    return `Level ${this.levelConfig.levelId}`;
  }

  private getWaveText(waveIndex: number): string {
    return `Wave ${waveIndex + 1}/${this.levelConfig.waves.length}`;
  }

  private getHpText(): string {
    return `HP: ${this.player.hp}`;
  }

  private handleWaveStarted = (waveIndex: number): void => {
    if (waveIndex > 0) {
      this.hotbar.resetCooldowns();
    }

    this.updateWaveText(waveIndex);
  };

  private handleAllWavesCleared = (): void => {
    this.hotbar.resetCooldowns();
    this.advanceAfterLevelComplete();
  };

  private advanceAfterLevelComplete(): void {
    if (this.isLevelComplete || this.isGameOver) return;

    this.isLevelComplete = true;

    const { nextLevelId } = this.levelConfig;

    if (nextLevelId === null) {
      const slideshowData: SlideshowSceneData = {
        slides: WIN_SLIDES,
        nextScene: 'MainMenuScene',
      };

      this.scene.start('SlideshowScene', slideshowData);
      return;
    }

    startLevel(this, nextLevelId);
  }

  private handleUseHotbarItem = (
    item: HotbarItem,
    pointer: Phaser.Input.Pointer,
  ): boolean | Promise<boolean> => {
    const targetX = pointer.worldX;
    const targetY = pointer.worldY;

    if (item.kind === 'root-shot') {
      return this.handleUseRootShot(item, targetX, targetY);
    }

    const attack = item.createAttack(this, this.player.x, this.player.y);

    this.fireAttack(attack, targetX, targetY);
    return true;
  };

  private async handleUseRootShot(
    item: HotbarItem,
    targetX: number,
    targetY: number,
  ): Promise<boolean> {
    if (this.rootShotPrompt.isOpen) return false;

    this.scene.pause();

    let rootValue = 0;

    try {
      rootValue = await this.rootShotPrompt.prompt();
    } finally {
      this.scene.resume('GameScene');
    }

    if (this.isGameOver || this.isLevelComplete) return false;

    const attack = item.createAttack(this, this.player.x, this.player.y, rootValue);

    this.fireAttack(attack, targetX, targetY);
    return true;
  }

  private fireAttack(attack: Attack, targetX: number, targetY: number): void {
    const aimX = targetX - this.player.x;
    const aimY = targetY - this.player.y;
    const aimLength = Math.sqrt(aimX * aimX + aimY * aimY);

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

    attack.fireTowards(targetX, targetY); // fire afterwards so physics works properly
  }

  private handlePlayerEnemyOverlap(): void {
    if (this.isGameOver || this.isLevelComplete) return;

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
    type AttackProjectile = Phaser.GameObjects.GameObject & {
      active: boolean;
      operation: AttackOperation;
      destroy(fromScene?: boolean): void;
    };
    type RootShotProjectile = Phaser.GameObjects.GameObject & {
      active: boolean;
      rootValue: number;
      destroy(fromScene?: boolean): void;
    };
    type AttackableEnemy = Phaser.GameObjects.GameObject & {
      active: boolean;
      x: number;
      y: number;
      applyAttack(operation: AttackOperation): boolean;
    };
    type RootEvaluatableEnemy = Phaser.GameObjects.GameObject & {
      active: boolean;
      x: number;
      y: number;
      evaluate(x: number): number;
      destroy(fromScene?: boolean): void;
    };

    const isRecord = (value: unknown): value is Record<string, unknown> =>
      typeof value === 'object' && value !== null;

    const isAttackOperation = (value: unknown): value is AttackOperation =>
      isRecord(value) &&
      (
        ((value.type === 'add' || value.type === 'subtract') && value.value === 1) ||
        value.type === 'derivative'
      );

    const isAttackProjectile = (value: unknown): value is AttackProjectile =>
      isRecord(value) &&
      value.active === true &&
      isAttackOperation(value.operation) &&
      typeof value.destroy === 'function';

    const isRootShotProjectile = (value: unknown): value is RootShotProjectile =>
      isRecord(value) &&
      value.active === true &&
      typeof value.rootValue === 'number' &&
      Number.isFinite(value.rootValue) &&
      typeof value.destroy === 'function';

    const isAttackableEnemy = (value: unknown): value is AttackableEnemy =>
      isRecord(value) &&
      value.active === true &&
      typeof value.x === 'number' &&
      typeof value.y === 'number' &&
      typeof value.applyAttack === 'function';

    const isRootEvaluatableEnemy = (value: unknown): value is RootEvaluatableEnemy =>
      isRecord(value) &&
      value.active === true &&
      typeof value.x === 'number' &&
      typeof value.y === 'number' &&
      typeof value.evaluate === 'function' &&
      typeof value.destroy === 'function';

    if (isRootShotProjectile(attackObj)) {
      if (isRootEvaluatableEnemy(enemyObj)) {
        this.handleRootShotEnemyOverlap(attackObj, enemyObj);
      } else {
        attackObj.destroy();
      }

      return;
    }

    if (!isAttackProjectile(attackObj) || !isAttackableEnemy(enemyObj)) {
      return;
    }

    const enemyX = enemyObj.x;
    const enemyY = enemyObj.y;
    const wasApplied = enemyObj.applyAttack(attackObj.operation);

    if (wasApplied) {
      spawnExplosion(this, enemyX, enemyY);
    }

    attackObj.destroy();
  }

  private handleRootShotEnemyOverlap(
    attackObj: {
      rootValue: number;
      destroy(fromScene?: boolean): void;
    },
    enemyObj: {
      x: number;
      y: number;
      evaluate(x: number): number;
      destroy(fromScene?: boolean): void;
    },
  ): void {
    try {
      if (enemyObj.evaluate(attackObj.rootValue) === 0) {
        spawnExplosion(this, enemyObj.x, enemyObj.y);
        enemyObj.destroy();
      }
    } catch {
      // Invalid enemy functions should not break collision handling.
    }

    attackObj.destroy();
  }
}
