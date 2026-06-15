import Phaser from 'phaser';
import {
  addTitleBackground,
  createMenuButton,
  destroyUIButton,
  positionButton,
  type UIButton,
} from '../ui/menuButton';

const BUTTON_MARGIN = 24;

export default class TitleScene extends Phaser.Scene {
  private startButton?: UIButton;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    addTitleBackground(this);
    this.scale.on('resize', this.positionStartButton, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown);

    this.startButton = createMenuButton(
      this,
      0,
      0,
      'START',
      () => {
        this.scene.start('MainMenuScene');
      },
    );

    this.positionStartButton();
  }

  private positionStartButton(): void {
    if (this.startButton === undefined) return;

    const { height } = this.scale;
    const x = BUTTON_MARGIN + this.startButton.width / 2;
    const y = height - BUTTON_MARGIN - this.startButton.height / 2;

    positionButton(this.startButton, x, y);
  }

  private handleShutdown = (): void => {
    this.scale.off('resize', this.positionStartButton, this);
    destroyUIButton(this, this.startButton);
    this.startButton = undefined;
  };
}
