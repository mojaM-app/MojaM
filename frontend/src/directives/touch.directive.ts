import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[touch]',
})
export class TouchDirective {
  @Output()
  public swipeNext: EventEmitter<void> = new EventEmitter<void>();
  @Output()
  public swipePrev: EventEmitter<void> = new EventEmitter<void>();

  private swipeCoord?: [number, number];
  private swipeTime?: number;

  @HostListener('touchstart', ['$event']) public onTouchStart(e: TouchEvent): void {
    this.swipe(e, 'start');
  }

  @HostListener('touchend', ['$event']) public onTouchEnd(e: TouchEvent): void {
    this.swipe(e, 'end');
  }

  private swipe(e: TouchEvent, when: string): void {
    const coord: [number, number] = [e.changedTouches[0].clientX, e.changedTouches[0].clientY];
    const time = new Date().getTime();

    if (when === 'start') {
      this.swipeCoord = coord;
      this.swipeTime = time;
    } else if (when === 'end' && this.swipeCoord) {
      const direction = [coord[0] - this.swipeCoord[0], coord[1] - this.swipeCoord[1]];
      const duration = time - (this.swipeTime ?? 0);

      if (
        duration < 1000 && //
        Math.abs(direction[0]) > 30 &&
        Math.abs(direction[0]) > Math.abs(direction[1] * 3)
      ) {
        const swipe = direction[0] < 0 ? 'next' : 'previous';
        switch (swipe) {
          case 'previous':
            this.swipePrev.next();
            break;
          case 'next':
            this.swipeNext.next();
            break;
        }
      }
    }
  }
}
