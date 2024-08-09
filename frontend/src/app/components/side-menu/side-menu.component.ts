import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IS_MOBILE } from 'src/app/app.config';
import { PipesModule } from 'src/pipes/pipes.module';
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
  public isDarkMode: boolean = false;

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
    @Inject(IS_MOBILE) public isMobile: boolean,
    public router: Router,
    private _themeService: ThemeService,
  ) {
    this.isDarkMode = this._themeService.isDarkMode();
  }

  public changed(arg: MatSlideToggleChange) {
    this._themeService.onOffDarkMode(arg.checked);
  }

  public showInfo(link: any) {
    console.log(link);
  }
}
