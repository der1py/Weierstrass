import Phaser from 'phaser';

const ROOT_SHOT_TIMEOUT_MS = 3000;
const COUNTDOWN_UPDATE_MS = 100;

interface ActivePrompt {
  container: HTMLDivElement;
  input: HTMLInputElement;
  label: HTMLLabelElement;
  timeoutId: number;
  countdownId: number;
  handleKeyDown: (event: KeyboardEvent) => void;
  resolve: (value: number) => void;
  startedAt: number;
}

export default class RootShotPrompt {
  private readonly scene: Phaser.Scene;
  private activePrompt?: ActivePrompt;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.scene.events.once(Phaser.Scenes.Events.DESTROY, this.destroy, this);
  }

  get isOpen(): boolean {
    return this.activePrompt !== undefined;
  }

  prompt(): Promise<number> {
    if (this.activePrompt !== undefined) {
      return Promise.resolve(0);
    }

    return new Promise((resolve) => {
      const container = document.createElement('div');
      const panel = document.createElement('div');
      const label = document.createElement('label');
      const input = document.createElement('input');
      const startedAt = performance.now();

      container.className = 'root-shot-prompt';
      panel.className = 'root-shot-prompt__panel';
      label.className = 'root-shot-prompt__label';
      input.className = 'root-shot-prompt__input';
      input.type = 'text';
      input.inputMode = 'decimal';
      input.autocomplete = 'off';
      input.spellcheck = false;

      this.updateLabel(label, startedAt);

      panel.append(label, input);
      container.append(panel);
      document.body.append(container);

      const handleKeyDown = (event: KeyboardEvent): void => {
        event.stopPropagation();

        if (event.key !== 'Enter') return;

        event.preventDefault();
        this.finishPrompt(this.parseInput(input.value));
      };

      input.addEventListener('keydown', handleKeyDown);
      container.addEventListener('pointerdown', (event) => event.stopPropagation());

      const timeoutId = window.setTimeout(() => {
        this.finishPrompt(this.parseInput(input.value));
      }, ROOT_SHOT_TIMEOUT_MS);
      const countdownId = window.setInterval(() => {
        this.updateLabel(label, startedAt);
      }, COUNTDOWN_UPDATE_MS);

      this.activePrompt = {
        container,
        input,
        label,
        timeoutId,
        countdownId,
        handleKeyDown,
        resolve,
        startedAt,
      };

      requestAnimationFrame(() => input.focus());
    });
  }

  destroy(): void {
    this.finishPrompt(0);
  }

  private finishPrompt(value: number): void {
    const activePrompt = this.activePrompt;

    if (activePrompt === undefined) return;

    window.clearTimeout(activePrompt.timeoutId);
    window.clearInterval(activePrompt.countdownId);
    activePrompt.input.removeEventListener('keydown', activePrompt.handleKeyDown);
    activePrompt.container.remove();

    this.activePrompt = undefined;
    activePrompt.resolve(value);
  }

  private parseInput(value: string): number {
    const trimmedValue = value.trim();

    if (trimmedValue === '') return 0;

    const numericValue = Number(trimmedValue);

    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  private updateLabel(label: HTMLLabelElement, startedAt: number): void {
    const elapsedMs = performance.now() - startedAt;
    const secondsRemaining = Math.max(
      1,
      Math.ceil((ROOT_SHOT_TIMEOUT_MS - elapsedMs) / 1000),
    );
    const unit = secondsRemaining === 1 ? 'second' : 'seconds';

    label.textContent = `Enter a number (${secondsRemaining} ${unit})`;
  }
}
