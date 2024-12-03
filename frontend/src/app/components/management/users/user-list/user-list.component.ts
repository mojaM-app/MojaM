import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GridComponent } from 'src/app/components/static/grid/grid/grid.component';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { PipesModule } from 'src/pipes/pipes.module';
import { AuthService } from 'src/services/auth/auth.service';
import { BrowserWindowService } from 'src/services/browser/browser-window.service';
import { UserDetailsComponent } from './user-details/user-details.component';
import { UserGridService } from './user-grid.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, PipesModule, UserDetailsComponent, GridComponent],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: 'gridService', useClass: UserGridService }],
})
export class UserListComponent extends WithUnsubscribe() {
  public constructor(
    authService: AuthService,
    private _browserWindowService: BrowserWindowService
  ) {
    super();

    this.addSubscription(
      authService.onAuthStateChanged.subscribe(() => {
        this.refreshPage();
      })
    );
  }

  private refreshPage(): void {
    this._browserWindowService.refreshWindow();
  }
}
