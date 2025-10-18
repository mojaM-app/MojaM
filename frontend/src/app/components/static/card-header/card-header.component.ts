import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PipesModule } from 'src/pipes/pipes.module';

@Component({
  selector: 'app-card-header',
  imports: [CommonModule, MatIconModule, MatButtonModule, PipesModule],
  templateUrl: './card-header.component.html',
  styleUrl: './card-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardHeaderComponent {
  public readonly title = input.required<string>();

  protected readonly hasButtons = signal<boolean>(false);
  protected readonly isOverflowing = signal(false);

  private readonly _buttonsContainer = viewChild<ElementRef<HTMLDivElement>>('buttonsContainer');
  private readonly _cardTitle = viewChild<ElementRef<HTMLElement>>('cardTitle');
  private readonly _cardTitleContainer =
    viewChild<ElementRef<HTMLDivElement>>('cardTitleContainer');

  public constructor() {
    effect(() => {
      if ((this._buttonsContainer()?.nativeElement.children.length ?? 0) > 0) {
        this.hasButtons.set(true);
      }
    });

    effect(onCleanup => {
      const titleEl = this._cardTitle()?.nativeElement;
      const container = this._cardTitleContainer()?.nativeElement;
      if (!titleEl || !container) {
        return;
      }

      let roText: ResizeObserver | null = null;
      let roContainer: ResizeObserver | null = null;
      let rafId: number | null = null;
      let timer: ReturnType<typeof setTimeout> | null = null;

      const measure = (): void => {
        if (rafId) {
          cancelAnimationFrame(rafId);
        }

        rafId = requestAnimationFrame(() => {
          const textWidth = titleEl.scrollWidth;
          const containerWidth = container.clientWidth;
          this.isOverflowing.set(textWidth > containerWidth);
        });
      };

      const debouncedMeasure = (): void => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(measure, 80);
      };

      roText = new ResizeObserver(debouncedMeasure);
      roContainer = new ResizeObserver(debouncedMeasure);

      roText.observe(titleEl);
      roContainer.observe(container);

      requestAnimationFrame(measure);

      // Touch/Mouse scroll handling
      let isDragging = false;
      let startX = 0;
      let scrollLeft = 0;

      const handleStart = (e: MouseEvent | TouchEvent): void => {
        isDragging = true;
        container.style.cursor = 'grabbing';
        container.style.userSelect = 'none';

        startX = 'touches' in e ? e.touches[0].pageX : e.pageX;
        scrollLeft = container.scrollLeft;
      };

      const handleMove = (e: MouseEvent | TouchEvent): void => {
        if (!isDragging) return;
        e.preventDefault();

        const x = 'touches' in e ? e.touches[0].pageX : e.pageX;
        const walk = (startX - x) * 1.5; // Multiply for faster scroll
        container.scrollLeft = scrollLeft + walk;
      };

      const handleEnd = (): void => {
        isDragging = false;
        container.style.cursor = 'grab';
        container.style.userSelect = '';
      };

      // Mouse events
      container.addEventListener('mousedown', handleStart);
      container.addEventListener('mousemove', handleMove);
      container.addEventListener('mouseup', handleEnd);
      container.addEventListener('mouseleave', handleEnd);

      // Touch events
      container.addEventListener('touchstart', handleStart, { passive: true });
      container.addEventListener('touchmove', handleMove, { passive: false });
      container.addEventListener('touchend', handleEnd);

      onCleanup(() => {
        roText?.disconnect();
        roContainer?.disconnect();
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
        if (timer) {
          clearTimeout(timer);
        }

        // Remove event listeners
        container.removeEventListener('mousedown', handleStart);
        container.removeEventListener('mousemove', handleMove);
        container.removeEventListener('mouseup', handleEnd);
        container.removeEventListener('mouseleave', handleEnd);
        container.removeEventListener('touchstart', handleStart);
        container.removeEventListener('touchmove', handleMove);
        container.removeEventListener('touchend', handleEnd);
      });
    });
  }
}
