import Phaser from 'phaser';
import './style.css';
import MenuScene from './scenes/MenuScene';
import GameScene from './scenes/GameScene';

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
  scene: [MenuScene, GameScene],
};

// Boot the game
new Phaser.Game(config);
