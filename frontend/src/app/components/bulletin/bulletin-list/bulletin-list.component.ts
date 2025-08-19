import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { GridModule } from '../../static/grid/grid.module';
import { Router, RouterModule } from '@angular/router';
import { BulletinGridService } from './bulletin-grid.service';
import { AddBulletinMenu, BulletinMenu } from '../bulletin.menu';
import { SystemPermissionValue } from 'src/core/system-permission.enum';
import { AuthService } from 'src/services/auth/auth.service';
import { PermissionService } from 'src/services/auth/permission.service';

@Component({
  selector: 'app-bulletin-list',
  imports: [RouterModule, GridModule],
  templateUrl: './bulletin-list.component.html',
  styleUrl: './bulletin-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: 'gridService', useClass: BulletinGridService }],
})
export class BulletinListComponent {
  protected readonly AddBulletinMenu = AddBulletinMenu;
  protected readonly showAddButton = signal<boolean>(false);

  public constructor(
    authService: AuthService,
    permissionService: PermissionService,
    router: Router
  ) {
    effect(() => {
      authService.onAuthStateChanged.whenUnauthenticated(() => {
        router.navigateByUrl(BulletinMenu.Path);
      });
    });

    this.showAddButton.set(permissionService.hasPermission(SystemPermissionValue.AddBulletin));
  }
}
