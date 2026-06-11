import Phaser from 'phaser';
import Attack from '../entities/Attack';
import Player from '../entities/Player';

const SLOT_COUNT = 8;
const SLOT_SIZE = 48;
const SLOT_GAP = 8;
const BOTTOM_MARGIN = 42;
const TOTAL_WIDTH = SLOT_COUNT * SLOT_SIZE + (SLOT_COUNT - 1) * SLOT_GAP;

export interface HotbarItem {
  iconKey: string;

  createAttack: (
    scene: Phaser.Scene,
    x: number,
    y: number,
    targetX: number,
    targetY: number,
  ) => Attack;
}

type SlotView = {
  background: Phaser.GameObjects.Graphics;
  icon: Phaser.GameObjects.Text;
};

type HotbarUseItemCallback = (item: HotbarItem, pointer: Phaser.Input.Pointer) => void;

export default class Hotbar {
  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly onUseItem: HotbarUseItemCallback;
  private readonly slots: Array<HotbarItem | null>;
  private readonly container: Phaser.GameObjects.Container;
  private readonly slotViews: SlotView[] = [];
  private selectedIndex = 0;

  constructor(scene: Phaser.Scene, player: Player, onUseItem: HotbarUseItemCallback) {
    this.scene = scene;
    this.player = player;
    this.onUseItem = onUseItem;
    this.slots = this.createDefaultLoadout();
    this.container = scene.add.container(0, 0);

    this.container.setDepth(1000);
    this.container.setScrollFactor(0);

    this.createSlotViews();
    this.updateLayout();
    this.renderSlots();
    this.bindInput();
  }

  private createDefaultLoadout(): Array<HotbarItem | null> {
    return [
      {
        iconKey: 'attack-add-1',
        createAttack: (scene, x, y, targetX, targetY) =>
          new Attack(scene, x, y, targetX, targetY, { type: 'add', value: 1 }),
      },
      {
        iconKey: 'attack-subtract-1',
        createAttack: (scene, x, y, targetX, targetY) =>
          new Attack(scene, x, y, targetX, targetY, { type: 'subtract', value: 1 }),
      },
      null,
      null,
      null,
      null,
      null,
      null,
    ];
  }

  private createSlotViews(): void {
    for (let index = 0; index < SLOT_COUNT; index += 1) {
      const x = index * (SLOT_SIZE + SLOT_GAP);
      const background = this.scene.add.graphics();
      const icon = this.scene.add.text(x + SLOT_SIZE / 2, 0, '', {
        color: '#f8f4e8',
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        fontStyle: '700',
      });

      icon.setOrigin(0.5);

      this.container.add([background, icon]);
      this.slotViews.push({ background, icon });
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

    this.onUseItem(item, pointer);
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
  }

  private renderSlots(): void {
    for (let index = 0; index < SLOT_COUNT; index += 1) {
      const item = this.slots[index];
      const { background, icon } = this.slotViews[index];
      const x = index * (SLOT_SIZE + SLOT_GAP);
      const isSelected = index === this.selectedIndex;

      background.clear();
      background.fillStyle(item === null ? 0x151821 : 0x253047, 0.92);
      background.fillRoundedRect(x, -SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE, 6);
      background.lineStyle(isSelected ? 4 : 2, isSelected ? 0xffd166 : 0x566071, 1);
      background.strokeRoundedRect(x, -SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE, 6);

      icon.setText(item === null ? '' : this.getIconLabel(item.iconKey));
      icon.setAlpha(item === null ? 0 : 1);
    }
  }

  private getIconLabel(iconKey: string): string {
    switch (iconKey) {
      case 'attack-subtract-1':
        return '-1';
      case 'attack-add-1':
      default:
        return '+1';
    }
  }
}
