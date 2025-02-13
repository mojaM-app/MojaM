import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, signal, viewChild } from '@angular/core';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { DirectivesModule } from 'src/directives/directives.module';
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
  imports: [
    CommonModule,
    MatTabsModule,
    PipesModule,
    TabComponent,
    InfoComponent,
    DirectivesModule,
  ],
})
export class CommunityComponent extends WithUnsubscribe() implements OnInit {
  public readonly model = signal<ICommunity | undefined>(undefined);
  private readonly tabGroup = viewChild<MatTabGroup>('tabGroup');

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
    if (this.selectedTab < (this.tabGroup()?._tabs?.length ?? 0) - 1) {
      this.selectedTab++;
    }
  }

  public selectPrevTab(): void {
    if (this.selectedTab > 0) {
      this.selectedTab--;
    }
  }
}
