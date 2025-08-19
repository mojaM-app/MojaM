import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SystemPermissionValue } from 'src/core/system-permission.enum';
import { AuthService } from 'src/services/auth/auth.service';
import { PermissionService } from 'src/services/auth/permission.service';
import { GridModule } from '../../static/grid/grid.module';
import { AddAnnouncementsMenu, AnnouncementsMenu } from '../announcements.menu';
import { AnnouncementsGridService } from './announcements-grid.service';

@Component({
  selector: 'app-announcements-list',
  imports: [RouterModule, GridModule],
  templateUrl: './announcements-list.component.html',
  styleUrl: './announcements-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: 'gridService', useClass: AnnouncementsGridService }],
})
export class AnnouncementsListComponent {
  protected readonly AddAnnouncementsMenu = AddAnnouncementsMenu;
  protected readonly showAddButton = signal<boolean>(false);

  public constructor(
    authService: AuthService,
    permissionService: PermissionService,
    router: Router
  ) {
    effect(() => {
      authService.onAuthStateChanged.whenUnauthenticated(() => {
        router.navigateByUrl(AnnouncementsMenu.Path);
      });
    });

    this.showAddButton.set(permissionService.hasPermission(SystemPermissionValue.AddAnnouncements));
  }
}
