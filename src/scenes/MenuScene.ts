import Phaser from 'phaser';
import type { SlideshowSceneData } from './SlideshowScene';

/**
 * MenuScene — Title screen with a Start button.
 */
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Game title
    this.add
      .text(width / 2, height / 3, 'Weierstrass', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '48px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Start button
    const startBtn = this.add
      .text(width / 2, height / 2 + 40, '▶  Start Game', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        color: '#aaffaa',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Hover effect
    startBtn.on('pointerover', () => startBtn.setColor('#ffffff'));
    startBtn.on('pointerout', () => startBtn.setColor('#aaffaa'));

    // Transition to the game
    startBtn.on('pointerdown', () => {
      const slideshowData: SlideshowSceneData = {
        slides: ['slide_1', 'slide_2', 'slide_3'],
        nextScene: 'GameScene',
      };

      this.scene.start('SlideshowScene', slideshowData);
    });
  }
}
