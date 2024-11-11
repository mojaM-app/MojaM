import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BrowserWindowSize } from './browser-window-size';

@Injectable({
  providedIn: 'root',
})
export class BrowserWindowService {
  public get onResize$(): Observable<BrowserWindowSize> {
    return this._onResize.asObservable();
  }

  private readonly _onResize: BehaviorSubject<BrowserWindowSize>;

  public constructor() {
    this._onResize = new BehaviorSubject(
      new BrowserWindowSize(window.innerWidth, window.innerHeight)
    );
  }

  public emitEventOnWindowResize(size: ResizeObserverEntry | undefined | null): void {
    const windowSize = this.getBorderBoxSize(size);
    this._onResize.next(windowSize);
  }

  public refreshWindowSize(): void {
    this.emitEventOnWindowResize(null);
  }

  public refreshWindow(): void {
    window.location.reload();
  }

  /**
   * https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserverEntry/borderBoxSize
   * https://drafts.csswg.org/resize-observer/#dom-resizeobserverentry-borderboxsize
   *
   * borderBoxSize vs contentBoxSize
   * https://web.dev/articles/resize-observer#some_details
   */
  private getBorderBoxSize(size: ResizeObserverEntry | undefined | null): BrowserWindowSize {
    const borderBoxSize =
      (size?.borderBoxSize?.length ?? 0) > 0 ? size!.borderBoxSize[0] : undefined;
    return new BrowserWindowSize(
      borderBoxSize?.inlineSize ?? window.innerWidth,
      borderBoxSize?.blockSize ?? window.innerHeight
    );
  }
}
