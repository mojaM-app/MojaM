import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslationService } from '../../../../services/translate/translation.service';
import { AnnouncementsMenu, CalendarMenu, InformationMenu } from '../news.menu';

export interface NewsTabItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'news-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsHeaderComponent {
  public tabs: NewsTabItem[] = [
    {
      label: this._translationService.get(InformationMenu.Label),
      route: '/' + InformationMenu.Path,
      icon: InformationMenu.Icon,
    },
    {
      label: this._translationService.get(CalendarMenu.Label),
      route: '/' + CalendarMenu.Path,
      icon: CalendarMenu.Icon,
    },
    {
      label: this._translationService.get(AnnouncementsMenu.Label),
      route: '/' + AnnouncementsMenu.Path,
      icon: AnnouncementsMenu.Icon,
    },
  ];

  constructor(
    private _router: Router,
    private _translationService: TranslationService
  ) {}

  public setNextTab(): void {
    const activeTab = this.getActiveTabIndex();
    if (activeTab >= 0 && activeTab < this.tabs.length - 1) {
      this._router.navigate([this.tabs[activeTab + 1].route]);
    }
  }
  public setPrevTab(): void {
    const activeTab = this.getActiveTabIndex();
    if (activeTab > 0) {
      this._router.navigate([this.tabs[activeTab - 1].route]);
    }
  }

  private getActiveTabIndex(): number {
    const currentUrl = this._router.url?.toLowerCase();
    for (let index = 0; index < this.tabs.length; index++) {
      const tab: NewsTabItem = this.tabs[index];
      if (currentUrl.indexOf(tab.route) !== -1) {
        return index;
      }
    }
    return -1;
  }
}
