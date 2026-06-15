import Phaser from 'phaser';
import karlUrl from '../../assets/karl.png';
import slideOneUrl from '../../assets/slide_1.png';
import slideTwoUrl from '../../assets/slide_2.png';
import slideThreeUrl from '../../assets/slide_3.png';
import l2_1Url from '../../assets/l2_1.png';
import l2_2Url from '../../assets/l2_2.png';
import l2_3Url from '../../assets/l2_3.png';
import l2_4Url from '../../assets/l2_4.png';

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
    this.load.image('slide_3', slideThreeUrl);
    this.load.image('l2_1', l2_1Url);
    this.load.image('l2_2', l2_2Url);
    this.load.image('l2_3', l2_3Url);
    this.load.image('l2_4', l2_4Url);
    
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
