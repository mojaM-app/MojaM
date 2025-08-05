import {
  Directive,
  ElementRef,
  Renderer2,
  computed,
  input,
  output,
  Signal,
  signal,
  OnInit,
  OnDestroy,
  HostListener,
  effect,
} from '@angular/core';
import { PullToRefreshService } from 'src/services/pull-to-refresh/pull-to-refresh.service';

@Directive({
  selector: '[appPullToRefresh]',
  exportAs: 'appPullToRefresh',
  standalone: false,
})
export class PullToRefreshDirective implements OnInit, OnDestroy {
  public readonly distanceForRefresh = input<number>(100);
  public readonly refresh = output<void>();

  private readonly _coolDown = signal<number>(30_000); // time in milliseconds before allowing another refresh
  private readonly _pulling = signal<boolean>(false); // whether the user is currently pulling down
  private readonly _currentDistance = signal<number>(0); // current distance pulled down
  private _lastRefreshTime = 0;
  private _startY = 0;

  private _progressEl!: HTMLElement;

  private readonly _pullProgress: Signal<number> = computed(() => {
    const progress = this._currentDistance() / this.distanceForRefresh();
    return Math.min(Math.max(progress, 0), 1);
  });

  public constructor(
    private readonly _el: ElementRef<HTMLElement>,
    private readonly _renderer: Renderer2,
    private readonly _pullToRefreshService: PullToRefreshService
  ) {
    effect(() => {
      const progress = this._pullProgress();

      if (this._pulling()) {
        this._renderer.setStyle(this._progressEl, 'width', `${progress * 100}%`);
      } else {
        this._renderer.setStyle(this._progressEl, 'width', '0%');
      }
    });
  }

  public ngOnInit(): void {
    this.createProgressElement();
  }

  public ngOnDestroy(): void {
    this.removeProgressElement();
  }

  @HostListener('touchstart', ['$event'])
  public onTouchStart(event: TouchEvent): void {
    if (!this._pullToRefreshService.isPullToRefreshEnabled()) {
      return;
    }

    const now = Date.now();
    if (now - this._lastRefreshTime < this._coolDown()) {
      this._pulling.set(false);
      this._currentDistance.set(0);
      return;
    }

    const scrollTop: number = this._el.nativeElement.scrollTop;
    if (scrollTop === 0) {
      this._startY = event.touches[0].clientY;
      this._pulling.set(true);
      this._currentDistance.set(0);
    }
  }

  @HostListener('touchmove', ['$event'])
  public onTouchMove(event: TouchEvent): void {
    if (!this._pulling()) return;

    const currentY: number = event.touches[0].clientY;
    const diff: number = currentY - this._startY;

    if (diff <= 0) {
      this._currentDistance.set(0);
      return;
    }

    const now = Date.now();
    if (now - this._lastRefreshTime < this._coolDown()) {
      this._pulling.set(false);
      this._currentDistance.set(0);
      return;
    }

    this._currentDistance.set(diff);

    if (diff > this.distanceForRefresh()) {
      this._lastRefreshTime = now;
      this.refresh.emit();
      this._pulling.set(false);
      this._currentDistance.set(0);
    }
  }

  @HostListener('touchend')
  public onTouchEnd(): void {
    this._pulling.set(false);
    this._currentDistance.set(0);
  }

  private removeProgressElement(): void {
    if (this._progressEl && this._el.nativeElement.contains(this._progressEl)) {
      this._renderer.removeChild(this._el.nativeElement, this._progressEl);
    }
  }

  private createProgressElement(): void {
    const bar = this._renderer.createElement('div');
    this._renderer.setStyle(bar, 'position', 'absolute');
    this._renderer.setStyle(bar, 'top', '0');
    this._renderer.setStyle(bar, 'left', '0');
    this._renderer.setStyle(bar, 'height', '4px');
    this._renderer.setStyle(bar, 'width', '0%');
    this._renderer.setStyle(bar, 'background-color', 'var(--mat-sys-primary)');
    this._renderer.setStyle(bar, 'transition', 'width 0.1s ease-out');
    this._renderer.setStyle(bar, 'z-index', '1000');

    this._progressEl = bar;
    this._renderer.appendChild(this._el.nativeElement, bar);
  }
}
