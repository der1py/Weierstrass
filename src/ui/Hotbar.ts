import Phaser from 'phaser';
import Attack, { type AttackOperation } from '../entities/Attack';
import Player from '../entities/Player';

const SLOT_COUNT = 8;
const SLOT_SIZE = 48;
const SLOT_GAP = 8;
const SLOT_CORNER_RADIUS = 6;
const BOTTOM_MARGIN = 42;
const TOTAL_WIDTH = SLOT_COUNT * SLOT_SIZE + (SLOT_COUNT - 1) * SLOT_GAP;
const ROOT_SHOT_COOLDOWN_MS = 2000;
const DERIVATIVE_ATTACK_COOLDOWN_MS = 10000;
const COOLDOWN_OVERLAY_ALPHA = 0.5;

export interface HotbarItem {
  kind: 'attack' | 'root-shot';
  iconKey: string;
  attackText: string;
  cooldownDuration?: number;
  lastUsedTime?: number;

  createAttack: (
    scene: Phaser.Scene,
    x: number,
    y: number,
    rootValue?: number,
  ) => Attack;
}

type SlotView = {
  background: Phaser.GameObjects.Graphics;
  icon: Phaser.GameObjects.Text;
  cooldownOverlay: Phaser.GameObjects.Graphics;
  cooldownMask: Phaser.GameObjects.Graphics;
};

type HotbarUseItemCallback = (
  item: HotbarItem,
  pointer: Phaser.Input.Pointer,
) => boolean | Promise<boolean> | void;

export default class Hotbar {
  private readonly scene: Phaser.Scene;
  private readonly onUseItem: HotbarUseItemCallback;
  private readonly slots: Array<HotbarItem | null>;
  private readonly container: Phaser.GameObjects.Container;
  private readonly slotViews: SlotView[] = [];
  private selectedIndex = 0;

  constructor(scene: Phaser.Scene, _player: Player, onUseItem: HotbarUseItemCallback) {
    this.scene = scene;
    this.onUseItem = onUseItem;
    this.slots = this.createDefaultLoadout();
    this.container = scene.add.container(0, 0);

    this.container.setDepth(1000);
    this.container.setScrollFactor(0);

    this.createSlotViews();
    this.updateLayout();
    this.renderSlots();
    this.bindInput();

    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.updateCooldownOverlays, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.scene.events.once(Phaser.Scenes.Events.DESTROY, this.destroy, this);
  }

  private createDefaultLoadout(): Array<HotbarItem | null> {
    return [
      this.createAttackItem('attack-add-1', '+', { type: 'add', value: 1 }),
      this.createAttackItem('attack-subtract-1', '-', { type: 'subtract', value: 1 }),
      this.createRootShotItem(),
      this.createAttackItem(
        'attack-derivative',
        'dy/dx',
        { type: 'derivative' },
        DERIVATIVE_ATTACK_COOLDOWN_MS,
      ),
      null,
      null,
      null,
      null,
    ];
  }

  private createAttackItem(
    iconKey: string,
    attackText: string,
    operation: AttackOperation,
    cooldownDuration?: number,
  ): HotbarItem {
    return {
      kind: 'attack',
      iconKey,
      attackText,
      cooldownDuration,
      createAttack: (scene, x, y) =>
        new Attack(scene, x, y, operation, { type: 'text', text: attackText }),
    };
  }

  private createRootShotItem(): HotbarItem {
    return {
      kind: 'root-shot',
      iconKey: 'root-shot',
      attackText: '0',
      cooldownDuration: ROOT_SHOT_COOLDOWN_MS,
      createAttack: (scene, x, y, rootValue = 0) =>
        new Attack(
          scene,
          x,
          y,
          { type: 'add', value: 1 },
          { type: 'text', text: `x = ${rootValue}` },
          rootValue,
        ),
    };
  }

  private createSlotViews(): void {
    for (let index = 0; index < SLOT_COUNT; index += 1) {
      const x = index * (SLOT_SIZE + SLOT_GAP);
      const background = this.scene.add.graphics();
      const cooldownOverlay = this.scene.add.graphics();
      const cooldownMask = this.scene.make.graphics({ add: false });
      const icon = this.scene.add.text(x + SLOT_SIZE / 2, 0, '', {
        color: '#f8f4e8',
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        fontStyle: '700',
      });

      icon.setOrigin(0.5);
      cooldownOverlay.setMask(cooldownMask.createGeometryMask());

      this.container.add([background, icon, cooldownOverlay]);
      this.slotViews.push({ background, icon, cooldownOverlay, cooldownMask });
    }
  }

  private bindInput(): void {
    this.scene.input.on('pointerdown', this.handlePointerDown, this);
    this.scene.input.on('wheel', this.handleWheel, this);
    this.scene.input.keyboard?.on('keydown', this.handleKeyDown, this);
    this.scene.scale.on('resize', this.updateLayout, this);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (pointer.button !== 0) return;

    const item = this.slots[this.selectedIndex];

    if (item === null) return;
    if (this.isOnCooldown(item)) return;

    const useResult = this.onUseItem(item, pointer);

    void Promise.resolve(useResult).then((wasUsed) => {
      if (wasUsed === false) return;

      this.markItemUsed(item);
    });
  }

