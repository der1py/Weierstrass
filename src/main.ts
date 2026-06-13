import Phaser from 'phaser';
import './style.css';
import PreloadScene from './scenes/PreloadScene';
import MenuScene from './scenes/MenuScene';
import SlideshowScene from './scenes/SlideshowScene';
import GameScene from './scenes/GameScene';
import GameOverScene from './scenes/GameOverScene';

/**
 * Phaser game configuration.
 * Uses Arcade Physics with no gravity (top-down game).
 */
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 900,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [PreloadScene, MenuScene, SlideshowScene, GameScene, GameOverScene],
};

// Boot the game
new Phaser.Game(config);
