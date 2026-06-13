import Phaser from 'phaser';

export type SlideshowSceneData = {
  slides: string[];
  nextScene: string;
  nextSceneData?: object;
};

/**
 * SlideshowScene displays full-screen images and advances on click.
 */
export default class SlideshowScene extends Phaser.Scene {
  private slides: string[] = [];
  private currentSlideIndex = 0;
  private nextScene = '';
  private nextSceneData?: object;
  private currentImage?: Phaser.GameObjects.Image;

  constructor() {
    super({ key: 'SlideshowScene' });
  }

  init(data: Partial<SlideshowSceneData> = {}): void {
    this.slides = this.isValidSlideList(data.slides) ? data.slides : [];
    this.nextScene = typeof data.nextScene === 'string' ? data.nextScene : '';
    this.nextSceneData = data.nextSceneData;
    this.currentSlideIndex = 0;
    this.currentImage = undefined;
  }

  create(): void {
    this.input.on('pointerdown', this.handlePointerDown);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown);

    if (this.slides.length === 0) {
      console.warn('SlideshowScene received no slides. Starting next scene.');
      this.startNextScene();
      return;
    }

    this.showCurrentSlide();
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

  private isValidSlideList(slides: unknown): slides is string[] {
    return (
      Array.isArray(slides) &&
      slides.length > 0 &&
      slides.every((slide) => typeof slide === 'string' && slide.length > 0)
    );
  }

  private handlePointerDown = (): void => {
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
    this.input.off('pointerdown', this.handlePointerDown);
    this.currentImage = undefined;
  };
}
