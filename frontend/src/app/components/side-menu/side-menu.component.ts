import { ChangeDetectionStrategy, Component, Inject, signal, WritableSignal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IS_MOBILE } from 'src/app/app.config';
import { SystemPermissionValue } from 'src/core/system-permission.enum';
import { ISideMenuItem } from 'src/interfaces/menu/menu-item';
import { PipesModule } from 'src/pipes/pipes.module';
import { AuthTokenService } from 'src/services/auth/auth-token.service';
import { PermissionService } from 'src/services/auth/permission.service';
import { AnnouncementsMenu } from '../announcements/announcements.menu';
import { BulletinMenu } from '../bulletin/bulletin.menu';
import { CalendarMenu } from '../calendar/calendar.menu';
import { CommunityMenu } from '../community/community.menu';
import { ManagementMenu, ManagementMenuUserList } from '../management/management.menu';
import { NewsMenu } from '../news/news.menu';
import { SettingsMenu } from '../settings/settings.menu';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PipesModule,
    MatSlideToggleModule,
    MatListModule,
    MatIconModule,
    RouterLink,
    RouterLinkActive,
  ],
})
export class SideMenuComponent {
  public readonly menuItems: WritableSignal<ISideMenuItem[]> = signal<ISideMenuItem[]>([]);

  private readonly _menuItems: ISideMenuItem[] = [
    {
      name: NewsMenu.Label,
      icon: NewsMenu.Icon,
      route: NewsMenu.Path,
      isVisible: (): boolean => true,
    },
    {
      name: CalendarMenu.Label,
      icon: CalendarMenu.Icon,
      route: CalendarMenu.Path,
      isVisible: (): boolean => true,
    },
    {
      name: AnnouncementsMenu.Label,
      icon: AnnouncementsMenu.Icon,
      route: AnnouncementsMenu.Path,
      isVisible: (): boolean => true,
    },
    {
      name: BulletinMenu.Label,
      icon: BulletinMenu.Icon,
      route: BulletinMenu.Path,
      isVisible: (): boolean => true,
    },
    {
      name: CommunityMenu.Label,
      icon: CommunityMenu.Icon,
      route: CommunityMenu.Path,
      isVisible: (): boolean => true,
    },
    {
      name: SettingsMenu.Label,
      icon: SettingsMenu.Icon,
      route: SettingsMenu.Path,
      isVisible: (): boolean => true,
    },
    {
      name: ManagementMenu.Label,
      icon: ManagementMenu.Icon,
      isVisible: (): boolean => {
        return this._permissionService.hasAnyPermission([SystemPermissionValue.PreviewUserList]);
      },
      children: [
        {
          name: ManagementMenuUserList.Label,
          icon: ManagementMenuUserList.Icon,
          route: ManagementMenuUserList.Path,
          isVisible: (): boolean => {
            return this._permissionService.hasAnyPermission([
              SystemPermissionValue.PreviewUserList,
            ]);
          },
        },
      ],
    },
  ];

  public constructor(
    @Inject(IS_MOBILE) public isMobile: boolean,
    private _permissionService: PermissionService,
    authTokenService: AuthTokenService
  ) {
    authTokenService.tokenChanged.subscribe(() => {
      const filteredMenuItems = this._menuItems.filter(item => item.isVisible());
      filteredMenuItems.forEach(menuItem => {
        if (menuItem.children) {
          menuItem.children = menuItem.children.filter(child => child.isVisible());
        }
      });
      this.menuItems.set(filteredMenuItems);
    });
  }
}
