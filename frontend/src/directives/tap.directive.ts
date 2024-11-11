import { Directive, HostListener, OnInit, output } from '@angular/core';

@Directive({
  selector: '[tap]',
})
export class TapDirective implements OnInit {
  public tap = output<PointerEvent>();
  public doubleTap = output<PointerEvent>();

  private _lastTap = 0;
  private _tapCount = 0;
  private _tapTimeout: NodeJS.Timeout | undefined = undefined;
  private _tapGesture = {
    name: 'tap',
    enabled: false,
    interval: 250,
  };
  private _doubleTapGesture = {
    name: 'doubleTap',
    enabled: false,
    interval: 300,
  };

  public ngOnInit(): void {
    this._tapGesture.enabled = true;
    this._doubleTapGesture.enabled = true;
  }

  @HostListener('click', ['$event'])
  public handleTaps(e: PointerEvent): void {
    const tapTimestamp = Math.floor(e.timeStamp);
    const isDoubleTap = this._lastTap + this._tapGesture.interval > tapTimestamp;
    if (!this._tapGesture.enabled && !this._doubleTapGesture.enabled) {
      return this.resetTaps();
    }
    this._tapCount++;
    if (isDoubleTap && this._doubleTapGesture.enabled) {
      this.emitTaps(e);
    } else if (!isDoubleTap) {
      this._tapTimeout = setTimeout(() => this.emitTaps(e), this._tapGesture.interval);
    }
    this._lastTap = tapTimestamp;
  }

  private emitTaps(e: PointerEvent): void {
    if (this._tapCount === 1 && this._tapGesture.enabled) {
      this.tap.emit(e);
    } else if (this._tapCount === 2 && this._doubleTapGesture.enabled) {
      this.doubleTap.emit(e);
    }
    this.resetTaps();
  }

  private resetTaps(): void {
    clearTimeout(this._tapTimeout);
    this._tapCount = 0;
    this._tapTimeout = undefined;
    this._lastTap = 0;
  }
}
