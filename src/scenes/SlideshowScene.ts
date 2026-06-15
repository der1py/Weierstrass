import Phaser from 'phaser';
import {
  createTextureButton,
  destroyUIButton,
  NEXT_BUTTON_HOVER_TEXTURE_KEY,
  NEXT_BUTTON_TEXTURE_KEY,
  positionButton,
  type UIButton,
} from '../ui/menuButton';

export type SlideshowSceneData = {
  slides: string[];
  nextScene: string;
  nextSceneData?: object;
};

const NEXT_BUTTON_PADDING = 28;
const NEXT_BUTTON_DEPTH = 1000;
const SLIDE_FADE_OUT_DURATION = 350;
const SLIDE_FADE_IN_DURATION = 500;
const SLIDE_ZOOM_SCALE = 1.08;

/**
 * SlideshowScene displays full-screen images and advances from a dedicated UI button.
 */
export default class SlideshowScene extends Phaser.Scene {
  private slides: string[] = [];
  private currentSlideIndex = 0;
  private nextScene = '';
  private nextSceneData?: object;
  private currentImage?: Phaser.GameObjects.Image;
  private nextUIButton?: UIButton;
  private slideTransitionTween?: Phaser.Tweens.Tween;
  private isTransitioning = false;

  constructor() {
    super({ key: 'SlideshowScene' });
  }

  init(data: Partial<SlideshowSceneData> = {}): void {
    this.slides = this.isValidSlideList(data.slides) ? data.slides : [];
    this.nextScene = typeof data.nextScene === 'string' ? data.nextScene : '';
    this.nextSceneData = data.nextSceneData;
    this.currentSlideIndex = 0;
    this.currentImage = undefined;
    this.nextUIButton = undefined;
    this.slideTransitionTween = undefined;
    this.isTransitioning = false;
  }

  create(): void {
    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown);

    if (this.slides.length === 0) {
      console.warn('SlideshowScene received no slides. Starting next scene.');
      this.startNextScene();
      return;
    }

    this.createNextButton();
    this.transitionToSlide(this.currentSlideIndex);
  }

  private transitionToSlide(slideIndex: number): void {
    if (this.isTransitioning) return;

    if (slideIndex >= this.slides.length) {
      this.startNextScene();
      return;
    }

    if (slideIndex < 0) return;

    this.isTransitioning = true;
    this.setNextButtonInputEnabled(false);
    this.slideTransitionTween?.stop();

    if (this.currentImage === undefined) {
      this.createSlideImage(slideIndex);
      this.playSlideTransitionIn(slideIndex);
      return;
    }

    const zoomScale = this.getSlideCoverScale(this.currentImage) * SLIDE_ZOOM_SCALE;

    this.slideTransitionTween = this.tweens.add({
      targets: this.currentImage,
      alpha: 0,
      scaleX: zoomScale,
      scaleY: zoomScale,
      duration: SLIDE_FADE_OUT_DURATION,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.setCurrentImageTexture(slideIndex);
        this.playSlideTransitionIn(slideIndex);
      },
    });
  }

  private createSlideImage(slideIndex: number): void {
    const { width, height } = this.scale;
    const slideKey = this.slides[slideIndex];
    const image = this.add.image(width / 2, height / 2, slideKey);

    image.setOrigin(0.5);
    image.setAlpha(0);
    this.applySlideLayout(image, SLIDE_ZOOM_SCALE);

    this.currentImage = image;
  }

  private setCurrentImageTexture(slideIndex: number): void {
    if (this.currentImage === undefined) return;

    this.currentImage.setTexture(this.slides[slideIndex]);
    this.currentImage.setAlpha(0);
    this.applySlideLayout(this.currentImage, SLIDE_ZOOM_SCALE);
  }

  private playSlideTransitionIn(slideIndex: number): void {
    if (this.currentImage === undefined) {
      this.isTransitioning = false;
      return;
    }

    const coverScale = this.getSlideCoverScale(this.currentImage);

    this.slideTransitionTween = this.tweens.add({
      targets: this.currentImage,
      alpha: 1,
      scaleX: coverScale,
      scaleY: coverScale,
      duration: SLIDE_FADE_IN_DURATION,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.currentSlideIndex = slideIndex;
        this.isTransitioning = false;
        this.slideTransitionTween = undefined;
        this.setNextButtonInputEnabled(true);
      },
    });
  }

  private applySlideLayout(image: Phaser.GameObjects.Image, zoomMultiplier = 1): void {
    const { width, height } = this.scale;

    image.setPosition(width / 2, height / 2);
    image.setScale(this.getSlideCoverScale(image) * zoomMultiplier);
  }

  private getSlideCoverScale(image: Phaser.GameObjects.Image): number {
    const { width, height } = this.scale;

    return Math.max(width / image.width, height / image.height);
  }

  private createNextButton(): void {
    const nextButton = createTextureButton(
      this,
      0,
      0,
      NEXT_BUTTON_TEXTURE_KEY,
      NEXT_BUTTON_HOVER_TEXTURE_KEY,
      'Next',
      this.handleNextButtonDown,
      NEXT_BUTTON_DEPTH,
    );

    this.nextUIButton = nextButton;
    this.handleResize();
  }

  private handleResize(): void {
    this.positionNextButton();

    if (this.currentImage !== undefined) {
      this.applySlideLayout(this.currentImage);
    }
  }

  private positionNextButton(): void {
    if (this.nextUIButton === undefined) return;

    const { width, height } = this.scale;
    const x = width - NEXT_BUTTON_PADDING - this.nextUIButton.width / 2;
    const y = height - NEXT_BUTTON_PADDING - this.nextUIButton.height / 2;

    positionButton(this.nextUIButton, x, y);
  }

  private setNextButtonInputEnabled(isEnabled: boolean): void {
    if (this.nextUIButton === undefined) return;

    if (isEnabled) {
      this.nextUIButton.hitArea.setInteractive({ useHandCursor: true });
      return;
    }

    this.nextUIButton.hitArea.disableInteractive();
  }

  private isValidSlideList(slides: unknown): slides is string[] {
    return (
      Array.isArray(slides) &&
      slides.length > 0 &&
      slides.every((slide) => typeof slide === 'string' && slide.length > 0)
    );
  }

  private handleNextButtonDown = (): void => {
    if (this.isTransitioning) return;

    if (this.currentSlideIndex === this.slides.length - 1) {
      this.startNextScene();
      return;
    }

    this.transitionToSlide(this.currentSlideIndex + 1);
  };

  private startNextScene(): void {
    this.scene.start(this.nextScene, this.nextSceneData);
  }

  private handleShutdown = (): void => {
    this.scale.off('resize', this.handleResize, this);
    destroyUIButton(this, this.nextUIButton);
    this.slideTransitionTween?.stop();
    if (this.currentImage !== undefined) {
      this.tweens.killTweensOf(this.currentImage);
    }
    this.currentImage?.destroy();

    this.currentImage = undefined;
    this.nextUIButton = undefined;
    this.slideTransitionTween = undefined;
    this.isTransitioning = false;
  };
}
