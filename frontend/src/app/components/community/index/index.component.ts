import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { MatTabGroup } from '@angular/material/tabs';

@Component({
  selector: 'app-community-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndexComponent {
  @ViewChild('tabGroup', { static: true })
  public tabGroup: MatTabGroup | null = null;

  public selectedTab: number = 0;

  private swipeCoord?: [number, number];
  private swipeTime?: number;

  public constructor() {}

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
            if (this.selectedTab > 0) {
              this.selectedTab--;
            }
            break;
          case 'next':
            if (this.selectedTab < (this.tabGroup?._tabs?.length ?? 0) - 1) {
              this.selectedTab++;
            }
            break;
        }
      }
    }
  }
}
