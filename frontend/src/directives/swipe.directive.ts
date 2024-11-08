import { Directive, HostListener, output } from '@angular/core';

@Directive({
  selector: '[swipe]',
})
export class SwipeDirective {
  public swipeNext = output<TouchEvent>();
  public swipePrev = output<TouchEvent>();

  private _swipeCoord?: [number, number];
  private _swipeTime?: number;

  @HostListener('touchstart', ['$event'])
  public onTouchStart(e: TouchEvent): void {
    this.swipe(e, 'start');
  }

  @HostListener('touchend', ['$event'])
  public onTouchEnd(e: TouchEvent): void {
    this.swipe(e, 'end');
  }

  private swipe(e: TouchEvent, when: string): void {
    const coord: [number, number] = [e.changedTouches[0].clientX, e.changedTouches[0].clientY];
    const time = new Date().getTime();

    if (when === 'start') {
      this._swipeCoord = coord;
      this._swipeTime = time;
    } else if (when === 'end' && this._swipeCoord) {
      const direction = [coord[0] - this._swipeCoord[0], coord[1] - this._swipeCoord[1]];
      const duration = time - (this._swipeTime ?? 0);

      if (
        duration < 1000 && //
        Math.abs(direction[0]) > 30 &&
        Math.abs(direction[0]) > Math.abs(direction[1] * 3)
      ) {
        const swipe = direction[0] < 0 ? 'next' : 'previous';
        switch (swipe) {
          case 'previous':
            this.swipePrev.emit(e);
            break;
          case 'next':
            this.swipeNext.emit(e);
            break;
        }
      }
    }
  }
}
