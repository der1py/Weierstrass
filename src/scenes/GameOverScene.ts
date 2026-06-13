import Phaser from 'phaser';

/**
 * GameOverScene - simple end state with a return path to the menu.
 */
export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 3, 'Game Over', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '48px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const returnButton = this.add
      .text(width / 2, height / 2 + 40, 'Return to Menu', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        color: '#aaffaa',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    returnButton.on('pointerover', () => returnButton.setColor('#ffffff'));
    returnButton.on('pointerout', () => returnButton.setColor('#aaffaa'));
    returnButton.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
