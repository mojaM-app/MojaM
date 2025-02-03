import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, model, OnInit, ViewChild } from '@angular/core';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { PipesModule } from 'src/pipes/pipes.module';
import { InfoComponent } from './components/info/info.component';
import { TabComponent } from './components/tab/tab.component';
import { ICommunity } from './interfaces/community.interfaces';
import { CommunityService } from './services/community.service';

@Component({
  selector: 'app-community-index',
  templateUrl: './community.component.html',
  styleUrls: ['./community.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatTabsModule, PipesModule, TabComponent, InfoComponent],
})
export class CommunityComponent extends WithUnsubscribe() implements OnInit {
  @ViewChild('tabGroup', { static: true })
  public tabGroup: MatTabGroup | null = null;

  public readonly model = model<ICommunity>();

  public selectedTab = 0;

  public constructor(private _service: CommunityService) {
    super();
  }

  public ngOnInit(): void {
    this._service.get().subscribe((result: ICommunity) => {
      this.model.set(result);
    });
  }

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

  private scrollTab(): void {
    const ntvEl = this.tabGroup?._elementRef?.nativeElement;

    if (ntvEl) {
      ntvEl.scrollIntoView();
    }
  }
}