  private handleWheel(
    _pointer: Phaser.Input.Pointer,
    _currentlyOver: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number,
  ): void {
    if (deltaY === 0) return;

    this.selectSlotWrapped(this.selectedIndex + (deltaY > 0 ? 1 : -1));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const digitMatch = /^Digit([1-8])$/.exec(event.code);
    const numpadMatch = /^Numpad([1-8])$/.exec(event.code);
    const slotNumber = digitMatch?.[1] ?? numpadMatch?.[1];

    if (slotNumber === undefined) return;

    this.selectSlotClamped(Number(slotNumber) - 1);
  }

  private selectSlotClamped(index: number): void {
    this.selectedIndex = Phaser.Math.Clamp(index, 0, SLOT_COUNT - 1);
    this.renderSlots();
  }

  private selectSlotWrapped(index: number): void {
    this.selectedIndex = Phaser.Math.Wrap(index, 0, SLOT_COUNT);
    this.renderSlots();
  }

  private updateLayout(): void {
    const { width, height } = this.scene.scale;
    this.container.setPosition(width / 2 - TOTAL_WIDTH / 2, height - BOTTOM_MARGIN);
    this.renderCooldownMasks();
  }

  private renderSlots(): void {
    for (let index = 0; index < SLOT_COUNT; index += 1) {
      const item = this.slots[index];
      const { background, icon } = this.slotViews[index];
      const x = index * (SLOT_SIZE + SLOT_GAP);
      const isSelected = index === this.selectedIndex;

      background.clear();
      background.fillStyle(item === null ? 0x151821 : 0x253047, 0.92);
      background.fillRoundedRect(
        x,
        -SLOT_SIZE / 2,
        SLOT_SIZE,
        SLOT_SIZE,
        SLOT_CORNER_RADIUS,
      );
      background.lineStyle(isSelected ? 4 : 2, isSelected ? 0xffd166 : 0x566071, 1);
      background.strokeRoundedRect(
        x,
        -SLOT_SIZE / 2,
        SLOT_SIZE,
        SLOT_SIZE,
        SLOT_CORNER_RADIUS,
      );

      const iconLabel = item === null ? '' : this.getIconLabel(item.iconKey);

      icon.setText(iconLabel);
      icon.setFontSize(iconLabel.length > 3 ? 18 : 24);
      icon.setAlpha(item === null ? 0 : 1);
    }

    this.renderCooldownMasks();
    this.updateCooldownOverlays();
  }

  private updateCooldownOverlays(): void {
    for (let index = 0; index < SLOT_COUNT; index += 1) {
      const item = this.slots[index];
      const { cooldownOverlay } = this.slotViews[index];

      cooldownOverlay.clear();

      if (item === null || item.cooldownDuration === undefined) continue;

      const progress = this.getCooldownProgress(item);
      const remainingHeight = SLOT_SIZE * (1 - progress);

      if (remainingHeight <= 0) continue;

      const x = index * (SLOT_SIZE + SLOT_GAP);
      const y = SLOT_SIZE / 2 - remainingHeight;

      cooldownOverlay.fillStyle(0x000000, COOLDOWN_OVERLAY_ALPHA);
      cooldownOverlay.fillRect(x, y, SLOT_SIZE, remainingHeight);
    }
  }

  private renderCooldownMask(index: number): void {
    const { cooldownMask } = this.slotViews[index];
    const x = this.container.x + index * (SLOT_SIZE + SLOT_GAP);
    const y = this.container.y - SLOT_SIZE / 2;

    cooldownMask.clear();
    cooldownMask.fillStyle(0xffffff, 1);
    cooldownMask.fillRoundedRect(
      x,
      y,
      SLOT_SIZE,
      SLOT_SIZE,
      SLOT_CORNER_RADIUS,
    );
  }

  private renderCooldownMasks(): void {
    for (let index = 0; index < SLOT_COUNT; index += 1) {
      this.renderCooldownMask(index);
    }
  }

  private isOnCooldown(item: HotbarItem): boolean {
    if (item.cooldownDuration === undefined || item.lastUsedTime === undefined) {
      return false;
    }

    return performance.now() - item.lastUsedTime < item.cooldownDuration;
  }

  private getCooldownProgress(item: HotbarItem): number {
    if (item.cooldownDuration === undefined || item.lastUsedTime === undefined) {
      return 1;
    }

    const elapsed = performance.now() - item.lastUsedTime;

    return Phaser.Math.Clamp(elapsed / item.cooldownDuration, 0, 1);
  }

  private markItemUsed(item: HotbarItem): void {
    if (item.cooldownDuration === undefined) return;

    item.lastUsedTime = performance.now();
    this.updateCooldownOverlays();
  }

  private destroy(): void {
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.updateCooldownOverlays, this);
    this.scene.scale.off('resize', this.updateLayout, this);
    this.scene.input.off('pointerdown', this.handlePointerDown, this);
    this.scene.input.off('wheel', this.handleWheel, this);
    this.scene.input.keyboard?.off('keydown', this.handleKeyDown, this);

    for (const { cooldownMask } of this.slotViews) {
      cooldownMask.destroy();
    }
  }

  private getIconLabel(iconKey: string): string {
    switch (iconKey) {
      case 'attack-subtract-1':
        return '-1';
      case 'root-shot':
        return '0';
      case 'attack-derivative':
        return 'dy/dx';
      case 'attack-add-1':
      default:
        return '+1';
    }
  }
}
