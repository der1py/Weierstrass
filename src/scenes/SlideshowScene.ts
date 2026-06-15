import Phaser from 'phaser';

export type SlideshowSceneData = {
  slides: string[];
  nextScene: string;
  nextSceneData?: object;
};

const NEXT_BUTTON_WIDTH = 135;
const NEXT_BUTTON_HEIGHT = 50;
const NEXT_BUTTON_PADDING = 28;
const NEXT_BUTTON_RADIUS = 10;
const NEXT_BUTTON_DEPTH = 1000;
const NEXT_BUTTON_TEXTURE_WIDTH = NEXT_BUTTON_WIDTH + 8;
const NEXT_BUTTON_TEXTURE_HEIGHT = NEXT_BUTTON_HEIGHT + 9;
const NEXT_BUTTON_TEXTURE_KEY = 'next-button-parchment';
const NEXT_BUTTON_HOVER_TEXTURE_KEY = 'next-button-parchment-hover';

/**
 * SlideshowScene displays full-screen images and advances from a dedicated UI button.
 */
export default class SlideshowScene extends Phaser.Scene {
  private slides: string[] = [];
  private currentSlideIndex = 0;
  private nextScene = '';
  private nextSceneData?: object;
  private currentImage?: Phaser.GameObjects.Image;
  private nextButton?: Phaser.GameObjects.Image;
  private nextButtonLabel?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'SlideshowScene' });
  }

  init(data: Partial<SlideshowSceneData> = {}): void {
    this.slides = this.isValidSlideList(data.slides) ? data.slides : [];
    this.nextScene = typeof data.nextScene === 'string' ? data.nextScene : '';
    this.nextSceneData = data.nextSceneData;
    this.currentSlideIndex = 0;
    this.currentImage = undefined;
    this.nextButton = undefined;
    this.nextButtonLabel = undefined;
  }

  create(): void {
    this.scale.on('resize', this.positionNextButton, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown);

    if (this.slides.length === 0) {
      console.warn('SlideshowScene received no slides. Starting next scene.');
      this.startNextScene();
      return;
    }

    this.showCurrentSlide();
    this.createNextButton();
  }

  private showCurrentSlide(): void {
    if (this.currentSlideIndex >= this.slides.length) {
      this.startNextScene();
      return;
    }

    this.currentImage?.destroy();

    const { width, height } = this.scale;
    const slideKey = this.slides[this.currentSlideIndex];
    const image = this.add.image(width / 2, height / 2, slideKey);
    const scale = Math.max(width / image.width, height / image.height);

    image.setOrigin(0.5);
    image.setScale(scale);

    this.currentImage = image;
  }

  private createNextButton(): void {
    this.createNextButtonTexture(NEXT_BUTTON_TEXTURE_KEY, 0xf0d9a4);
    this.createNextButtonTexture(NEXT_BUTTON_HOVER_TEXTURE_KEY, 0xffe7ae);

    const button = this.add.image(0, 0, NEXT_BUTTON_TEXTURE_KEY);
    const label = this.add.text(0, 0, 'Next', {
      color: '#3f2a12',
      fontFamily: 'Georgia, Times New Roman, serif',
      fontSize: '24px',
      fontStyle: '700',
    });

    button.setOrigin(0.5);
    button.setDepth(NEXT_BUTTON_DEPTH);
    button.setScrollFactor(0);
    button.setAlpha(0);

    label.setOrigin(0.5);
    label.setDepth(NEXT_BUTTON_DEPTH + 1);
    label.setScrollFactor(0);
    label.setAlpha(0);

    this.nextButton = button;
    this.nextButtonLabel = label;

    this.positionNextButton();

    button.on('pointerover', this.handleNextButtonOver);
    button.on('pointerout', this.handleNextButtonOut);
    button.on('pointerdown', this.handleNextButtonDown);

    this.tweens.add({
      targets: [button, label],
      alpha: 1,
      duration: 1000,
      ease: 'Sine.easeOut',
      onComplete: () => this.enableNextButton(),
    });
  }

  private createNextButtonTexture(textureKey: string, fillColor: number): void {
    if (this.textures.exists(textureKey)) return;

    const graphics = this.add.graphics();
    const buttonX = 0;
    const buttonY = 0;

    graphics.fillStyle(0x1f1308, 0.38);
    graphics.fillRoundedRect(
      buttonX + 4,
      buttonY + 5,
      NEXT_BUTTON_WIDTH,
      NEXT_BUTTON_HEIGHT,
      NEXT_BUTTON_RADIUS,
    );

    graphics.fillStyle(fillColor, 0.96);
    graphics.fillRoundedRect(
      buttonX,
      buttonY,
      NEXT_BUTTON_WIDTH,
      NEXT_BUTTON_HEIGHT,
      NEXT_BUTTON_RADIUS,
    );
    graphics.lineStyle(3, 0x8f6330, 1);
    graphics.strokeRoundedRect(
      buttonX,
      buttonY,
      NEXT_BUTTON_WIDTH,
      NEXT_BUTTON_HEIGHT,
      NEXT_BUTTON_RADIUS,
    );
    graphics.lineStyle(1, 0xfff1c7, 0.45);
    graphics.lineBetween(
      buttonX + 16,
      buttonY + 14,
      buttonX + NEXT_BUTTON_WIDTH - 18,
      buttonY + 11,
    );
    graphics.lineStyle(1, 0xb88442, 0.25);
    graphics.lineBetween(
      buttonX + 18,
      buttonY + NEXT_BUTTON_HEIGHT - 13,
      buttonX + NEXT_BUTTON_WIDTH - 14,
      buttonY + NEXT_BUTTON_HEIGHT - 16,
    );

    graphics.generateTexture(textureKey, NEXT_BUTTON_TEXTURE_WIDTH, NEXT_BUTTON_TEXTURE_HEIGHT);
    graphics.destroy();
  }

  private positionNextButton(): void {
    if (this.nextButton === undefined) return;

    const { width, height } = this.scale;
    const backgroundX = width - NEXT_BUTTON_PADDING - NEXT_BUTTON_WIDTH / 2;
    const backgroundY = height - NEXT_BUTTON_PADDING - NEXT_BUTTON_HEIGHT / 2;
    const textureOffsetX = (NEXT_BUTTON_TEXTURE_WIDTH - NEXT_BUTTON_WIDTH) / 2;
    const textureOffsetY = (NEXT_BUTTON_TEXTURE_HEIGHT - NEXT_BUTTON_HEIGHT) / 2;

    this.nextButton.setPosition(backgroundX + textureOffsetX, backgroundY + textureOffsetY);
    this.nextButtonLabel?.setPosition(backgroundX, backgroundY);
  }

  private enableNextButton(): void {
    if (this.nextButton === undefined) return;

    this.nextButton.setInteractive();
  }

  private isValidSlideList(slides: unknown): slides is string[] {
    return (
      Array.isArray(slides) &&
      slides.length > 0 &&
      slides.every((slide) => typeof slide === 'string' && slide.length > 0)
    );
  }

  private handleNextButtonOver = (): void => {
    this.nextButton?.setScale(1.05);
    this.nextButtonLabel?.setScale(1.05);
    this.nextButton?.setTexture(NEXT_BUTTON_HOVER_TEXTURE_KEY);
  };

  private handleNextButtonOut = (): void => {
    this.nextButton?.setScale(1);
    this.nextButtonLabel?.setScale(1);
    this.nextButton?.setTexture(NEXT_BUTTON_TEXTURE_KEY);
  };

  private handleNextButtonDown = (): void => {
    if (this.nextButton !== undefined && this.nextButtonLabel !== undefined) {
      this.tweens.add({
        targets: [this.nextButton, this.nextButtonLabel],
        scaleX: 0.96,
        scaleY: 0.96,
        duration: 70,
        yoyo: true,
        ease: 'Sine.easeInOut',
      });
    }

    if (this.currentSlideIndex === this.slides.length - 1) {
      this.startNextScene();
      return;
    }

    this.currentSlideIndex += 1;

    this.showCurrentSlide();
  };

  private startNextScene(): void {
    this.scene.start(this.nextScene, this.nextSceneData);
  }

  private handleShutdown = (): void => {
    this.scale.off('resize', this.positionNextButton, this);

    if (this.nextButton !== undefined) {
      this.tweens.killTweensOf(this.nextButton);
      this.nextButton.destroy();
    }

    if (this.nextButtonLabel !== undefined) {
      this.tweens.killTweensOf(this.nextButtonLabel);
      this.nextButtonLabel.destroy();
    }

    this.currentImage = undefined;
    this.nextButton = undefined;
    this.nextButtonLabel = undefined;
  };
}
