import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PipesModule } from 'src/pipes/pipes.module';
import { DeviceService } from 'src/services/device/device.service';
import { ThemeService } from '../../../services/theme/theme.service';
import { BulletinMenu } from '../bulletin/bulletin.menu';
import { CommunityMenu } from '../community/community.menu';
import { AnnouncementsMenu, CalendarMenu, InformationMenu, NewsMenu } from '../news/news.menu';
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
    RouterOutlet,
  ],
})
export class SideMenuComponent {
  public isDarkMode = false;
  public isMobile = false;

  public menuItems = [
    {
      name: NewsMenu.Label,
      icon: NewsMenu.Icon,
      children: [
        {
          name: InformationMenu.Label,
          icon: InformationMenu.Icon,
          route: InformationMenu.Path,
        },
        {
          name: CalendarMenu.Label,
          icon: CalendarMenu.Icon,
          route: CalendarMenu.Path,
        },
        {
          name: AnnouncementsMenu.Label,
          icon: AnnouncementsMenu.Icon,
          route: AnnouncementsMenu.Path,
        },
      ],
    },
    {
      name: BulletinMenu.Label,
      icon: BulletinMenu.Icon,
      route: BulletinMenu.Path,
    },
    {
      name: CommunityMenu.Label,
      icon: CommunityMenu.Icon,
      route: CommunityMenu.Path,
    },


    {
      name: SettingsMenu.Label,
      icon: SettingsMenu.Icon,
      route: SettingsMenu.Path,
    },
  ];

  public constructor(
    public router: Router,
    private _themeService: ThemeService,
    deviceService: DeviceService
  ) {
    this.isDarkMode = this._themeService.isDarkMode();
    this.isMobile = deviceService.isMobile();
  }

  public changed(arg: MatSlideToggleChange) {
    this._themeService.onOffDarkMode(arg.checked);
  }

  public showInfo(link: any) {
    console.log(link);
  }
}
