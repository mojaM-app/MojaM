import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NewsMenu } from 'src/app/components/news/news.menu';
import { GridModule } from 'src/app/components/static/grid/grid.module';
import { SystemPermissionValue } from 'src/core/system-permission.enum';
import { AuthService } from 'src/services/auth/auth.service';
import { PermissionService } from 'src/services/auth/permission.service';
import { ManagementMenuAddUser } from '../../management.menu';
import { UserDetailsComponent } from './user-details/user-details.component';
import { UserGridService } from './user-grid.service';

@Component({
  selector: 'app-user-list',
  imports: [RouterModule, UserDetailsComponent, GridModule],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: 'gridService', useClass: UserGridService }],
})
export class UserListComponent {
  public readonly ManagementMenuAddUser = ManagementMenuAddUser;

  protected readonly showAddButton = signal<boolean>(false);

  public constructor(
    authService: AuthService,
    permissionService: PermissionService,
    private _router: Router
  ) {
    effect(() => {
      authService.onAuthStateChanged.whenUnauthenticated(() => {
        this.navigateToHomePage();
        this.showAddButton.set(permissionService.hasPermission(SystemPermissionValue.AddUser));
      });
    });
  }

  private navigateToHomePage(): void {
    this._router.navigateByUrl(NewsMenu.Path);
  }
}
