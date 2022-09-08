import { Component, ViewChild } from "@angular/core";
import { NewsHeaderComponent } from "./header/header.component";

@Component({
  template: ''
})
export abstract class BaseNewsComponent {
  @ViewChild('header')
  public header: NewsHeaderComponent | null = null;

  private swipeCoord?: [number, number];
  private swipeTime?: number;

  swipe(e: TouchEvent, when: string): void {
    const coord: [number, number] = [
      e.changedTouches[0].clientX,
      e.changedTouches[0].clientY,
    ];
    const time = new Date().getTime();

    if (when === 'start') {
      this.swipeCoord = coord;
      this.swipeTime = time;
    } else if (when === 'end' && this.swipeCoord) {
      const direction = [
        coord[0] - this.swipeCoord[0],
        coord[1] - this.swipeCoord[1],
      ];
      const duration = time - (this.swipeTime ?? 0);

      if (
        duration < 1000 && //
        Math.abs(direction[0]) > 30 && // Long enough
        Math.abs(direction[0]) > Math.abs(direction[1] * 3)
      ) {
        // Horizontal enough
        const swipe = direction[0] < 0 ? 'next' : 'previous';
        switch (swipe) {
          case 'previous':
            this.header?.setPrevTab();
            break;
          case 'next':
            this.header?.setNextTab();
            break;
        }
      }
    }
  }
}
