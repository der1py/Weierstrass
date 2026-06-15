import Phaser from 'phaser';
import { getLevelConfig } from '../config/levels';
import type { SlideshowSceneData } from '../scenes/SlideshowScene';

export function startLevel(scene: Phaser.Scene, levelId: number): void {
  const level = getLevelConfig(levelId);
  const slideshowData: SlideshowSceneData = {
    slides: level.startSlides,
    nextScene: 'GameScene',
    nextSceneData: { level: level.levelId },
  };

  scene.scene.start('SlideshowScene', slideshowData);
}
