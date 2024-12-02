import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { PipesModule } from 'src/pipes/pipes.module';
import { AuthService } from 'src/services/auth/auth.service';
import { BrowserWindowService } from 'src/services/browser/browser-window.service';
import { GridToolbarComponent } from '../../static/grid/grid/grid-toolbar/grid-toolbar.component';
import { GridComponent } from '../../static/grid/grid/grid.component';
import { AddAnnouncementsMenu } from '../announcements.menu';
import { AnnouncementsGridService } from './announcements-grid.service';

@Component({
  selector: 'app-announcements-list',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    MatIconModule,
    MatButtonModule,
    PipesModule,
    GridComponent,
    GridToolbarComponent,
  ],
  templateUrl: './announcements-list.component.html',
  styleUrl: './announcements-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: 'gridService', useClass: AnnouncementsGridService }],
})
export class AnnouncementsListComponent extends WithUnsubscribe() {
  public readonly AddAnnouncementsMenu = AddAnnouncementsMenu;

  public constructor(
    authService: AuthService,
    private _browserWindowService: BrowserWindowService
  ) {
    super();

    this.addSubscription(
      authService.isAuthenticated.subscribe((isAuthenticated: boolean) => {
        if (!isAuthenticated) {
          this.refreshPage();
        }
      })
    );
  }

  private refreshPage(): void {
    //this._browserWindowService.refreshWindow();
  }
}
