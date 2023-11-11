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

  public selectedTab = 0;

  public selectNextTab(): void {
    if (this.selectedTab < (this.tabGroup?._tabs?.length ?? 0) - 1) {
      this.selectedTab++;
    }
  }

  public selectPrevTab(): void {
    if (this.selectedTab > 0) {
      this.selectedTab--;
    }
  }

  public selectedTabChange(): void {
    this.scrollTab();
  }

  private scrollTab(){
    let ntvEl = this.tabGroup?._elementRef?.nativeElement as any;

    if (ntvEl) {
      ntvEl.scrollIntoView();
    }
  }
}
