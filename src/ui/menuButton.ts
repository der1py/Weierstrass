import Phaser from 'phaser';

export const NEXT_BUTTON_TEXTURE_KEY = 'next-button-parchment';
export const NEXT_BUTTON_HOVER_TEXTURE_KEY = 'next-button-parchment-hover';

const BUTTON_DEPTH = 1000;
const BUTTON_FADE_DURATION = 1000;
const BUTTON_RADIUS = 10;
const MENU_BUTTON_WIDTH = 220;
const MENU_BUTTON_HEIGHT = 50;
const MENU_BUTTON_FILL = 0x000000;
const MENU_BUTTON_ALPHA = 0.6;
const MENU_BUTTON_HOVER_ALPHA = 0.72;
const NEXT_BUTTON_WIDTH = 135;
const NEXT_BUTTON_HEIGHT = 50;
const NEXT_BUTTON_TEXTURE_PADDING_X = 8;
const NEXT_BUTTON_TEXTURE_PADDING_Y = 10;
const NEXT_BUTTON_FILL = 0xf0d9a4;
const NEXT_BUTTON_HOVER_FILL = 0xffe7ae;

const MENU_BUTTON_TEXT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  color: '#ffffff',
  fontFamily: 'Arial, sans-serif',
  fontSize: '28px',
};

const TEXTURE_BUTTON_TEXT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  color: '#3f2a12',
  fontFamily: 'Georgia, Times New Roman, serif',
  fontSize: '24px',
  fontStyle: '700',
};

type ButtonTextureMetrics = {
  bodyWidth: number;
  bodyHeight: number;
  textureWidth: number;
  textureHeight: number;
};

type ButtonVisual = Phaser.GameObjects.Graphics | Phaser.GameObjects.Image;

export type UIButton = {
  visual: ButtonVisual;
  label: Phaser.GameObjects.Text;
  hitArea: Phaser.GameObjects.Zone;
  width: number;
  height: number;
  setHoverState: (isHovered: boolean) => void;
};

export function createMenuButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  onClick: () => void,
  depth = BUTTON_DEPTH,
): UIButton {
  const visual = scene.add.graphics();
  const label = scene.add.text(0, 0, text, MENU_BUTTON_TEXT_STYLE);

  drawMenuButtonBackground(visual, MENU_BUTTON_ALPHA);

  return createUIButton(scene, {
    x,
    y,
    visual,
    label,
    width: MENU_BUTTON_WIDTH,
    height: MENU_BUTTON_HEIGHT,
    onClick,
    depth,
    setHoverState: (isHovered) => {
      drawMenuButtonBackground(visual, isHovered ? MENU_BUTTON_HOVER_ALPHA : MENU_BUTTON_ALPHA);
    },
  });
}

export function createTextureButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  texture: string,
  hoverTexture: string,
  text: string,
  onClick: () => void,
  depth = BUTTON_DEPTH,
): UIButton {
  createButtonTexture(scene, texture, NEXT_BUTTON_FILL);
  createButtonTexture(scene, hoverTexture, NEXT_BUTTON_HOVER_FILL);

  const visual = scene.add.image(0, 0, texture);
  const label = scene.add.text(0, 0, text, TEXTURE_BUTTON_TEXT_STYLE);

  visual.setOrigin(0.5);

  return createUIButton(scene, {
    x,
    y,
    visual,
    label,
    width: visual.width,
    height: visual.height,
    onClick,
    depth,
    setHoverState: (isHovered) => {
      visual.setTexture(isHovered ? hoverTexture : texture);
    },
  });
}

export function positionButton(uiButton: UIButton, x: number, y: number): void {
  uiButton.visual.x = x;
  uiButton.visual.y = y;
  uiButton.label.x = x;
  uiButton.label.y = y;
  uiButton.hitArea.x = x;
  uiButton.hitArea.y = y;
}

export function destroyUIButton(scene: Phaser.Scene, uiButton: UIButton | undefined): void {
  if (uiButton === undefined) return;

  scene.tweens.killTweensOf(uiButton.visual);
  scene.tweens.killTweensOf(uiButton.label);
  uiButton.hitArea.destroy();
  uiButton.visual.destroy();
  uiButton.label.destroy();
}

export function addTitleBackground(scene: Phaser.Scene): Phaser.GameObjects.Image {
  const { width, height } = scene.scale;

  return scene.add
    .image(0, 0, 'title_screen')
    .setOrigin(0)
    .setDisplaySize(width, height);
}

