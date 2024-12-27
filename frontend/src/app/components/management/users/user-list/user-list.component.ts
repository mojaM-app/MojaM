import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GridModule } from 'src/app/components/static/grid/grid.module';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { AuthService } from 'src/services/auth/auth.service';
import { BrowserWindowService } from 'src/services/browser/browser-window.service';
import { ManagementMenuAddUser } from '../../management.menu';
import { UserDetailsComponent } from './user-details/user-details.component';
import { UserGridService } from './user-grid.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [RouterModule, UserDetailsComponent, GridModule],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: 'gridService', useClass: UserGridService }],
})
export class UserListComponent extends WithUnsubscribe() {
  public readonly ManagementMenuAddUser = ManagementMenuAddUser;

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
