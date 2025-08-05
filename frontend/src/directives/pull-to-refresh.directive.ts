import {
  Directive,
  ElementRef,
  HostListener,
  input,
  output,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';

@Directive({
  selector: '[appPullToRefresh]',
  exportAs: 'appPullToRefresh',
  standalone: false,
})
export class PullToRefreshDirective {
  public readonly distanceForRefresh = input<number>(50);
  public readonly refresh = output<void>();

  private readonly _pulling: WritableSignal<boolean> = signal(false);
  private readonly _currentDistance: WritableSignal<number> = signal(0);
  private _lastRefreshTime = 0;
  private readonly _coolDown: number = 30_000;

  private _startY = 0;

  public constructor(private readonly _el: ElementRef<HTMLElement>) {}

  public get isPulling(): Signal<boolean> {
    return this._pulling;
  }

  public get pulledDistance(): Signal<number> {
    return this._currentDistance;
  }

  @HostListener('touchstart', ['$event'])
  public onTouchStart(event: TouchEvent): void {
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
    this._currentDistance.set(diff);

    if (diff > this.distanceForRefresh()) {
      const now: number = Date.now();

      if (now - this._lastRefreshTime >= this._coolDown) {
        this._lastRefreshTime = now;
        this.refresh.emit();
      }

      this._pulling.set(false);
    }
  }

  @HostListener('touchend')
  public onTouchEnd(): void {
    this._pulling.set(false);
    this._currentDistance.set(0);
  }
}