type CreateUIButtonConfig = {
  x: number;
  y: number;
  visual: ButtonVisual;
  label: Phaser.GameObjects.Text;
  width: number;
  height: number;
  onClick: () => void;
  depth: number;
  setHoverState: (isHovered: boolean) => void;
};

function createUIButton(scene: Phaser.Scene, config: CreateUIButtonConfig): UIButton {
  const hitArea = scene.add.zone(0, 0, config.width, config.height);

  config.visual.setDepth(config.depth);
  config.visual.setScrollFactor(0);
  config.visual.setAlpha(0);

  config.label.setOrigin(0.5);
  config.label.setDepth(config.depth + 1);
  config.label.setScrollFactor(0);
  config.label.setAlpha(0);

  hitArea.setOrigin(0.5);
  hitArea.setDepth(config.depth + 2);
  hitArea.setScrollFactor(0);

  const uiButton: UIButton = {
    visual: config.visual,
    label: config.label,
    hitArea,
    width: config.width,
    height: config.height,
    setHoverState: config.setHoverState,
  };

  positionButton(uiButton, config.x, config.y);

  hitArea.on('pointerover', () => {
    config.visual.setScale(1.05);
    config.label.setScale(1.05);
    hitArea.setScale(1.05);
    config.setHoverState(true);
  });

  hitArea.on('pointerout', () => {
    config.visual.setScale(1);
    config.label.setScale(1);
    hitArea.setScale(1);
    config.setHoverState(false);
  });

  hitArea.on('pointerdown', () => {
    scene.tweens.add({
      targets: [config.visual, config.label],
      scaleX: 0.96,
      scaleY: 0.96,
      duration: 70,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });

    config.onClick();
  });

  scene.tweens.add({
    targets: [config.visual, config.label],
    alpha: 1,
    duration: BUTTON_FADE_DURATION,
    ease: 'Sine.easeOut',
    onComplete: () => {
      hitArea.setInteractive({ useHandCursor: true });
    },
  });

  return uiButton;
}

function drawMenuButtonBackground(graphics: Phaser.GameObjects.Graphics, alpha: number): void {
  graphics.clear();
  graphics.fillStyle(MENU_BUTTON_FILL, alpha);
  graphics.fillRoundedRect(
    -MENU_BUTTON_WIDTH / 2,
    -MENU_BUTTON_HEIGHT / 2,
    MENU_BUTTON_WIDTH,
    MENU_BUTTON_HEIGHT,
    BUTTON_RADIUS,
  );
}

function createButtonTexture(scene: Phaser.Scene, textureKey: string, fillColor: number): void {
  if (scene.textures.exists(textureKey)) return;

  const metrics = getButtonTextureMetrics();
  const graphics = scene.add.graphics();
  const buttonX = (metrics.textureWidth - metrics.bodyWidth) / 2;
  const buttonY = (metrics.textureHeight - metrics.bodyHeight) / 2;

  graphics.fillStyle(0x1f1308, 0.38);
  graphics.fillRoundedRect(
    buttonX + 3,
    buttonY + 4,
    metrics.bodyWidth,
    metrics.bodyHeight,
    BUTTON_RADIUS,
  );

  graphics.fillStyle(fillColor, 0.96);
  graphics.fillRoundedRect(buttonX, buttonY, metrics.bodyWidth, metrics.bodyHeight, BUTTON_RADIUS);
  graphics.lineStyle(3, 0x8f6330, 1);
  graphics.strokeRoundedRect(buttonX, buttonY, metrics.bodyWidth, metrics.bodyHeight, BUTTON_RADIUS);
  graphics.lineStyle(1, 0xfff1c7, 0.45);
  graphics.lineBetween(buttonX + 16, buttonY + 14, buttonX + metrics.bodyWidth - 18, buttonY + 11);
  graphics.lineStyle(1, 0xb88442, 0.25);
  graphics.lineBetween(
    buttonX + 18,
    buttonY + metrics.bodyHeight - 13,
    buttonX + metrics.bodyWidth - 14,
    buttonY + metrics.bodyHeight - 16,
  );

  graphics.generateTexture(textureKey, metrics.textureWidth, metrics.textureHeight);
  graphics.destroy();
}

function getButtonTextureMetrics(): ButtonTextureMetrics {
  return {
    bodyWidth: NEXT_BUTTON_WIDTH,
    bodyHeight: NEXT_BUTTON_HEIGHT,
    textureWidth: NEXT_BUTTON_WIDTH + NEXT_BUTTON_TEXTURE_PADDING_X,
    textureHeight: NEXT_BUTTON_HEIGHT + NEXT_BUTTON_TEXTURE_PADDING_Y,
  };
}
