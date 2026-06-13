import Phaser from 'phaser';
import karlUrl from '../../assets/karl.png';
import slideOneUrl from '../../assets/slide_1.png';
import slideTwoUrl from '../../assets/slide_2.png';

/**
 * PreloadScene loads shared assets before the menu is shown.
 * Shared across all scenes, so it's a good place for common assets e.g. player sprite
 */
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    this.load.image('karl', karlUrl);
    this.load.image('slide_1', slideOneUrl);
    this.load.image('slide_2', slideTwoUrl);
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
