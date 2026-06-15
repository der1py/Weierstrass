import Phaser from 'phaser';
import { startLevel } from '../flow/startLevel';
import {
  addTitleBackground,
  createMenuButton,
  destroyUIButton,
  positionButton,
  type UIButton,
} from '../ui/menuButton';

const BUTTON_MARGIN = 24;
const LEVEL_BUTTON_SPACING = 72;
const LEVEL_IDS = [1, 2, 3] as const;

export default class MainMenuScene extends Phaser.Scene {
  private levelButtons: UIButton[] = [];
  private backButton?: UIButton;

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    addTitleBackground(this);
    this.scale.on('resize', this.positionButtons, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown);

    this.levelButtons = LEVEL_IDS.map((levelId) =>
      createMenuButton(
        this,
        0,
        0,
        `Level ${levelId}`,
        () => {
          startLevel(this, levelId);
        },
      ),
    );

    this.backButton = createMenuButton(
      this,
      0,
      0,
      'BACK',
      () => {
        this.scene.start('TitleScene');
      },
    );

    this.positionButtons();
  }

  private positionButtons(): void {
    const { width, height } = this.scale;
    const firstButtonY = height / 2 + 150 - (LEVEL_BUTTON_SPACING * (this.levelButtons.length - 1)) / 2;

    this.levelButtons.forEach((button, index) => {
      positionButton(button, width / 2, firstButtonY + LEVEL_BUTTON_SPACING * index);
    });

    if (this.backButton === undefined) return;

    positionButton(
      this.backButton,
      BUTTON_MARGIN + this.backButton.width / 2,
      height - BUTTON_MARGIN - this.backButton.height / 2,
    );
  }

  private handleShutdown = (): void => {
    this.scale.off('resize', this.positionButtons, this);
    this.levelButtons.forEach((button) => destroyUIButton(this, button));
    destroyUIButton(this, this.backButton);
    this.levelButtons = [];
    this.backButton = undefined;
  };
}
