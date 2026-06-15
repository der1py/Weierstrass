import Phaser from 'phaser';
import {
  createMenuButton,
  destroyUIButton,
  positionButton,
  type UIButton,
} from '../ui/menuButton';

/**
 * GameOverScene - simple end state with a return path to the menu.
 */
export default class GameOverScene extends Phaser.Scene {
  private returnButton?: UIButton;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    this.scale.on('resize', this.positionReturnButton, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown);

    this.add
      .text(width / 2, height / 3, 'Game Over', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '48px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.returnButton = createMenuButton(
      this,
      0,
      0,
      'Return to Menu',
      () => this.scene.start('MainMenuScene'),
    );

    this.positionReturnButton();
  }

  private positionReturnButton(): void {
    if (this.returnButton === undefined) return;

    const { width, height } = this.scale;
    positionButton(this.returnButton, width / 2, height / 2 + 40);
  }

  private handleShutdown = (): void => {
    this.scale.off('resize', this.positionReturnButton, this);
    destroyUIButton(this, this.returnButton);
    this.returnButton = undefined;
  };
}
