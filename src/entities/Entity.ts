import Phaser from 'phaser';

/**
 * Entity — Base class for all game entities.
 *
 * Extends Phaser's Arcade-physics-enabled Sprite so every entity
 * automatically gets position, velocity, collisions, etc.
 * Subclasses should override `update()` for per-frame logic.
 */
export default class Entity extends Phaser.Physics.Arcade.Sprite {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    frame?: string | number,
  ) {
    super(scene, x, y, texture, frame);

    // Register with the scene's display list and physics world
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }
}
