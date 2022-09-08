import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslationService } from 'src/services/translate/translation.service';

export interface NewsTabItem {
  label: string;
  route: string;
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
      label: this._translationService.get('News/Information/Title'),
      route: '/news/information',
    },
    {
      label: this._translationService.get('News/Calendar/Title'),
      route: '/news/calendar',
    },
    {
      label: this._translationService.get('News/Announcements/Title'),
      route: '/news/announcements',
    },
  ];

  constructor(private _router: Router, private _translationService : TranslationService) {}

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
    const curentUrl = this._router.url?.toLowerCase();
    for (let index = 0; index < this.tabs.length; index++) {
      const tab: NewsTabItem = this.tabs[index];
      if (curentUrl.indexOf(tab.route) !== -1) {
        return index;
      }
    }
    return -1;
  }
}
